import { defineCollection, z } from "astro:content";

const blog = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: z.string().optional(),
    }),
});

const photos = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.coerce.date(),
        photo: z.any().optional(),
        links: z.any().optional(),
        draft: z.any().optional(),
        drop: z.any().optional(),
    }),
});

const words = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        date: z.coerce.date(),
        description: z.string().optional(),
        summary: z.string().optional(),
        photo: z
            .object({
                preview: z.string(),
                caption: z.string().optional(),
            })
            .optional(),
    }),
});

export const collections = {
    blog,
    photos,
    words,
};
