import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteTitle, siteDescription } from "../consts";
import { byDate, noDrafts } from "../utils";

export async function GET(context) {
    const posts = (await getCollection("words", noDrafts)).sort(byDate);

    return rss({
        title: siteTitle,
        description: siteDescription,
        site: context.site,
        items: posts
            .sort((a, b) => (a.data.date < b.data.date ? 1 : -1))
            .map(post => ({
                title: post.title,
                description: post.data.description,
                pubDate: post.data.date,
                link: `/words/${post.id}/`,
            })),
    });
}
