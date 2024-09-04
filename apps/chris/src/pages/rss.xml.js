import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteTitle, siteDescription } from "../consts";

export async function GET(context) {
    const posts = await getCollection("words");

    return rss({
        title: siteTitle,
        description: siteDescription,
        site: context.site,
        items: posts
            .filter(post => post.data.draft !== true || import.meta.env.DEV)
            .sort((a, b) => (a.data.date < b.data.date ? 1 : -1))
            .map(post => ({
                title: post.title,
                description: post.data.description,
                pubDate: post.data.date,
                link: `/words/${post.slug}/`,
            })),
    });
}
