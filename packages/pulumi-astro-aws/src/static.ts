import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as synced from "@pulumi/synced-folder";
import path from "path";

/**
 *
 * @param domain
 * @param subdomain
 * @param domainName
 * @param sourcePath
 * @param publicUrl
 * @param parent
 *
 * Deploys to Amazon S3 and CloudFront.
 */
export function getStaticSite(
    domain: string,
    subdomain: string,
    domainName: string,
    sourcePath: string,
    publicUrl: string,
    bucketProxies:
        | {
              requestPath: string;
              destinationBucket: string;
              region: string;
          }[]
        | null,
    parent: pulumi.ComponentResource,
) {
    const indexDocument = "index.html";
    const errorDocument = "404.html";

    // Create an S3 bucket and configure it as a website.
    const bucket = new aws.s3.Bucket(
        "bucket",
        {
            website: {
                indexDocument: indexDocument,
                errorDocument: errorDocument,
            },
        },
        { parent },
    );

    // Configure ownership controls for the new S3 bucket
    const ownershipControls = new aws.s3.BucketOwnershipControls(
        "ownership-controls",
        {
            bucket: bucket.bucket,
            rule: {
                objectOwnership: "ObjectWriter",
            },
        },
        { parent },
    );

    // Configure public ACL block on the new S3 bucket
    const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
        "public-access-block",
        {
            bucket: bucket.bucket,
            blockPublicAcls: false,
        },
        { parent },
    );

    // Use a synced folder to manage the files of the website.
    const bucketFolder = new synced.S3BucketFolder(
        "bucket-folder",
        {
            path: path.join(sourcePath, "dist"),
            bucketName: bucket.bucket,
            acl: "public-read",
            managedObjects: false,
        },
        { dependsOn: [ownershipControls, publicAccessBlock], parent },
    );

    // Look up your existing Route 53 hosted zone.
    const zone = aws.route53.getZoneOutput({ name: domain }, { parent });

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

            parent,
        },
    );

    // Validate the ACM certificate with DNS.
    const validationOption = certificate.domainValidationOptions[0];
    const certificateValidation = new aws.route53.Record(
        "certificate-validation",
        {
            name: validationOption!.resourceRecordName,
            type: validationOption!.resourceRecordType,
            records: validationOption!.resourceRecordValue.apply(v => [v]),
            zoneId: zone.zoneId,
            ttl: 60,
        },
        { parent },
    );

    const baseCacheBehavior = {
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
    };

    const origins: aws.types.input.cloudfront.DistributionOrigin[] = [
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
    ];

    if (bucketProxies) {
        bucketProxies.forEach(proxy => {
            origins.push({
                originId: `arn:aws:s3:::${proxy.destinationBucket}`,
                domainName: `${proxy.destinationBucket}.s3.${proxy.region}.amazonaws.com`,
                customOriginConfig: {
                    originProtocolPolicy: "http-only",
                    httpPort: 80,
                    httpsPort: 443,
                    originSslProtocols: ["TLSv1.2"],
                },
            });
        });
    }

    let orderedCacheBehaviors: aws.types.input.cloudfront.DistributionOrderedCacheBehavior[] = [];

    if (bucketProxies) {
        bucketProxies.forEach(proxy => {
            orderedCacheBehaviors.push({
                ...baseCacheBehavior,
                targetOriginId: `arn:aws:s3:::${proxy.destinationBucket}`,
                pathPattern: `${proxy.requestPath}/*`,
                forwardedValues: {
                    cookies: {
                        forward: "none",
                    },
                    queryString: false,
                    headers: [
                        "Origin",
                        "Access-Control-Request-Headers",
                        "Access-Control-Request-Method",
                    ],
                },
            });
        });
    }

    // Create a CloudFront CDN to distribute and cache the website.
    const cdn = new aws.cloudfront.Distribution(
        "cdn",
        {
            enabled: true,
            origins,
            defaultCacheBehavior: {
                ...baseCacheBehavior,
            },
            orderedCacheBehaviors,
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
        },
        { parent },
    );

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
        { dependsOn: certificate, parent },
    );
}
