import { defineConfig } from "astro/config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import satori from "satori-astro";

const output = "hybrid";
let modulePath = "../../node_modules";

if (!existsSync(modulePath)) {
    modulePath = "node_modules";
}

// https://astro.build/config
export default defineConfig({
    site: "http://localhost:4321",

    output,

    adapter:
        output !== "static"
            ? node({
                  mode: "standalone",
              })
            : undefined,

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

    integrations: [mdx(), sitemap(), tailwind(), preact(), satori()],
});
