import { checkAdminOrOwner } from "@calcom/features/auth/lib/checkAdminOrOwner";
import { TeamEventTypeRepository } from "@calcom/features/teams/repositories/TeamEventTypeRepository";
import { TeamMembershipRepository } from "@calcom/features/teams/repositories/TeamMembershipRepository";
import { SchedulingType } from "@calcom/prisma/enums";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TAddMembersToEventTypesInputSchema } from "./addMembersToEventTypes.schema";

type AddMembersToEventTypesOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TAddMembersToEventTypesInputSchema;
};

export const addMembersToEventTypesHandler = async ({ ctx, input }: AddMembersToEventTypesOptions) => {
  const caller = await new TeamMembershipRepository().findByUserIdAndTeamId({
    userId: ctx.user.id,
    teamId: input.teamId,
  });
  if (!caller || !checkAdminOrOwner(caller.role)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Only admins or owners can assign members." });
  }

  const eventTypeRepo = new TeamEventTypeRepository();
  const eventTypes = await eventTypeRepo.findTeamEventTypes({
    teamId: input.teamId,
    eventTypeIds: input.eventTypeIds,
  });

  // Collective events require every host to be fixed; round-robin/managed do not.
  const assignments = eventTypes.flatMap((eventType) =>
    input.userIds.map((userId) => ({
      userId,
      eventTypeId: eventType.id,
      isFixed: eventType.schedulingType === SchedulingType.COLLECTIVE,
    }))
  );

  return eventTypeRepo.addHosts({ assignments });
};

export default addMembersToEventTypesHandler;
