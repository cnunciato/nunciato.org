import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const appRunnerService = new aws.apprunner.Service("app", {
    serviceName: "app",
    sourceConfiguration: {
        codeRepository: {
            repositoryUrl: "https://github.com/cnunciato/nunciato.org",
            sourceCodeVersion: {
                type: "BRANCH",
                value: "main",
            },
            codeConfiguration: {
                configurationSource: "API",
                codeConfigurationValues: {
                    runtime: "NODEJS_20",
                    buildCommand:
                        "npm install && npm install --workspaces && npm run build",
                    startCommand: "node apps/chris/dist/server/entry.mjs",
                },
            },
        },
        autoDeploymentsEnabled: true,
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

export const serviceUrl = appRunnerService.serviceUrl;
