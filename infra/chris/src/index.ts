import { Config, log, runtime, all } from "@pulumi/pulumi";
import { AstroSite } from "@repo/pulumi-astro-aws";
import { MediaProcessor } from "@repo/pulumi-media-processor";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const config = new Config();
const sourcePath = config.require("sourcePath");
const domain = config.require("domain");
const subdomain = config.require("subdomain");

log.info("Building site...");
execSync(`npm run build -- --site "https://${subdomain}.${domain}"`, {
    cwd: sourcePath,
    stdio: "inherit",
});

const output = existsSync(join(sourcePath, "dist", "server")) ? "server" : "static";
log.info(`Detected '${output}' output.`);

log.info(`${!runtime.isDryRun() ? "Deploying..." : ""}`);
const site = new AstroSite("site", {
    sourcePath,
    domain,
    subdomain,
    output,
    bucketProxies: [
        {
            requestPath: "/audio",
            destinationBucket: "cnunciato-website-media",
            region: "us-east-1",
        },
    ],
});

log.info("Deploying media processor...");
const processor = new MediaProcessor("processor", {
    processorPath: config.require("processorPath"),
    processorAWSAccessKeyID: config.require("processorAWSAccessKeyID"),
    processorAWSSecretAccessKey: config.require("processorAWSSecretAccessKey"),
    processorGitHubAccessToken: config.require("processorGitHubAccessToken"),
    processorDestinationRepo: config.require("processorDestinationRepo"),
    processorDestinationRepoBranch: config.require("processorDestinationRepoBranch"),
    processorDestinationRepoContentPath: config.require("processorDestinationRepoContentPath"),
});

export const { url } = site;
