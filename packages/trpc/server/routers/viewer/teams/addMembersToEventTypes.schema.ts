import { z } from "zod";

export const ZAddMembersToEventTypesInputSchema = z.object({
  teamId: z.number(),
  userIds: z.array(z.number()),
  eventTypeIds: z.array(z.number()),
});

export type TAddMembersToEventTypesInputSchema = z.infer<typeof ZAddMembersToEventTypesInputSchema>;
