import { AstroAdapter, AstroIntegration } from "astro";

const name = "@repo/astro-adapter-serverless";

export default function createIntegration(): AstroIntegration {
    return {
        name,
        hooks: {
            "astro:config:setup": ({ config, updateConfig }) => {
                updateConfig({
                    build: {
                        client: new URL("client/", config.outDir),
                        server: new URL("server/", config.outDir),
                        serverEntry: "entry.mjs",
                    },
                });
            },

            "astro:config:done": ({ setAdapter }) => {
                setAdapter({
                    name,
                    serverEntrypoint: `${name}/index`,
                    supportedAstroFeatures: {
                        staticOutput: "stable",
                        serverOutput: "stable",
                        hybridOutput: "stable",
                        assets: {
                            supportKind: "stable",
                            isSharpCompatible: true,
                            isSquooshCompatible: false,
                        },
                    },
                    adapterFeatures: {
                        functionPerRoute: false,
                        edgeMiddleware: false,
                    },
                    exports: ["handler"],
                });
            },

            // "astro:build:done:" ({ config, updateConfig }) => {},
        },
    };
}
