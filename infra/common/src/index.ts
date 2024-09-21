import { BuildkiteCluster } from "./cluster";

const cluster = new BuildkiteCluster("cluster", {
    repoName: "cnunciato/nunciato.org",
    repoUrl: "https://github.com/cnunciato/nunciato.org.git",
});

export const { token } = cluster;
