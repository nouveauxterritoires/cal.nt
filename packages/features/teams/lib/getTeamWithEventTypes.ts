import type { PrismaClient } from "@calcom/prisma";
import { prisma as defaultPrisma } from "@calcom/prisma";
import { SchedulingType } from "@calcom/prisma/enums";

/**
 * Public, read-only loader for a non-organization team's bookable profile.
 *
 * Organization teams are intentionally excluded: their domain/SEO/visibility rules
 * live in commercial /ee code that is not part of this fork. Callers should treat a
 * null result as a 404.
 */
const teamProfileSelect = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  bio: true,
  hideBranding: true,
  theme: true,
  brandColor: true,
  darkBrandColor: true,
  isPrivate: true,
  eventTypes: {
    where: {
      // Only event types directly owned by the team, visible, and individually bookable.
      hidden: false,
      schedulingType: { not: SchedulingType.MANAGED },
    },
    orderBy: [{ position: "desc" as const }, { id: "asc" as const }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      length: true,
      schedulingType: true,
      requiresConfirmation: true,
      price: true,
      currency: true,
    },
  },
} as const;

export type TeamWithEventTypes = NonNullable<Awaited<ReturnType<typeof getTeamWithEventTypes>>>;

export async function getTeamWithEventTypes(slug: string, prisma: PrismaClient = defaultPrisma) {
  return prisma.team.findFirst({
    where: {
      slug,
      parentId: null,
      isOrganization: false,
    },
    select: teamProfileSelect,
  });
}
