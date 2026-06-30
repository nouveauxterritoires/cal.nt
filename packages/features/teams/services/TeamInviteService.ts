import { sendTeamInviteEmail } from "@calcom/emails/organization-email-service";
import { UserRepository } from "@calcom/features/users/repositories/UserRepository";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { prisma } from "@calcom/prisma";
import type { MembershipRole } from "@calcom/prisma/enums";
import type { TFunction } from "i18next";
import { TeamInviteRepository } from "../repositories/TeamInviteRepository";
import { TeamMembershipRepository } from "../repositories/TeamMembershipRepository";

// Clean-room reimplementation of the team-invite orchestration that upstream kept
// under the commercial /ee tree (inviteMemberUtils). Written from scratch on top
// of the core UserRepository, email service, and VerificationToken store.

export type InviteResult = {
  invited: string[];
  alreadyMembers: string[];
};

type SendInvite = typeof sendTeamInviteEmail;

export class TeamInviteService {
  constructor(
    private readonly deps: {
      userRepo: UserRepository;
      membershipRepo: TeamMembershipRepository;
      inviteRepo: TeamInviteRepository;
      sendInvite: SendInvite;
    } = {
      userRepo: new UserRepository(prisma),
      membershipRepo: new TeamMembershipRepository(),
      inviteRepo: new TeamInviteRepository(),
      sendInvite: sendTeamInviteEmail,
    }
  ) {}

  async inviteByEmails({
    teamId,
    teamName,
    inviterName,
    emails,
    role,
    language,
  }: {
    teamId: number;
    teamName: string;
    inviterName: string;
    emails: string[];
    role: MembershipRole;
    language: TFunction;
  }): Promise<InviteResult> {
    const result: InviteResult = { invited: [], alreadyMembers: [] };
    const uniqueEmails = Array.from(new Set(emails.map((e) => e.toLowerCase())));

    for (const email of uniqueEmails) {
      const user = await this.deps.userRepo.findByEmail({ email });

      if (user) {
        const existing = await this.deps.membershipRepo.findByUserIdAndTeamId({
          userId: user.id,
          teamId,
        });
        if (existing) {
          result.alreadyMembers.push(email);
          continue;
        }
        await this.deps.membershipRepo.create({ userId: user.id, teamId, role, accepted: false });
        await this.deps.sendInvite(
          this.buildInvite({
            to: email,
            inviterName,
            teamName,
            isCalcomMember: true,
            joinLink: `${WEBAPP_URL}/teams`,
            language,
          })
        );
      } else {
        const { token } = await this.deps.inviteRepo.createToken({ email, teamId });
        const joinLink = `${WEBAPP_URL}/signup?token=${token}&callbackUrl=/settings/teams`;
        await this.deps.sendInvite(
          this.buildInvite({ to: email, inviterName, teamName, isCalcomMember: false, joinLink, language })
        );
      }
      result.invited.push(email);
    }

    return result;
  }

  private buildInvite({
    to,
    inviterName,
    teamName,
    isCalcomMember,
    joinLink,
    language,
  }: {
    to: string;
    inviterName: string;
    teamName: string;
    isCalcomMember: boolean;
    joinLink: string;
    language: TFunction;
  }) {
    return {
      language,
      from: inviterName,
      to,
      teamName,
      joinLink,
      isCalcomMember,
      isAutoJoin: false,
      isOrg: false,
      parentTeamName: undefined,
      isExistingUserMovedToOrg: false,
      prevLink: null,
      newLink: null,
    };
  }
}
