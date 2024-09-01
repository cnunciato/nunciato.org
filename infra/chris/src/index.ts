import { Config, log, runtime } from "@pulumi/pulumi";
import { AstroSite } from "@repo/pulumi-astro-aws";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const config = new Config();
const sourcePath = config.require("sourcePath");
const domain = config.require("domain");
const subdomain = config.require("subdomain");

const processorPath = config.require("processorPath");
const processorAWSAccessKeyID = config.require("processorAWSAccessKeyID");
const processorAWSSecretAccessKey = config.require("processorAWSSecretAccessKey");
const processorGitHubAccessToken = config.require("processorGitHubAccessToken");
const processorDestinationRepo = config.require("processorDestinationRepo");
const processorDestinationRepoBranch = config.require("processorDestinationRepoBranch");
const processorDestinationRepoContentPath = config.require("processorDestinationRepoContentPath");

log.info("Building site...");
execSync(`npm run build -- --site "https://${subdomain}.${domain}"`, {
    cwd: sourcePath,
    stdio: "inherit",
});

// Choose a deployment type based on the build output.
const output = existsSync(join(sourcePath, "dist", "server")) ? "server" : "static";

log.info(`Detected '${output}' output. ${!runtime.isDryRun() ? "Deploying..." : ""}`);
const site = new AstroSite("site", {
    sourcePath,
    domain,
    subdomain,
    output,
});

/////////////////////////////////////////////////////

import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as ecs from "@aws-sdk/client-ecs";

const vpc = new awsx.ec2.DefaultVpc("default-vpc");

const securityGroup = new aws.ec2.SecurityGroup("processor-security-group", {
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
});

const repository = new awsx.ecr.Repository("processor-repository", {
    forceDelete: true,
});

const image = new awsx.ecr.Image("processor-image", {
    repositoryUrl: repository.url,
    context: processorPath,
    platform: "linux/amd64",
});

const cluster = new aws.ecs.Cluster("processor-cluster");

const task = new awsx.ecs.FargateTaskDefinition("processor-task", {
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
});

const mediaBucket = new aws.s3.Bucket("media", {
    forceDestroy: true,
});

mediaBucket.onObjectCreated(
    "onUploadEvent",
    new aws.lambda.CallbackFunction<aws.s3.BucketEvent, void>("onUploadHandler", {
        policies: [
            aws.iam.ManagedPolicy.AWSLambdaExecute,
            aws.iam.ManagedPolicy.AmazonECSFullAccess,
        ],
        runtime: "nodejs18.x",
        callback: async bucketArgs => {
            // console.log("Callback invoked with ", JSON.stringify(bucketArgs.Records));

            if (!bucketArgs.Records) {
                return;
            }

            for await (const record of bucketArgs.Records) {
                const ecsClient = new ecs.ECSClient({ region: "us-west-2" });
                const ecsCommand = new ecs.RunTaskCommand({
                    cluster: cluster.arn.get(),
                    taskDefinition: task.taskDefinition.get().arn.get(),
                    launchType: "FARGATE",
                    networkConfiguration: {
                        awsvpcConfiguration: {
                            assignPublicIp: "ENABLED",
                            subnets: vpc.publicSubnetIds.get(),
                            securityGroups: [securityGroup.id.get()],
                        },
                    },
                    overrides: {
                        containerOverrides: [
                            {
                                name: "processor-task",
                                command: [
                                    "npm",
                                    "start",
                                    `s3://${mediaBucket.id.get()}/${record.s3.object.key}`,
                                ],
                            },
                        ],
                    },
                });

                const result = await ecsClient.send(ecsCommand);
                // console.log(JSON.stringify(result, null, 4));
            }
        },
    }),
);

export const { url } = site;
