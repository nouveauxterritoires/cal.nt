import { TeamMembershipRepository } from "@calcom/features/teams/repositories/TeamMembershipRepository";
import { MembershipRole } from "@calcom/prisma/enums";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TChangeMemberRoleInputSchema } from "./changeMemberRole.schema";

type ChangeMemberRoleOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TChangeMemberRoleInputSchema;
};

const isElevated = (role: MembershipRole) => role === MembershipRole.OWNER;

export const changeMemberRoleHandler = async ({ ctx, input }: ChangeMemberRoleOptions) => {
  const repo = new TeamMembershipRepository();

  const caller = await repo.findByUserIdAndTeamId({ userId: ctx.user.id, teamId: input.teamId });
  if (!caller || (caller.role !== MembershipRole.OWNER && caller.role !== MembershipRole.ADMIN)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Only admins or owners can change roles." });
  }

  const target = await repo.findByUserIdAndTeamId({ userId: input.memberId, teamId: input.teamId });
  if (!target) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
  }

  // Granting or revoking ownership is an owner-only action.
  if ((isElevated(input.role) || isElevated(target.role)) && caller.role !== MembershipRole.OWNER) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Only an owner can manage ownership." });
  }

  // Never demote the last remaining owner.
  if (target.role === MembershipRole.OWNER && input.role !== MembershipRole.OWNER) {
    const owners = await repo.countAcceptedOwners({ teamId: input.teamId });
    if (owners <= 1) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A team must keep at least one owner." });
    }
  }

  return repo.updateRole({ userId: input.memberId, teamId: input.teamId, role: input.role });
};

export default changeMemberRoleHandler;
