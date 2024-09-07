import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as ecs from "@aws-sdk/client-ecs";

interface MediaProcessorArgs {
    processorPath: string;
    processorAWSAccessKeyID: string;
    processorAWSSecretAccessKey: string;
    processorGitHubAccessToken: string;
    processorDestinationRepo: string;
    processorDestinationRepoBranch: string;
    processorDestinationRepoContentPath: string;
}

export class MediaProcessor extends pulumi.ComponentResource {
    constructor(name: string, args: MediaProcessorArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:index:MediaProcessor", name, args, opts);

        const processorPath = args.processorPath;
        const processorAWSAccessKeyID = args.processorAWSAccessKeyID;
        const processorAWSSecretAccessKey = args.processorAWSSecretAccessKey;
        const processorGitHubAccessToken = args.processorGitHubAccessToken;
        const processorDestinationRepo = args.processorDestinationRepo;
        const processorDestinationRepoBranch = args.processorDestinationRepoBranch;
        const processorDestinationRepoContentPath = args.processorDestinationRepoContentPath;

        const vpc = new awsx.ec2.DefaultVpc("default-vpc", { parent: this });

        const securityGroup = new aws.ec2.SecurityGroup(
            "processor-security-group",
            {
                vpcId: vpc.vpcId,
                egress: [
                    {
                        fromPort: 0,
                        toPort: 0,
                        protocol: "-1",
                        cidrBlocks: ["0.0.0.0/0"],
                        ipv6CidrBlocks: ["::/0"],
                    },
                ],
            },
            { parent: this },
        );

        const repository = new awsx.ecr.Repository(
            "processor-repository",
            {
                forceDelete: true,
            },
            { parent: this },
        );

        const image = new awsx.ecr.Image(
            "processor-image",
            {
                repositoryUrl: repository.url,
                context: processorPath,
                platform: "linux/amd64",
            },
            { parent: this },
        );

        const cluster = new aws.ecs.Cluster("processor-cluster", {}, { parent: this });

        const task = new awsx.ecs.FargateTaskDefinition(
            "processor-task",
            {
                container: {
                    name: "processor-task",
                    image: image.imageUri,
                    cpu: 2048,
                    memory: 8192,
                    memoryReservation: 8192,
                    environment: [
                        {
                            name: "AWS_ACCESS_KEY_ID",
                            value: processorAWSAccessKeyID,
                        },
                        {
                            name: "AWS_SECRET_ACCESS_KEY",
                            value: processorAWSSecretAccessKey,
                        },
                        {
                            name: "GITHUB_PERSONAL_ACCESS_TOKEN",
                            value: processorGitHubAccessToken,
                        },
                        {
                            name: "REPO",
                            value: processorDestinationRepo,
                        },
                        {
                            name: "REPO_BRANCH",
                            value: processorDestinationRepoBranch,
                        },
                        {
                            name: "REPO_CONTENT_PATH",
                            value: processorDestinationRepoContentPath,
                        },
                    ],
                },
            },
            { parent: this },
        );

        const mediaBucket = new aws.s3.Bucket(
            "media",
            {
                forceDestroy: true,
            },
            { parent: this },
        );

        // So this is a bit of drag. There's apparently a bug in our closure
        // serialization that's causing the `pulumi` module to be pulled in, resulting
        // in errors. Seems to have something to do with the FargateTaskDe More here:
        //
        // https://github.com/pulumi/pulumi/issues/14671#issuecomment-2327475619
        pulumi
            .all([
                cluster.arn,
                task.taskDefinition.arn,
                vpc.publicSubnetIds,
                securityGroup.id,
                mediaBucket.id,
            ])
            .apply(
                ([
                    clusterARN,
                    taskDefinitionARN,
                    vpcPublicSubnetId,
                    securityGroupId,
                    mediaBucketId,
                ]) => {
                    mediaBucket.onObjectCreated(
                        "upload-listener",
                        new aws.lambda.CallbackFunction<aws.s3.BucketEvent, void>(
                            "upload-handler",
                            {
                                policies: [
                                    aws.iam.ManagedPolicy.AWSLambdaExecute,
                                    aws.iam.ManagedPolicy.AmazonECSFullAccess,
                                ],
                                // runtime: "nodejs18.x",
                                callback: async bucketArgs => {
                                    console.log(
                                        "Callback invoked with ",
                                        JSON.stringify(bucketArgs.Records),
                                    );

                                    if (!bucketArgs.Records) {
                                        return;
                                    }

                                    for await (const record of bucketArgs.Records) {
                                        const ecsClient = new ecs.ECSClient({
                                            region: "us-west-2",
                                        });
                                        const ecsCommand = new ecs.RunTaskCommand({
                                            cluster: clusterARN,
                                            taskDefinition: taskDefinitionARN,
                                            launchType: "FARGATE",
                                            networkConfiguration: {
                                                awsvpcConfiguration: {
                                                    assignPublicIp: "ENABLED",
                                                    subnets: vpcPublicSubnetId,
                                                    securityGroups: [securityGroupId],
                                                },
                                            },
                                            overrides: {
                                                containerOverrides: [
                                                    {
                                                        name: "processor-task",
                                                        command: [
                                                            "npm",
                                                            "start",
                                                            `s3://${mediaBucketId}/${record.s3.object.key}`,
                                                        ],
                                                    },
                                                ],
                                            },
                                        });

                                        const result = await ecsClient.send(ecsCommand);
                                        console.log(JSON.stringify(result, null, 4));
                                    }
                                },
                            },
                        ),
                    );
                },
            );
    }
}
