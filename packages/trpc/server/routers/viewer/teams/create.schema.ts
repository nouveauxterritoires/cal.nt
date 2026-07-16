import slugify from "@calcom/lib/slugify";
import { z } from "zod";

export const ZCreateInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().transform((val) => slugify(val.trim())),
  bio: z.string().optional(),
});

export type TCreateInputSchema = z.infer<typeof ZCreateInputSchema>;
