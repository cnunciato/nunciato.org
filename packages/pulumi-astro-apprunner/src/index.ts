import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

interface AstroSiteArgs {
    sourcePath: string;
    domain: string;
    subdomain: string;
}

export class AstroSite extends pulumi.ComponentResource {
    serviceUrl: pulumi.Output<string>;
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

        this.serviceUrl = pulumi.interpolate`https://${service.serviceUrl}`;
        this.url = pulumi.output(publicUrl);

        this.registerOutputs({
            serviceUrl: this.serviceUrl,
            url: this.url,
        });
    }
}
