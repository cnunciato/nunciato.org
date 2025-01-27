import type { CollectionEntry } from "astro:content";

type CollectionItem =
    | CollectionEntry<"photos">
    | CollectionEntry<"videos">
    | CollectionEntry<"sounds">
    | CollectionEntry<"words">;

export const noDrafts = (item: CollectionItem) => item.data.draft !== true || import.meta.env.DEV;

export const byDate = (a: CollectionItem, b: CollectionItem) =>
    a.data.date > b.data.date ? -1 : 1;

export const byDateAsc = (a: CollectionItem, b: CollectionItem) =>
    a.data.date > b.data.date ? 1 : -1;
