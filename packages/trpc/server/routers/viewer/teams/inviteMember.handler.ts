import { checkAdminOrOwner } from "@calcom/features/auth/lib/checkAdminOrOwner";
import { TeamMembershipRepository } from "@calcom/features/teams/repositories/TeamMembershipRepository";
import { TeamRepository } from "@calcom/features/teams/repositories/TeamRepository";
import { TeamInviteService } from "@calcom/features/teams/services/TeamInviteService";
import { getTranslation } from "@calcom/i18n/server";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TInviteMemberInputSchema } from "./inviteMember.schema";

type InviteMemberOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TInviteMemberInputSchema;
};

export const inviteMemberHandler = async ({ ctx, input }: InviteMemberOptions) => {
  const caller = await new TeamMembershipRepository().findByUserIdAndTeamId({
    userId: ctx.user.id,
    teamId: input.teamId,
  });
  if (!caller || !checkAdminOrOwner(caller.role)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Only admins or owners can invite members." });
  }

  const team = await new TeamRepository().findById({ id: input.teamId });
  if (!team) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Team not found." });
  }

  const language = await getTranslation(ctx.user.locale ?? "en", "common");

  return new TeamInviteService().inviteByEmails({
    teamId: input.teamId,
    teamName: team.name,
    inviterName: ctx.user.name || ctx.user.email,
    emails: input.emails,
    role: input.role,
    language,
  });
};

export default inviteMemberHandler;
