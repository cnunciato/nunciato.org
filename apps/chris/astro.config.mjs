import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
    site: "https://chris.nunciato.org",
    integrations: [mdx(), sitemap(), tailwind(), preact()],
    output: "server",
    adapter: node({
        mode: "standalone",
    }),
});
