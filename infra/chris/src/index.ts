import { Config } from "@pulumi/pulumi";
import { AstroSite } from "@repo/pulumi-astro-aws";

const config = new Config();
const site = new AstroSite("site", {
    output: "static",
    sourcePath: config.require("sourcePath"),
    domain: config.require("domain"),
    subdomain: config.require("subdomain"),
});

export const { url } = site;
