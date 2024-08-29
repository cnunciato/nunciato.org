import { Config, log, runtime } from "@pulumi/pulumi";
import { AstroSite } from "@repo/pulumi-astro-aws";
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

// Choose a deployment type based on the build output.
const output = existsSync(join(sourcePath, "dist", "server")) ? "server" : "static";

log.info(`Detected '${output}' output. ${!runtime.isDryRun() ? "Deploying..." : ""}`);
const site = new AstroSite("site", {
    sourcePath,
    domain,
    subdomain,
    output,
});

export const { url } = site;
