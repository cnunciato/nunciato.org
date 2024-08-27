import { AstroSite } from "@repo/pulumi-astro-apprunner";

const site = new AstroSite("site", {
    domain: "nunciato.org",
    subdomain: "chris",
    sourcePath: "../../apps/chris",
});

export const { serviceUrl, url } = site;
