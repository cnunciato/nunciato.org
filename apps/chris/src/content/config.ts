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
                exif: z.any().optional(),
                created: z.coerce.date().optional().nullable(),
            })
            .optional(),
        links: z.any().optional(),
        draft: z.any().optional(),
        drop: z.any().optional(),
    }),
});

const sounds = defineCollection({
    type: "content",
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

const videos = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        date: z.coerce.date(),
        draft: z.boolean().optional(),
        description: z.string().optional(),
        video: z.object({
            url: z.string(),
            preview: z.string().optional(),
            thumb: z.string().optional(),
            duration: z.number(),
        }),
    }),
});

const words = defineCollection({
    type: "content",
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        summary: z.string().optional(),
        date: z.coerce.date(),
        draft: z.boolean().optional(),
        photo: z.object({
            title: z.string().optional().nullable(),
            caption: z.string().optional().nullable(),
            preview: z.string().optional().nullable(),
            thumb: z.string().optional().nullable(),
            url: z.string().optional().nullable(),
            created: z.coerce.date().optional().nullable(),
        }),
        links: z.any().optional(),
        drop: z.any().optional(),
        canonical: z.string().optional(),
    }),
});

export const collections = {
    photos,
    sounds,
    videos,
    words,
};
