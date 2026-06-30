import { checkAdminOrOwner } from "@calcom/features/auth/lib/checkAdminOrOwner";
import { TeamMembershipRepository } from "@calcom/features/teams/repositories/TeamMembershipRepository";
import { MembershipRole } from "@calcom/prisma/enums";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TRemoveMemberInputSchema } from "./removeMember.schema";

type RemoveMemberOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TRemoveMemberInputSchema;
};

export const removeMemberHandler = async ({ ctx, input }: RemoveMemberOptions) => {
  const repo = new TeamMembershipRepository();
  const isSelf = input.memberId === ctx.user.id;

  const caller = await repo.findByUserIdAndTeamId({ userId: ctx.user.id, teamId: input.teamId });
  if (!caller) {
    throw new TRPCError({ code: "NOT_FOUND", message: "You are not a member of this team." });
  }
  if (!isSelf && !checkAdminOrOwner(caller.role)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Only admins or owners can remove members." });
  }

  const target = await repo.findByUserIdAndTeamId({ userId: input.memberId, teamId: input.teamId });
  if (!target) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
  }

  // Only an owner may remove another admin/owner.
  if (!isSelf && checkAdminOrOwner(target.role) && caller.role !== MembershipRole.OWNER) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Only an owner can remove an admin or owner." });
  }

  if (target.role === MembershipRole.OWNER) {
    const owners = await repo.countAcceptedOwners({ teamId: input.teamId });
    if (owners <= 1) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A team must keep at least one owner." });
    }
  }

  await repo.deleteByUserIdAndTeamId({ userId: input.memberId, teamId: input.teamId });

  return { memberId: input.memberId, teamId: input.teamId };
};

export default removeMemberHandler;
