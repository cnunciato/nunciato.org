const { execSync } = require("child_process");

const pipeline = {
    steps: [],
};

// NB: The only way to escape the dollar signs here is using` "$$".
// https://buildkite.com/docs/agent/v3/cli-pipeline#environment-variable-substitution
const installAndBuildCommands = [
    // `echo "Installing Mise..."`,
    // `curl https://mise.run | sh`,
    // `export PATH="$$HOME/.local/bin:$$PATH"`,

    // `echo "Installing Mise-managed tooling..."`,
    // `mise activate --shims`,
    // `mise install`,
    // `export PATH="$$(mise where pulumi)/pulumi:$$PATH"`,
    // `export PATH="$$(mise where node)/bin:$$PATH"`,

    `echo "Signing into Pulumi..."`,
    `export PULUMI_ACCESS_TOKEN="$$(buildkite-agent secret get PULUMI_ACCESS_TOKEN)"`,
    `pulumi whoami`,

    `echo "Installing workspaces..."`,
    `npm install`,
    `npm install --workspaces`,
    `npm run lint`,
    `npm run build`,
];

function touched(filePath) {
    return execSync("git diff --name-only HEAD~1 HEAD")
        .toString()
        .split("\n")
        .some(file => file.includes(filePath));
}

// Determine if this is a PR or a push to main
const isMainBranch = process.env.BUILDKITE_BRANCH === "main";
const operationType = isMainBranch ? "deploy" : "preview";
const buildLabel = isMainBranch ? "Build and deploy" : "Build and preview for";

// Build my site on every push.
pipeline.steps.push(
    ...[
        {
            label: `:hiking_boot: ${buildLabel} Chris's website`,
            plugins: ["praneetloke/setup-pulumi#4982d0a4d950f820ef374ab03b3db2d151c67fc3"],
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
                label: `:pig: ${buildLabel} Oliver's website`,
                plugins: ["praneetloke/setup-pulumi"],
                commands: [
                    ...installAndBuildCommands,
                    `npm run $([ "$BUILDKITE_BRANCH" == "main" ] && echo "deploy" || echo "preview"):production -w infra.oliver`,
                ],
            },
        ],
    );
}

console.log(JSON.stringify(pipeline, null, 4));
