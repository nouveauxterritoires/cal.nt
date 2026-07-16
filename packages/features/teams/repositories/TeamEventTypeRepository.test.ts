import prismaMock from "@calcom/testing/lib/__mocks__/prismaMock";
import type { PrismaClient } from "@calcom/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamEventTypeRepository } from "./TeamEventTypeRepository";

const repo = new TeamEventTypeRepository(prismaMock as unknown as PrismaClient);

describe("TeamEventTypeRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findTeamEventTypes", () => {
    it("scopes the query to event types owned by the team", async () => {
      prismaMock.eventType.findMany.mockResolvedValue([] as never);

      await repo.findTeamEventTypes({ teamId: 4, eventTypeIds: [1, 2] });

      expect(prismaMock.eventType.findMany).toHaveBeenCalledWith({
        where: { teamId: 4, id: { in: [1, 2] } },
        select: { id: true, schedulingType: true },
      });
    });
  });

  describe("addHosts", () => {
    it("no-ops on an empty assignment list", async () => {
      const result = await repo.addHosts({ assignments: [] });

      expect(result).toEqual({ count: 0 });
      expect(prismaMock.host.createMany).not.toHaveBeenCalled();
    });

    it("creates hosts and skips duplicates", async () => {
      prismaMock.host.createMany.mockResolvedValue({ count: 2 } as never);

      const assignments = [
        { userId: 1, eventTypeId: 10, isFixed: true },
        { userId: 2, eventTypeId: 10, isFixed: true },
      ];
      await repo.addHosts({ assignments });

      expect(prismaMock.host.createMany).toHaveBeenCalledWith({ data: assignments, skipDuplicates: true });
    });
  });

  describe("removeHosts", () => {
    it("deletes the matching host rows", async () => {
      prismaMock.host.deleteMany.mockResolvedValue({ count: 1 } as never);

      await repo.removeHosts({ userIds: [1, 2], eventTypeIds: [10] });

      expect(prismaMock.host.deleteMany).toHaveBeenCalledWith({
        where: { userId: { in: [1, 2] }, eventTypeId: { in: [10] } },
      });
    });
  });
});
