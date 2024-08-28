import { defineConfig } from "astro/config";
import { readFileSync } from "fs";

import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import opengraphImages, { presets } from "astro-opengraph-images";
import satori from "satori-astro";

// https://astro.build/config
export default defineConfig({
    site: "http://localhost:4321",

    output: "server",
    adapter: node({
        mode: "standalone",
    }),

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
                        data: readFileSync(
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
