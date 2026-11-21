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

export const collections = { lessons };
