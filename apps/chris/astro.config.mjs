import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import preact from "@astrojs/preact";
import serverless from "@repo/astro-adapter-serverless";

// https://astro.build/config
export default defineConfig({
    site: "https://chris.nunciato.org",
    integrations: [mdx(), sitemap(), tailwind(), preact()],
    output: "server",
    adapter: serverless(),
});
