import { checkAdminOrOwner } from "@calcom/features/auth/lib/checkAdminOrOwner";
import { TeamEventTypeRepository } from "@calcom/features/teams/repositories/TeamEventTypeRepository";
import { TeamMembershipRepository } from "@calcom/features/teams/repositories/TeamMembershipRepository";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TRemoveHostsFromEventTypesInputSchema } from "./removeHostsFromEventTypes.schema";

type RemoveHostsFromEventTypesOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TRemoveHostsFromEventTypesInputSchema;
};

export const removeHostsFromEventTypesHandler = async ({ ctx, input }: RemoveHostsFromEventTypesOptions) => {
  const caller = await new TeamMembershipRepository().findByUserIdAndTeamId({
    userId: ctx.user.id,
    teamId: input.teamId,
  });
  if (!caller || !checkAdminOrOwner(caller.role)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Only admins or owners can remove hosts." });
  }

  const eventTypeRepo = new TeamEventTypeRepository();
  // Scope to event types that belong to the team so callers cannot touch others.
  const eventTypes = await eventTypeRepo.findTeamEventTypes({
    teamId: input.teamId,
    eventTypeIds: input.eventTypeIds,
  });

  return eventTypeRepo.removeHosts({
    userIds: input.userIds,
    eventTypeIds: eventTypes.map((eventType) => eventType.id),
  });
};

export default removeHostsFromEventTypesHandler;
