import type { APIContext, APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ url }: APIContext) => {
    const filename = url.searchParams.get("f");
    return fetch(`https://s3.amazonaws.com/cnunciato-website-media/audio/${filename}`);
};
