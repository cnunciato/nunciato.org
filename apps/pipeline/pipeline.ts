const { execSync } = require("child_process");
import { Pipeline } from "@buildkite/buildkite-sdk";

const pipeline = new Pipeline();
// pipeline.agents = {
//     queue: "hosted-linux",
// };

const installAndBuildCommands = [
    `pulumi whoami`,

    `echo "Installing workspaces..."`,
    `npm install`,
    `npm install --workspaces`,
    `npm run lint`,
    `npm run build`,
];

function touched(filePath: string) {
    return execSync("git diff --name-only HEAD~1 HEAD")
        .toString()
        .split("\n")
        .some((file: string) => file.includes(filePath));
}

// Determine if this is a PR or a push to main
const isMain = process.env.BUILDKITE_BRANCH === "main";
const action = isMain ? "deploy" : "preview";
const label = isMain ? "Build and deploy" : "Build and preview for";

// Build my site on every push.
pipeline.addStep({
    label: `:hiking_boot: ${label} Chris's website`,
    plugins: [
        {
            "praneetloke/setup-pulumi": {
                use_oidc: true,
                audience: "urn:pulumi:org:cnunciato",
                pulumi_token_type: "urn:pulumi:token-type:access_token:personal",
                pulumi_token_scope: "user:cnunciato",
            },
        },
    ],
    commands: [...installAndBuildCommands, `npm run ${action}:production -w infra.chris`],
});

if (touched("apps/oliver")) {
    pipeline.addStep({
        label: `:pig: ${label} Oliver's website`,
        plugins: ["praneetloke/setup-pulumi"],
        commands: [...installAndBuildCommands, `npm run ${action}:production -w infra.oliver`],
    });
}

console.log(pipeline.toYAML());
