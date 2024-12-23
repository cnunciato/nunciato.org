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
});

export const { url } = site;
