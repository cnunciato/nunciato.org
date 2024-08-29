import type { APIRoute } from "astro";
import { satoriAstroOG } from "satori-astro";
import { html } from "satori-html";

export const GET: APIRoute = async () => {
    const fontFile = await fetch(
        "https://og-playground.vercel.app/inter-latin-ext-700-normal.woff",
    );
    const fontData: ArrayBuffer = await fontFile.arrayBuffer();

    return await satoriAstroOG({
        template: html`<div class="flex flex-col bg-gray-900 text-white text-4xl h-full px-12 py-8">
            <h1 class="my-4 py-0">This is a title.</h1>
            <p class="my-0">It's awesome. You should check it out.</p>
        </div>`,
        width: 1200,
        height: 628,
    }).toResponse({
        satori: {
            fonts: [
                {
                    name: "Inter Latin",
                    data: fontData,
                    style: "normal",
                },
            ],
        },
    });
};
