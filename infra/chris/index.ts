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

const lambda = new aws.lambda.Function("lambda-function", {
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("../../apps/chris/dist"),
    }),
    runtime: "nodejs20.x",
    role: role.arn,
    handler: "server/entry.handler",
    memorySize: 2048,
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
