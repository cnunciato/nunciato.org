import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        reporters: [
            "default",
            [
                "buildkite-test-collector/vitest/reporter",
                {
                    token: process.env.BUILDKITE_ANALYTICS_TOKEN_CHRIS_VITEST,
                },
            ],
        ],
        includeTaskLocation: true,
    },
});
