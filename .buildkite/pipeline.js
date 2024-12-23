const steps = [];

const pipeline = {
    steps: [
        {
            key: "build",
            label: ":hammer_and_wrench: Install and build",
            commands: [
                `export PATH="/.pulumi/bin:$PATH"`,
                `export PULUMI_ACCESS_TOKEN="$(buildkite-agent secret get PULUMI_ACCESS_TOKEN)"`,
                `npm install && npm install --workspaces`,
                `npm run build`,
            ],
        },
    ],
};

// Build Chris!
if (true) {
    pipeline.steps.push(
        ...[
            {
                label: ":hiking_boot: Ship chris.nunciato.org",
                commands: [
                    `npm run test -w chris`,
                    `npm run $([ "$BUILDKITE_BRANCH" == "main" ] && echo "deploy" || echo "preview"):production -w infra.chris`,
                ],
                depends_on: "build",
            },
        ],
    );
}

// Build Oliver!
if (true) {
    pipeline.steps.push(
        ...[
            {
                label: ":pig:",
                commands: [
                    `npm run $([ "$BUILDKITE_BRANCH" == "main" ] && echo "deploy" || echo "preview"):production -w infra.oliver`,
                ],
                depends_on: "build",
            },
        ],
    );
}

console.log(JSON.stringify(pipeline, null, 4));
