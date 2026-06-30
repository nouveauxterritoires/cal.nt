import { MAX_NB_INVITES } from "@calcom/lib/constants";
import { MembershipRole } from "@calcom/prisma/enums";
import { z } from "zod";

export const ZInviteMemberInputSchema = z.object({
  teamId: z.number(),
  emails: z
    .union([z.string().email(), z.array(z.string().email())])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .refine((val) => val.length <= MAX_NB_INVITES, {
      message: `You can only invite up to ${MAX_NB_INVITES} members at once`,
    }),
  role: z.nativeEnum(MembershipRole).optional().default(MembershipRole.MEMBER),
});

export type TInviteMemberInputSchema = z.infer<typeof ZInviteMemberInputSchema>;
