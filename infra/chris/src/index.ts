import { Config, log } from "@pulumi/pulumi";
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
    stdio: "inherit",
    cwd: sourcePath,
});

const output = log.info("Deploying...");
const site = new AstroSite("site", {
    sourcePath,
    domain,
    subdomain,
    output: existsSync(join(sourcePath, "dist", "server"))
        ? "server"
        : "static",
});

export const { url } = site;
