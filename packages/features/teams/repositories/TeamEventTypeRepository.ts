import { prisma } from "@calcom/prisma";
import type { PrismaClient } from "@calcom/prisma/client";

// Clean-room reimplementation of the team event-type host assignment data access.
// The upstream handlers gated this behind PBAC (commercial /ee); here the access
// control lives in the handler and this repository only touches the Host table.

export class TeamEventTypeRepository {
  constructor(private readonly prismaClient: PrismaClient = prisma) {}

  // Only returns the event types that actually belong to the team, so callers
  // cannot assign hosts to event types outside the team they administer.
  async findTeamEventTypes({ teamId, eventTypeIds }: { teamId: number; eventTypeIds: number[] }) {
    return this.prismaClient.eventType.findMany({
      where: { teamId, id: { in: eventTypeIds } },
      select: { id: true, schedulingType: true },
    });
  }

  async addHosts({
    assignments,
  }: {
    assignments: { userId: number; eventTypeId: number; isFixed: boolean }[];
  }) {
    if (!assignments.length) return { count: 0 };
    return this.prismaClient.host.createMany({
      data: assignments,
      skipDuplicates: true,
    });
  }

  async removeHosts({ userIds, eventTypeIds }: { userIds: number[]; eventTypeIds: number[] }) {
    return this.prismaClient.host.deleteMany({
      where: {
        userId: { in: userIds },
        eventTypeId: { in: eventTypeIds },
      },
    });
  }
}
