const { execSync } = require("child_process");

function wasTouched(filePath) {
    return execSync("git diff --name-only HEAD~1 HEAD")
        .toString()
        .split("\n")
        .some(file => file.includes(filePath));
}

if (wasTouched("apps/chris")) {
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
                depends_on: "build",
            },
        ],
    );
}

if (wasTouched("apps/oliver")) {
    pipeline.steps.push(
        ...[
            {
                label: ":pig: Build and deploy Oliver's website",
                commands: [
                    `npm install && npm install --workspaces`,
                    `npm run build`,
                    `npm run $([ "$BUILDKITE_BRANCH" == "main" ] && echo "deploy" || echo "preview"):production -w infra.oliver`,
                ],
                depends_on: "build",
            },
        ],
    );
}

console.log(JSON.stringify(pipeline, null, 4));
