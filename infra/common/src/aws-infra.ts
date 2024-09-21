import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

interface AWSInfraArgs {
    agentToken: string;
}

const bootstrapScript = `#!/bin/bash

# Install Cypress dependencies for Linux.
sudo dnf install -y xorg-x11-server-Xvfb gtk3-devel nss alsa-lib

# Install Node.js and npm.
sudo dnf install -y nodejs

# Install Pulumi.
curl -fsSL https://get.pulumi.com | sh
`;

export class AWSInfra extends pulumi.ComponentResource {
    constructor(name: string, args: AWSInfraArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:index:AstroSite", name, args, opts);

        const bucket = new aws.s3.Bucket("bucket");

        const bucketObject = new aws.s3.BucketObject(
            "bootstrap.sh",
            {
                bucket: bucket.bucket,
                content: bootstrapScript,
                contentType: "text/plain",
            },
            { parent: this },
        );

        const bucketPolicy = new aws.iam.Policy(
            "bucket-policy",
            {
                policy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: ["s3:GetObject"],
                            Resource: [bucketObject.arn],
                        },
                    ],
                },
            },
            { parent: this },
        );

        const stack = new aws.cloudformation.Stack(
            "stack",
            {
                templateUrl: "https://s3.amazonaws.com/buildkite-aws-stack/latest/aws-stack.yml",
                capabilities: ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM", "CAPABILITY_AUTO_EXPAND"],

                // https://buildkite.com/docs/agent/v3/elastic-ci-aws/parameters
                // https://buildkite.com/docs/agent/v3/elastic-ci-aws/managing-elastic-ci-stack#customizing-instances-with-a-bootstrap-script
                parameters: {
                    MaxSize: "1",
                    MinSize: "0",
                    BuildkiteAgentToken: args.agentToken,
                    BootstrapScriptUrl: pulumi.interpolate`s3://${bucket.bucket}/${bucketObject.key}`,
                    ManagedPolicyARNs: bucketPolicy.arn,
                    EnableDockerUserNamespaceRemap: "false",
                },
            },
            { parent: this },
        );
    }
}
