import * as pulumi from "@pulumi/pulumi";
import * as buildkite from "@pulumiverse/buildkite";
import * as github from "@pulumi/github";

interface BuildkiteClusterArgs {
    clusterId?: pulumi.Input<string>;
    repoName: string;
    repoUrl: string;
}

const pipelineSteps = `steps:
  - label: ":pipeline:"
    command: node ./.buildkite/pipeline.js | buildkite-agent pipeline upload
    agents:
      queue: default
`;

export class BuildkiteCluster extends pulumi.ComponentResource {
    token: pulumi.Output<string>;

    constructor(name: string, args: BuildkiteClusterArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:index:AstroSite", name, args, opts);

        if (!args.clusterId) {
            args.clusterId = buildkite.cluster.getClusterOutput({ name: "Default cluster" }).id;
        }

        const queue = new buildkite.cluster.ClusterQueue(
            "queue",
            {
                clusterId: args.clusterId,
                key: "default",
            },
            { parent: this },
        );

        const defaultQueue = new buildkite.cluster.ClusterDefaultQueue(
            "default-queue",
            {
                clusterId: args.clusterId,
                queueId: queue.id,
            },
            { parent: this },
        );

        const agentToken = new buildkite.cluster.ClusterAgentToken(
            "agent-token",
            {
                clusterId: args.clusterId,
                description: "agent-token",
            },
            { parent: this },
        );

        const pipeline = new buildkite.pipeline.Pipeline(
            "pipeline",
            {
                name: "chris.nunciato.org",
                description: "Ship it. :rocket:",
                clusterId: args.clusterId,
                repository: args.repoUrl,
                defaultBranch: "main",
                steps: pipelineSteps,
                emoji: ":buildkite:",
            },
            { parent: this },
        );

        const repo = github.getRepositoryOutput(
            {
                fullName: args.repoName,
            },
            { parent: this },
        );

        const webhook = new github.RepositoryWebhook(
            "webhook",
            {
                repository: repo.name,
                configuration: {
                    url: pipeline.webhookUrl,
                    contentType: "application/json",
                    insecureSsl: false,
                },
                active: true,
                events: ["deployment", "push", "pull_request"],
            },
            { parent: this },
        );

        this.token = agentToken.token;

        this.registerOutputs({
            token: this.token,
        });
    }
}
