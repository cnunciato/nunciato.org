import { defineCollection, z } from "astro:content";

const photos = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.coerce.date(),
        photo: z
            .object({
                title: z.string().optional().nullable(),
                caption: z.string().optional().nullable(),
                preview: z.string().optional().nullable(),
                thumb: z.string().optional().nullable(),
                url: z.string().optional().nullable(),
                created: z.coerce.date().optional().nullable(),
            })
            .optional(),
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
                title: z.string().optional().nullable(),
                caption: z.string().optional().nullable(),
                preview: z.string().optional().nullable(),
                thumb: z.string().optional().nullable(),
                url: z.string().optional().nullable(),
                created: z.coerce.date().optional().nullable(),
            })
            .optional(),
    }),
});

export const collections = {
    photos,
    words,
};
