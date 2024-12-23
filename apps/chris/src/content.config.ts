import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const photos = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/photos" }),
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
                exif: z.any().optional(),
                created: z.coerce.date().optional().nullable(),
            })
            .optional(),
        links: z.any().optional(),
        draft: z.any().optional(),
        drop: z.any().optional(),
    }),
});

const words = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/words" }),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        summary: z.string().optional(),
        date: z.coerce.date(),
        draft: z.boolean().optional(),
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
        drop: z.any().optional(),
        canonical: z.string().optional(),
    }),
});

const sounds = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/sounds" }),
    schema: z.object({
        title: z.string(),
        date: z.coerce.date(),
        draft: z.boolean().optional(),
        description: z.string().optional(),
        sound: z.object({
            url: z.string(),
            preview: z.string().optional(),
            thumb: z.string().optional(),
            duration: z.number(),
        }),
    }),
});

export const collections = {
    photos,
    sounds,
    words,
};
