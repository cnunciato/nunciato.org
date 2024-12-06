import * as buildkite from "buildkite-pipeline-sdk";

export const buildPipeline = () => {
    const pipeline = new buildkite.StepBuilder();

    pipeline.addCommandStep({
        commands: [`npm test`],
    });

    pipeline.addCommandStep({
        commands: [`npm run build`],
    });

    pipeline.write();
};
