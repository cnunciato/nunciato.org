const { execSync } = require("child_process");

const pipeline = {
    steps: [],
};

const buildSteps = [
    `export MISE_DATA_DIR="/usr/local/share/mise"`,
    `export MISE_INSTALL_PATH="/usr/local/bin/mise"`,
    `curl https://mise.run | sh`,
    `mise install`,
    `export PATH="$(mise where node)/bin:$PATH"`,
    `export PATH="$(mise where pulumi)/bin:$PATH"`,
    `echo $PATH`,
    `export PULUMI_ACCESS_TOKEN="$(buildkite-agent secret get PULUMI_ACCESS_TOKEN)"`,
    `mise `,
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
