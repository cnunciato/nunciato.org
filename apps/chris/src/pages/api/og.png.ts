import type { APIRoute, APIContext } from "astro";
import { getCollection } from "astro:content";
import { satoriAstroOG } from "satori-astro";
import { html } from "satori-html";

export const prerender = false;

export const GET: APIRoute = async ({ url }: APIContext) => {
    // Pull the content type and ID from the querystring.
    const contentType = url.searchParams.get("type");
    const contentId = url.searchParams.get("id");

    let title = "This is a title.";
    let description = "It's awesome. You should check it out";

    // Look 'em up.
    if (contentType === "words") {
        const words = await getCollection(contentType);
        const post = words.find(w => w.slug === contentId);

        if (post) {
            title = post.data.title;
            description = post.data.summary || post.data.description || "";
        }
    }

    if (contentType === "photos") {
        const words = await getCollection(contentType);
        const photo = words.find(w => w.slug === contentId);

        if (photo) {
            title = photo.data.title;
            description = photo.data.description || "";
        }
    }

    const fontFile = await fetch(
        "https://og-playground.vercel.app/inter-latin-ext-700-normal.woff",
    );
    const fontData: ArrayBuffer = await fontFile.arrayBuffer();

    return await satoriAstroOG({
        template: html`<div class="flex flex-col bg-gray-900 text-white text-4xl h-full px-12 py-8">
            <h1 class="my-4 py-0">${title}</h1>
            <p class="my-0">${description}</p>
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
