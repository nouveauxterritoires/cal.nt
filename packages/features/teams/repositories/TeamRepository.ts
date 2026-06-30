import { prisma } from "@calcom/prisma";
import type { Prisma, PrismaClient } from "@calcom/prisma/client";
import { MembershipRole } from "@calcom/prisma/enums";

// Clean-room reimplementation: the upstream TeamRepository lived under the
// commercially licensed packages/features/ee/** tree and was removed from this
// fork. This module is written from scratch against the (intact) Prisma schema
// and exposes only the surface the AGPL core team router needs.

const teamSelect = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  bio: true,
  hideBranding: true,
  hideTeamProfileLink: true,
  isPrivate: true,
  hideBookATeamMember: true,
  metadata: true,
  theme: true,
  brandColor: true,
  darkBrandColor: true,
  parentId: true,
  isOrganization: true,
} satisfies Prisma.TeamSelect;

export type TeamListItem = Prisma.TeamGetPayload<{ select: typeof teamSelect }> & {
  role: MembershipRole;
  accepted: boolean;
};

export class TeamRepository {
  constructor(private readonly prismaClient: PrismaClient = prisma) {}

  async create({
    name,
    slug,
    ownerId,
    bio = null,
    parentId = null,
  }: {
    name: string;
    slug: string;
    ownerId: number;
    bio?: string | null;
    parentId?: number | null;
  }) {
    return this.prismaClient.team.create({
      data: {
        name,
        slug,
        bio,
        ...(parentId ? { parentId } : {}),
        members: {
          create: {
            userId: ownerId,
            role: MembershipRole.OWNER,
            accepted: true,
          },
        },
      },
      select: teamSelect,
    });
  }

  async findBySlug({ slug, parentId = null }: { slug: string; parentId?: number | null }) {
    return this.prismaClient.team.findFirst({
      where: { slug, parentId },
      select: { id: true },
    });
  }

  async findTeamsByUserId({
    userId,
    includeOrgs = false,
  }: {
    userId: number;
    includeOrgs?: boolean;
  }): Promise<TeamListItem[]> {
    const memberships = await this.prismaClient.membership.findMany({
      where: {
        userId,
        ...(includeOrgs ? {} : { team: { isOrganization: false } }),
      },
      select: {
        role: true,
        accepted: true,
        team: { select: teamSelect },
      },
    });

    return memberships.map(({ team, role, accepted }) => ({ ...team, role, accepted }));
  }

  async findOwnedTeamsByUserId({ userId }: { userId: number }): Promise<TeamListItem[]> {
    const memberships = await this.prismaClient.membership.findMany({
      where: {
        userId,
        accepted: true,
        role: MembershipRole.OWNER,
      },
      select: {
        role: true,
        accepted: true,
        team: { select: teamSelect },
      },
    });

    return memberships.map(({ team, role, accepted }) => ({ ...team, role, accepted }));
  }
}
