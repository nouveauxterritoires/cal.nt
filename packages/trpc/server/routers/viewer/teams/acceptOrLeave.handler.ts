import { TeamMembershipRepository } from "@calcom/features/teams/repositories/TeamMembershipRepository";
import { MembershipRole } from "@calcom/prisma/enums";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TAcceptOrLeaveInputSchema } from "./acceptOrLeave.schema";

type AcceptOrLeaveOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TAcceptOrLeaveInputSchema;
};

export const acceptOrLeaveHandler = async ({ ctx, input }: AcceptOrLeaveOptions) => {
  const repo = new TeamMembershipRepository();

  const membership = await repo.findByUserIdAndTeamId({ userId: ctx.user.id, teamId: input.teamId });
  if (!membership) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Membership not found." });
  }

  if (input.accept) {
    await repo.setAccepted({ userId: ctx.user.id, teamId: input.teamId, accepted: true });
    return;
  }

  // A sole remaining owner cannot leave — the team would be left without an owner.
  if (membership.role === MembershipRole.OWNER) {
    const owners = await repo.countAcceptedOwners({ teamId: input.teamId });
    if (owners <= 1) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A team must keep at least one owner." });
    }
  }

  await repo.deleteByUserIdAndTeamId({ userId: ctx.user.id, teamId: input.teamId });
};

export default acceptOrLeaveHandler;
