import * as pulumi from "@pulumi/pulumi";
import { getStaticSite } from "./static.js";
import { getServerSite } from "./server.js";

interface AstroSiteArgs {
    sourcePath: string;
    domain: string;
    subdomain: string;
    output: "static" | "server";
    bucketProxies?: {
        requestPath: string;
        destinationBucket: string;
        region: string;
    }[];
}

export class AstroSite extends pulumi.ComponentResource {
    url: pulumi.Output<string>;

    constructor(name: string, args: AstroSiteArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:index:AstroSite", name, args, opts);

        const domain = args.domain;
        const subdomain = args.subdomain;
        const domainName = `${subdomain}.${domain}`;
        const publicUrl = `https://${subdomain}.${domain}`;
        const s3BucketMapping = args.bucketProxies;
        const sourcePath = args.sourcePath;

        if (args.output === "server") {
            getServerSite(domain, subdomain, domainName, sourcePath, publicUrl, this);
        } else {
            getStaticSite(
                domain,
                subdomain,
                domainName,
                sourcePath,
                publicUrl,
                s3BucketMapping || null,
                this,
            );
        }

        this.url = pulumi.output(publicUrl);
        this.registerOutputs({
            url: this.url,
        });
    }
}
