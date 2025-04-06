const { execSync } = require("child_process");

const pipeline = {
    steps: [],
};

// NB: The only way to escape the dollar signs (is necessary) here is using`
// "$$". Backslash ("\$") doesn't work (or would presumably have to be
// double-escaped as "\\$" in JS).
// https://buildkite.com/docs/agent/v3/cli-pipeline#environment-variable-substitution
const installAndBuildCommands = [
    `echo "Installing Mise..."`,
    `curl https://mise.run | sh`,
    `export PATH="/Users/agent/.local/bin:$$PATH"`,

    `echo "Installing Mise-managed tooling..."`,
    `mise activate --shims`,
    `mise install`,
    // `export PATH="$$(mise where pulumi)/pulumi:$$PATH"`,
    // `export PATH="$$(mise where node)/bin:$$PATH"`,

    `echo "Signing into Pulumi..."`,
    `export PULUMI_ACCESS_TOKEN="$$(buildkite-agent secret get PULUMI_ACCESS_TOKEN)"`,
    `pulumi whoami`,

    `echo "Installing workspaces..."`,
    `npm install`,
    `npm install --workspaces`,
    `npm run build`,
];

function touched(filePath) {
    return execSync("git diff --name-only HEAD~1 HEAD")
        .toString()
        .split("\n")
        .some(file => file.includes(filePath));
}

// Build my site on every push.
pipeline.steps.push(
    ...[
        {
            label: ":hiking_boot: Build and deploy Chris's website",
            commands: [
                ...installAndBuildCommands,
                `npm run $([ "$BUILDKITE_BRANCH" == "main" ] && echo "deploy" || echo "preview"):production -w infra.chris`,
            ],
        },
    ],
);

if (touched("apps/oliver")) {
    pipeline.steps.push(
        ...[
            {
                label: ":pig: Build and deploy Oliver's website",
                commands: [
                    ...installAndBuildCommands,
                    `npm run $([ "$BUILDKITE_BRANCH" == "main" ] && echo "deploy" || echo "preview"):production -w infra.oliver`,
                ],
            },
        ],
    );
}

console.log(JSON.stringify(pipeline, null, 4));
