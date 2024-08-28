import { Config } from "@pulumi/pulumi";
import { AstroSite } from "@repo/pulumi-astro-apprunner";

const config = new Config();

const site = new AstroSite("site", {
    domain: config.require("domain"),
    subdomain: config.require("subdomain"),
    sourcePath: config.require("sourcePath"),
});

export const { serviceUrl, url } = site;
