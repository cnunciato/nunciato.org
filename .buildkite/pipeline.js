const { execSync } = require("child_process");

const pipeline = {
    steps: [],
};

const installAndBuildCommands = [
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
            plugins: [
                {
                    "praneetloke/setup-pulumi": {
                        "use-oidc": true,
                        audience: "urn:pulumi:org:cnunciato",
                        "pulumi-token-type": "urn:pulumi:token-type:access_token:personal",
                        "pulumi-token-scope": "user:cnunciato",
                    },
                },
            ],
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
