import prismaMock from "@calcom/testing/lib/__mocks__/prismaMock";
import type { PrismaClient } from "@calcom/prisma/client";
import { MembershipRole } from "@calcom/prisma/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamMembershipRepository } from "./TeamMembershipRepository";

const repo = new TeamMembershipRepository(prismaMock as unknown as PrismaClient);

describe("TeamMembershipRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findByUserIdAndTeamId", () => {
    it("looks up the composite membership key", async () => {
      prismaMock.membership.findUnique.mockResolvedValue(null as never);

      await repo.findByUserIdAndTeamId({ userId: 1, teamId: 2 });

      expect(prismaMock.membership.findUnique).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 1, teamId: 2 } },
        select: { id: true, role: true, accepted: true },
      });
    });
  });

  describe("countAcceptedOwners", () => {
    it("counts accepted owners only", async () => {
      prismaMock.membership.count.mockResolvedValue(2 as never);

      const result = await repo.countAcceptedOwners({ teamId: 5 });

      expect(prismaMock.membership.count).toHaveBeenCalledWith({
        where: { teamId: 5, accepted: true, role: MembershipRole.OWNER },
      });
      expect(result).toBe(2);
    });
  });

  describe("setAccepted", () => {
    it("flips the accepted flag for the membership", async () => {
      prismaMock.membership.update.mockResolvedValue({} as never);

      await repo.setAccepted({ userId: 1, teamId: 2, accepted: true });

      expect(prismaMock.membership.update).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 1, teamId: 2 } },
        data: { accepted: true },
      });
    });
  });

  describe("updateRole", () => {
    it("updates the role for the membership", async () => {
      prismaMock.membership.update.mockResolvedValue({} as never);

      await repo.updateRole({ userId: 1, teamId: 2, role: MembershipRole.ADMIN });

      expect(prismaMock.membership.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_teamId: { userId: 1, teamId: 2 } },
          data: { role: MembershipRole.ADMIN },
        })
      );
    });
  });

  describe("deleteByUserIdAndTeamId", () => {
    it("deletes by composite key", async () => {
      prismaMock.membership.delete.mockResolvedValue({} as never);

      await repo.deleteByUserIdAndTeamId({ userId: 1, teamId: 2 });

      expect(prismaMock.membership.delete).toHaveBeenCalledWith({
        where: { userId_teamId: { userId: 1, teamId: 2 } },
      });
    });
  });

  describe("listByTeamId", () => {
    it("returns members with user projection ordered by id", async () => {
      prismaMock.membership.findMany.mockResolvedValue([] as never);

      await repo.listByTeamId({ teamId: 9 });

      expect(prismaMock.membership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { teamId: 9 }, orderBy: { id: "asc" } })
      );
    });
  });
});
