import { z } from "zod";

export const ZRemoveHostsFromEventTypesInputSchema = z.object({
  teamId: z.number(),
  userIds: z.array(z.number()),
  eventTypeIds: z.array(z.number()),
});

export type TRemoveHostsFromEventTypesInputSchema = z.infer<typeof ZRemoveHostsFromEventTypesInputSchema>;
