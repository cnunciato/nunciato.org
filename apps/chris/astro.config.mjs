import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import opengraphImages, { presets } from "astro-opengraph-images";
import satori, { satoriAstroOG } from "satori-astro";

// Uncomment for server output.
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
    site: import.meta.env.SITE || "http://localhost:4321",

    // Uncomment for server output.
    output: "server",
    adapter: node({
        mode: "standalone",
    }),

    // output: "static",

    image: {
        domains: ["s3.amazonaws.com"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "s3.amazonaws.com",
                pathname: "cnunciato-website-media",
            },
        ],
    },

    integrations: [
        mdx(),
        sitemap(),
        tailwind(),
        preact(),
        opengraphImages({
            options: {
                fonts: [
                    {
                        name: "Roboto",
                        weight: 400,
                        style: "normal",
                        data: fs.readFileSync(
                            "../../node_modules/@fontsource/roboto/files/roboto-latin-400-normal.woff",
                        ),
                    },
                ],
            },
            render: presets.blackAndWhite,
        }),
        satori(),
    ],
});
