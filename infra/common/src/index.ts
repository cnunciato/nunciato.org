import { BuildkiteCluster } from "./cluster";
import { buildPipeline } from "./pipeline";

const cluster = new BuildkiteCluster("cluster", {
    repoName: "cnunciato/nunciato.org",
    repoUrl: "https://github.com/cnunciato/nunciato.org.git",
});

buildPipeline();

export const { token } = cluster;
