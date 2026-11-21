// Content Layer config — lessons collection over src/content/lessons/**/*.mdx.
// The glob loader mirrors the filesystem convention enforced by validate.mjs:
// <lang>/<tier>/<NN>-<slug>.mdx, so entry ids are "<lang>/<tier>/<NN>-<slug>".
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/lessons" }),
  schema: z.object({
    lang: z.string(),
    tier: z.enum(["beginner", "intermediate", "advanced"]),
    title: z.string(),
    description: z.string(),
    order: z.number().int().positive(),
    prerequisites: z.array(z.string()),
    estimatedMinutes: z.number().int().positive(),
    // Content statuses per docs/content-conventions.md (validate.mjs STATUSES).
    status: z.enum(["draft", "review", "published"]),
    sampleIds: z.array(z.string())
  })
});

// Encyclopedia pages over src/content/languages/<slug>.mdx. The schema mirrors
// the data/languages/<slug>.json record fields (docs/content-conventions.md)
// plus `summary` prose; the record's `status` is renamed `languageStatus` on
// pages to avoid colliding with the publish-lifecycle `status`.
const languages = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/languages" }),
  schema: z.object({
    name: z.string(),
    aliases: z.array(z.string()),
    paradigms: z.array(z.string()),
    year: z.number().int().positive(),
    era: z.string().optional(),
    languageStatus: z.enum(["active", "legacy", "historical"]),
    tiobeRank: z.number().int().positive().optional(),
    trackSlug: z.string().optional(),
    helloWorld: z.object({ lang: z.string(), code: z.string() }),
    pageStatus: z.enum(["planned", "written", "published"]),
    title: z.string(),
    summary: z.string(),
    // Content statuses per docs/content-conventions.md (validate.mjs STATUSES).
    status: z.enum(["draft", "review", "published"])
  })
});

export const collections = { lessons, languages };
