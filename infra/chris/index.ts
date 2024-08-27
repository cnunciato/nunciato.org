import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const role = new aws.iam.Role("role", {
    assumeRolePolicy: {
        Version: "2012-10-17",
        Statement: [
            {
                Action: "sts:AssumeRole",
                Principal: {
                    Service: "lambda.amazonaws.com",
                },
                Effect: "Allow",
            },
        ],
    },
});

const attachment = new aws.iam.RolePolicyAttachment(
    "lambda-role-policy-attachment",
    {
        role: role,
        policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
    },
);

const code = new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("../../out/apps/chris/dist"),
    node_modules: new pulumi.asset.FileArchive("../../out/node_modules"),
    "package.json": new pulumi.asset.FileAsset("../../out/package.json"),
});

const codeBucket = new aws.s3.Bucket("code-bucket");

const ownershipControls = new aws.s3.BucketOwnershipControls(
    "ownership-controls",
    {
        bucket: codeBucket.id,
        rule: {
            objectOwnership: "ObjectWriter",
        },
    },
);

const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
    "public-access-block",
    {
        bucket: codeBucket.id,
        blockPublicAcls: false,
    },
);

const codeBucketObject = new aws.s3.BucketObject(
    "app.zip",
    {
        bucket: codeBucket.id,
        source: code,
        acl: "public-read",
    },
    { dependsOn: [publicAccessBlock, ownershipControls] },
);

const lambda = new aws.lambda.Function("lambda-function", {
    runtime: "nodejs20.x",
    role: role.arn,
    handler: "server/entry.handler",
    memorySize: 2048,
    s3Bucket: codeBucket.id,
    s3Key: codeBucketObject.id,
});

const permission = new aws.lambda.Permission("lambda-permission", {
    action: "lambda:InvokeFunction",
    principal: "apigateway.amazonaws.com",
    function: lambda,
});

const api = new aws.apigatewayv2.Api("api", {
    protocolType: "HTTP",
    target: lambda.arn,
});

export const endpoint = api.apiEndpoint;
