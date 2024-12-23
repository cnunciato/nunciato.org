const { execSync } = require("child_process");

const pipeline = {
    steps: [],
};

function touched(filePath) {
    return execSync("git diff --name-only HEAD~1 HEAD")
        .toString()
        .split("\n")
        .some(file => file.includes(filePath));
}

if (touched("apps/chris")) {
    pipeline.steps.push(
        ...[
            {
                label: ":hiking_boot: Build and deploy Chris's website",
                commands: [
                    `npm install && npm install --workspaces`,
                    `npm run build`,
                    `npm run test -w chris`,
                    `npm run $([ "$BUILDKITE_BRANCH" == "main" ] && echo "deploy" || echo "preview"):production -w infra.chris`,
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
                    `npm install && npm install --workspaces`,
                    `npm run build`,
                    `npm run $([ "$BUILDKITE_BRANCH" == "main" ] && echo "deploy" || echo "preview"):production -w infra.oliver`,
                ],
            },
        ],
    );
}

console.log(JSON.stringify(pipeline, null, 4));
