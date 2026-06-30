import { prisma } from "@calcom/prisma";
import type { Prisma, PrismaClient } from "@calcom/prisma/client";
import type { MembershipRole } from "@calcom/prisma/enums";
import { MembershipRole as Role } from "@calcom/prisma/enums";

// Clean-room reimplementation of the team-scoped membership data access that the
// upstream code kept under the commercial /ee tree. Written from scratch against
// the intact Prisma schema; no business rules live here (those stay in handlers).

const memberUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export type TeamMember = {
  role: MembershipRole;
  accepted: boolean;
  user: Prisma.UserGetPayload<{ select: typeof memberUserSelect }>;
};

export class TeamMembershipRepository {
  constructor(private readonly prismaClient: PrismaClient = prisma) {}

  async findByUserIdAndTeamId({ userId, teamId }: { userId: number; teamId: number }) {
    return this.prismaClient.membership.findUnique({
      where: { userId_teamId: { userId, teamId } },
      select: { id: true, role: true, accepted: true },
    });
  }

  async create({
    userId,
    teamId,
    role,
    accepted,
  }: {
    userId: number;
    teamId: number;
    role: MembershipRole;
    accepted: boolean;
  }) {
    return this.prismaClient.membership.create({
      data: { userId, teamId, role, accepted },
      select: { id: true, userId: true, teamId: true, role: true, accepted: true },
    });
  }

  async countAcceptedOwners({ teamId }: { teamId: number }): Promise<number> {
    return this.prismaClient.membership.count({
      where: { teamId, accepted: true, role: Role.OWNER },
    });
  }

  async setAccepted({ userId, teamId, accepted }: { userId: number; teamId: number; accepted: boolean }) {
    return this.prismaClient.membership.update({
      where: { userId_teamId: { userId, teamId } },
      data: { accepted },
    });
  }

  async updateRole({ userId, teamId, role }: { userId: number; teamId: number; role: MembershipRole }) {
    return this.prismaClient.membership.update({
      where: { userId_teamId: { userId, teamId } },
      data: { role },
      select: { id: true, userId: true, teamId: true, role: true, accepted: true },
    });
  }

  async deleteByUserIdAndTeamId({ userId, teamId }: { userId: number; teamId: number }) {
    return this.prismaClient.membership.delete({
      where: { userId_teamId: { userId, teamId } },
    });
  }

  async listByTeamId({ teamId }: { teamId: number }): Promise<TeamMember[]> {
    return this.prismaClient.membership.findMany({
      where: { teamId },
      select: { role: true, accepted: true, user: { select: memberUserSelect } },
      orderBy: { id: "asc" },
    });
  }
}
