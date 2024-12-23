const steps = [];

const pipeline = {
    steps: [
        {
            label: ":rocket: Ship it!",
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
            `npm run test -w chris`,
            `npm run $([ "$BUILDKITE_BRANCH" == "main" ] && echo "deploy" || echo "preview"):production -w infra.chris`,
        ],
    );
}

// Build Oliver!
if (true) {
    pipeline.steps.push(
        ...[
            `npm run $([ "$BUILDKITE_BRANCH" == "main" ] && echo "deploy" || echo "preview"):production -w infra.oliver`,
        ],
    );
}

console.log(JSON.stringify(pipeline, null, 4));
