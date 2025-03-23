const { execSync } = require("child_process");

const pipeline = {
    steps: [],
};

const buildSteps = [
    `export MISE_INSTALL_PATH="/usr/local/bin/mise"`,
    `curl https://mise.run | sh`,
    `eval "$$(mise activate bash)"`,
    `mise install`,
    `mise where pulumi`,
    `$$(mise where pulumi)/pulumi --version`,
    // `ls -al $$(mise where node)`,
    // `export PATH="$$(mise where pulumi):$$PATH"`,
    // `export PATH="$$(mise where node):$$PATH"`,
    // `echo $$PATH`,
    // `export PULUMI_ACCESS_TOKEN="$$(buildkite-agent secret get PULUMI_ACCESS_TOKEN)"`,
    // `pulumi whoami`,
    // `npm install && npm install --workspaces`,
    // `npm run build`,
];

function touched(filePath) {
    return execSync("git diff --name-only HEAD~1 HEAD")
        .toString()
        .split("\n")
        .some(file => file.includes(filePath));
}

if (touched("apps/chris") || true) {
    pipeline.steps.push(
        ...[
            {
                label: ":hiking_boot: Build and deploy Chris's website",
                commands: [
                    ...buildSteps,
                    // `npm run test -w chris`,
                    // `pulumi install`,
                    // `npm run $([ "$BUILDKITE_BRANCH" == "main" ] && echo "deploy" || echo "preview"):production -w infra.chris`,
                ],
            },
        ],
    );
}

if (touched("apps/oliver")) {
    pipeline.steps.push(
        ...[
            {
                label: ":pig: Build and deploy Oliver's website",
                commands: [
                    ...buildSteps,
                    `npm run $([ "$BUILDKITE_BRANCH" == "main" ] && echo "deploy" || echo "preview"):production -w infra.oliver`,
                ],
            },
        ],
    );
}

console.log(JSON.stringify(pipeline, null, 4));
