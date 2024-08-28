import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as synced from "@pulumi/synced-folder";
import * as childProcess from "child_process";
import path from "path";

interface AstroSiteArgs {
    sourcePath: string;
    domain: string;
    subdomain: string;
    output: "static" | "server";
}

export class AstroSite extends pulumi.ComponentResource {
    url: pulumi.Output<string>;

    constructor(
        name: string,
        args: AstroSiteArgs,
        opts?: pulumi.ComponentResourceOptions,
    ) {
        super("pkg:index:AstroSite", name, args, opts);

        const domain = args.domain;
        const subdomain = args.subdomain;
        const domainName = `${subdomain}.${domain}`;
        const publicUrl = `https://${subdomain}.${domain}`;

        if (args.output === "server") {
            const repo = new awsx.ecr.Repository("repo", {
                forceDelete: true,
            });

            const role = new aws.iam.Role("role", {
                assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
                    Service: "build.apprunner.amazonaws.com",
                }),
            });

            const attachment = new aws.iam.RolePolicyAttachment("attachment", {
                role: role.name,
                policyArn:
                    aws.iam.ManagedPolicy.AWSAppRunnerServicePolicyForECRAccess,
            });

            const image = new awsx.ecr.Image("image", {
                repositoryUrl: repo.url,
                context: args.sourcePath,
                platform: "linux/amd64",
            });

            const service = new aws.apprunner.Service("app", {
                serviceName: domainName.split(".").join("-"),
                sourceConfiguration: {
                    authenticationConfiguration: {
                        accessRoleArn: role.arn,
                    },
                    imageRepository: {
                        imageIdentifier: image.imageUri,
                        imageRepositoryType: "ECR",
                        imageConfiguration: {
                            port: "4321",
                            runtimeEnvironmentVariables: {
                                SITE: publicUrl,
                            },
                        },
                    },
                },
                instanceConfiguration: {
                    cpu: "1024",
                    memory: "2048",
                },
                networkConfiguration: {
                    egressConfiguration: {
                        egressType: "DEFAULT",
                    },
                    ingressConfiguration: {
                        isPubliclyAccessible: true,
                    },
                },
            });

            const usEast1 = new aws.Provider("us-east-provider", {
                region: "us-east-1",
            });

            const zone = aws.route53.getZoneOutput({ name: domain });

            const certificate = new aws.acm.Certificate(
                "certificate",
                {
                    domainName: domainName,
                    validationMethod: "DNS",
                },
                {
                    provider: usEast1,
                },
            );

            const validationOption = certificate.domainValidationOptions[0];
            const certificateValidation = new aws.route53.Record(
                "certificate-validation",
                {
                    name: validationOption!.resourceRecordName,
                    type: validationOption!.resourceRecordType,
                    records: [validationOption!.resourceRecordValue],
                    zoneId: zone.zoneId,
                    ttl: 60,
                },
            );

            const validation = new aws.acm.CertificateValidation(
                "validation",
                {
                    certificateArn: certificate.arn,
                },
                {
                    provider: usEast1,
                },
            );

            const association = new aws.apprunner.CustomDomainAssociation(
                "custom-domain",
                {
                    domainName: domainName,
                    serviceArn: service.arn,
                    enableWwwSubdomain: true,
                },
            );

            association.certificateValidationRecords.apply(records => {
                records.forEach((record, i) => {
                    new aws.route53.Record(`validation-record-${i}`, {
                        name: record.name,
                        zoneId: zone.zoneId,
                        ttl: 60,
                        type: record.type,
                        records: [record.value],
                    });
                });
            });

            // https://docs.aws.amazon.com/general/latest/gr/apprunner.html
            const record = new aws.route53.Record(
                domainName,
                {
                    name: subdomain,
                    zoneId: zone.zoneId,
                    type: "CNAME",
                    records: [service.serviceUrl],
                    ttl: 60,
                },
                { dependsOn: certificate },
            );

            this.url = pulumi.output(publicUrl);
            this.registerOutputs({
                url: this.url,
            });
        } else {
            const indexDocument = "index.html";
            const errorDocument = "404.html";

            // Create an S3 bucket and configure it as a website.
            const bucket = new aws.s3.Bucket("bucket", {
                website: {
                    indexDocument: indexDocument,
                    errorDocument: errorDocument,
                },
            });

            // Configure ownership controls for the new S3 bucket
            const ownershipControls = new aws.s3.BucketOwnershipControls(
                "ownership-controls",
                {
                    bucket: bucket.bucket,
                    rule: {
                        objectOwnership: "ObjectWriter",
                    },
                },
            );

            // Configure public ACL block on the new S3 bucket
            const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
                "public-access-block",
                {
                    bucket: bucket.bucket,
                    blockPublicAcls: false,
                },
            );

            // Use a synced folder to manage the files of the website.
            const bucketFolder = new synced.S3BucketFolder(
                "bucket-folder",
                {
                    path: path.join(args.sourcePath, "dist"),
                    bucketName: bucket.bucket,
                    acl: "public-read",
                    managedObjects: false,
                },
                { dependsOn: [ownershipControls, publicAccessBlock] },
            );

            // Look up your existing Route 53 hosted zone.
            const zone = aws.route53.getZoneOutput({ name: domain });

            // Provision a new ACM certificate.
            const certificate = new aws.acm.Certificate(
                "certificate",
                {
                    domainName: domainName,
                    validationMethod: "DNS",
                },
                {
                    // ACM certificates must be created in the us-east-1 region.
                    provider: new aws.Provider("us-east-provider", {
                        region: "us-east-1",
                    }),
                },
            );

            // Validate the ACM certificate with DNS.
            const validationOption = certificate.domainValidationOptions[0];
            const certificateValidation = new aws.route53.Record(
                "certificate-validation",
                {
                    name: validationOption!.resourceRecordName,
                    type: validationOption!.resourceRecordType,
                    records: [validationOption!.resourceRecordValue],
                    zoneId: zone.zoneId,
                    ttl: 60,
                },
            );

            // Create a CloudFront CDN to distribute and cache the website.
            const cdn = new aws.cloudfront.Distribution("cdn", {
                enabled: true,
                origins: [
                    {
                        originId: bucket.arn,
                        domainName: bucket.websiteEndpoint,
                        customOriginConfig: {
                            originProtocolPolicy: "http-only",
                            httpPort: 80,
                            httpsPort: 443,
                            originSslProtocols: ["TLSv1.2"],
                        },
                    },
                ],
                defaultCacheBehavior: {
                    targetOriginId: bucket.arn,
                    viewerProtocolPolicy: "redirect-to-https",
                    allowedMethods: ["GET", "HEAD", "OPTIONS"],
                    cachedMethods: ["GET", "HEAD", "OPTIONS"],
                    defaultTtl: 600,
                    maxTtl: 600,
                    minTtl: 600,
                    forwardedValues: {
                        queryString: true,
                        cookies: {
                            forward: "all",
                        },
                    },
                },
                priceClass: "PriceClass_100",
                customErrorResponses: [
                    {
                        errorCode: 404,
                        responseCode: 404,
                        responsePagePath: `/${errorDocument}`,
                    },
                ],
                restrictions: {
                    geoRestriction: {
                        restrictionType: "none",
                    },
                },
                aliases: [domainName],
                viewerCertificate: {
                    cloudfrontDefaultCertificate: false,
                    acmCertificateArn: certificate.arn,
                    sslSupportMethod: "sni-only",
                },
            });

            // Create a DNS A record to point to the CDN.
            const record = new aws.route53.Record(
                domainName,
                {
                    name: subdomain,
                    zoneId: zone.zoneId,
                    type: "A",
                    aliases: [
                        {
                            name: cdn.domainName,
                            zoneId: cdn.hostedZoneId,
                            evaluateTargetHealth: true,
                        },
                    ],
                },
                { dependsOn: certificate },
            );

            this.url = pulumi.output(publicUrl);
            this.registerOutputs({
                url: this.url,
            });
        }
    }
}
