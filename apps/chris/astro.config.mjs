import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
    site: import.meta.env.SITE || "http://localhost:4321",

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

    integrations: [mdx(), sitemap(), tailwind(), preact()],
});
