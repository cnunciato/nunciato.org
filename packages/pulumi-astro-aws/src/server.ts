import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

/**
 *
 * @param domain
 * @param subdomain
 * @param domainName
 * @param sourcePath
 * @param publicUrl
 * @param parent
 *
 * Deploys to Amazon S3 with a Cloudfront CDN.
 */
export function getServerSite(
    domain: string,
    subdomain: string,
    domainName: string,
    sourcePath: string,
    publicUrl: string,
    parent: pulumi.ComponentResource,
) {
    const repo = new awsx.ecr.Repository("repo", {
        forceDelete: true,
    });

    const role = new aws.iam.Role(
        "role",
        {
            assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
                Service: "build.apprunner.amazonaws.com",
            }),
        },
        { parent },
    );

    const attachment = new aws.iam.RolePolicyAttachment(
        "attachment",
        {
            role: role.name,
            policyArn:
                aws.iam.ManagedPolicy.AWSAppRunnerServicePolicyForECRAccess,
        },
        { parent },
    );

    const image = new awsx.ecr.Image(
        "image",
        {
            repositoryUrl: repo.url,
            context: sourcePath,
            platform: "linux/amd64",
        },
        { parent },
    );

    const service = new aws.apprunner.Service(
        "app",
        {
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
        },
        { parent },
    );

    const usEast1 = new aws.Provider(
        "us-east-provider",
        {
            region: "us-east-1",
            // accessKey: aws.config.accessKey,
            // secretKey: aws.config.secretKey,
            // token: aws.config.token,
            // assumeRole: aws.config.assumeRole,
        },
        { parent },
    );

    const zone = aws.route53.getZoneOutput({ name: domain });

    const certificate = new aws.acm.Certificate(
        "certificate",
        {
            domainName: domainName,
            validationMethod: "DNS",
        },
        {
            provider: usEast1,
            parent,
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
        { parent },
    );

    const validation = new aws.acm.CertificateValidation(
        "validation",
        {
            certificateArn: certificate.arn,
        },
        {
            provider: usEast1,
            parent,
        },
    );

    const association = new aws.apprunner.CustomDomainAssociation(
        "custom-domain",
        {
            domainName: domainName,
            serviceArn: service.arn,
            enableWwwSubdomain: true,
        },
        { parent },
    );

    association.certificateValidationRecords.apply(records => {
        records.forEach((record, i) => {
            new aws.route53.Record(
                `validation-record-${i}`,
                {
                    name: record.name,
                    zoneId: zone.zoneId,
                    ttl: 60,
                    type: record.type,
                    records: [record.value],
                },
                { parent },
            );
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
        { dependsOn: certificate, parent },
    );
}
