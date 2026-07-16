import { TeamInviteRepository } from "@calcom/features/teams/repositories/TeamInviteRepository";
import { TeamMembershipRepository } from "@calcom/features/teams/repositories/TeamMembershipRepository";
import { MembershipRole } from "@calcom/prisma/enums";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TInviteMemberByTokenInputSchema } from "./inviteMemberByToken.schema";

type InviteMemberByTokenOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TInviteMemberByTokenInputSchema;
};

export const inviteMemberByTokenHandler = async ({ ctx, input }: InviteMemberByTokenOptions) => {
  const inviteRepo = new TeamInviteRepository();
  const invite = await inviteRepo.findByToken({ token: input.token });

  if (!invite || !invite.teamId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Invite token not found." });
  }
  if (invite.expires < new Date()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invite token has expired." });
  }
  // The token is bound to the invited email; only that account may redeem it.
  if (invite.identifier.toLowerCase() !== ctx.user.email.toLowerCase()) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This invite was issued for a different email." });
  }

  const membershipRepo = new TeamMembershipRepository();
  const existing = await membershipRepo.findByUserIdAndTeamId({
    userId: ctx.user.id,
    teamId: invite.teamId,
  });

  if (existing) {
    await membershipRepo.setAccepted({ userId: ctx.user.id, teamId: invite.teamId, accepted: true });
  } else {
    await membershipRepo.create({
      userId: ctx.user.id,
      teamId: invite.teamId,
      role: MembershipRole.MEMBER,
      accepted: true,
    });
  }

  await inviteRepo.deleteByToken({ token: input.token });

  return { teamId: invite.teamId };
};

export default inviteMemberByTokenHandler;
