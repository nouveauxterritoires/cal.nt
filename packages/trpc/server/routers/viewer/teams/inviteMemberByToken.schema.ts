import { z } from "zod";

export const ZInviteMemberByTokenInputSchema = z.object({
  token: z.string(),
});

export type TInviteMemberByTokenInputSchema = z.infer<typeof ZInviteMemberByTokenInputSchema>;
