import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as buildkite from "@pulumiverse/buildkite";
import * as github from "@pulumi/github";

const cluster = new buildkite.cluster.Cluster("cluster");

const queue = new buildkite.cluster.ClusterQueue("queue", {
    clusterId: cluster.id,
    key: "default",
});

const defaultQueue = new buildkite.cluster.ClusterDefaultQueue("default-queue", {
    clusterId: cluster.id,
    queueId: queue.id,
});

const agentToken = new buildkite.cluster.ClusterAgentToken("agent-token", {
    clusterId: cluster.id,
    description: "agent-token",
});

const pipelineSteps = `steps:
  - label: ":pipeline"
    command: buildkite-agent pipeline upload
    agents:
      queue: default
`;

const pipeline = new buildkite.pipeline.Pipeline("pipeline", {
    name: "pipeline",
    clusterId: cluster.id,
    repository: "https://github.com/cnunciato/nunciato.org.git",
    defaultBranch: "main",
    steps: pipelineSteps,
});

const bootstrapScript = `#!/bin/bash

# Install Cypress dependencies for Linux.
sudo dnf install -y xorg-x11-server-Xvfb gtk3-devel nss alsa-lib

# Install Node.js and npm.
sudo dnf install -y nodejs

# Install Pulumi.
curl -fsSL https://get.pulumi.com | sh
whoami
echo $HOME
which pulumi
`;

const bucket = new aws.s3.Bucket("bucket");

const bucketObject = new aws.s3.BucketObject("bootstrap.sh", {
    bucket: bucket.bucket,
    content: bootstrapScript,
    contentType: "text/plain",
});

const bucketPolicy = new aws.iam.Policy("bucket-policy", {
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
});

const stack = new aws.cloudformation.Stack("stack", {
    templateUrl: "https://s3.amazonaws.com/buildkite-aws-stack/latest/aws-stack.yml",
    capabilities: ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM", "CAPABILITY_AUTO_EXPAND"],

    // https://buildkite.com/docs/agent/v3/elastic-ci-aws/parameters
    // https://buildkite.com/docs/agent/v3/elastic-ci-aws/managing-elastic-ci-stack#customizing-instances-with-a-bootstrap-script
    parameters: {
        MaxSize: "1",
        MinSize: "0",
        BuildkiteAgentToken: agentToken.token,
        BootstrapScriptUrl: pulumi.interpolate`s3://${bucket.bucket}/${bucketObject.key}`,
        ManagedPolicyARNs: bucketPolicy.arn,
        EnableDockerUserNamespaceRemap: "false",
    },
});

const repo = github.getRepositoryOutput({
    fullName: "cnunciato/nunciato.org",
});

const webhook = new github.RepositoryWebhook("webhook", {
    repository: repo.name,
    configuration: {
        url: pipeline.webhookUrl,
        contentType: "application/json",
        insecureSsl: false,
    },
    active: true,
    events: ["deployment", "push", "pull_request"],
});
