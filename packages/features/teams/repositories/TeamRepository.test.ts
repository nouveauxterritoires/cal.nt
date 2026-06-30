import prismaMock from "@calcom/testing/lib/__mocks__/prismaMock";
import type { PrismaClient } from "@calcom/prisma/client";
import { MembershipRole } from "@calcom/prisma/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamRepository } from "./TeamRepository";

const repo = new TeamRepository(prismaMock as unknown as PrismaClient);

describe("TeamRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("creates a team with the creator as accepted OWNER", async () => {
      prismaMock.team.create.mockResolvedValue({ id: 7, name: "Acme", slug: "acme" } as never);

      await repo.create({ name: "Acme", slug: "acme", ownerId: 42 });

      expect(prismaMock.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Acme",
            slug: "acme",
            bio: null,
            members: {
              create: { userId: 42, role: MembershipRole.OWNER, accepted: true },
            },
          }),
        })
      );
    });

    it("nests the team under parentId when provided", async () => {
      prismaMock.team.create.mockResolvedValue({ id: 8 } as never);

      await repo.create({ name: "Sub", slug: "sub", ownerId: 1, parentId: 99 });

      expect(prismaMock.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ parentId: 99 }),
        })
      );
    });
  });

  describe("findBySlug", () => {
    it("scopes the lookup to the given parentId (null by default)", async () => {
      prismaMock.team.findFirst.mockResolvedValue(null as never);

      await repo.findBySlug({ slug: "acme" });

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: { slug: "acme", parentId: null },
        select: { id: true },
      });
    });
  });

  describe("findTeamsByUserId", () => {
    it("excludes organizations by default", async () => {
      prismaMock.membership.findMany.mockResolvedValue([] as never);

      await repo.findTeamsByUserId({ userId: 5 });

      expect(prismaMock.membership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 5, team: { isOrganization: false } },
        })
      );
    });

    it("includes organizations when includeOrgs is true and flattens role/accepted", async () => {
      prismaMock.membership.findMany.mockResolvedValue([
        { role: MembershipRole.ADMIN, accepted: true, team: { id: 1, name: "T", slug: "t" } },
      ] as never);

      const result = await repo.findTeamsByUserId({ userId: 5, includeOrgs: true });

      expect(prismaMock.membership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 5 } })
      );
      expect(result).toEqual([{ id: 1, name: "T", slug: "t", role: MembershipRole.ADMIN, accepted: true }]);
    });
  });

  describe("findOwnedTeamsByUserId", () => {
    it("only returns accepted OWNER memberships", async () => {
      prismaMock.membership.findMany.mockResolvedValue([] as never);

      await repo.findOwnedTeamsByUserId({ userId: 3 });

      expect(prismaMock.membership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 3, accepted: true, role: MembershipRole.OWNER },
        })
      );
    });
  });

  describe("isSlugAvailableForUpdate", () => {
    it("returns false when another team already uses the slug under the same parent", async () => {
      prismaMock.team.findFirst.mockResolvedValue({ id: 2 } as never);

      const available = await repo.isSlugAvailableForUpdate({ slug: "acme", teamId: 1 });

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: { slug: "acme", parentId: null, id: { not: 1 } },
        select: { id: true },
      });
      expect(available).toBe(false);
    });

    it("returns true when no other team uses the slug", async () => {
      prismaMock.team.findFirst.mockResolvedValue(null as never);

      const available = await repo.isSlugAvailableForUpdate({ slug: "acme", teamId: 1, parentId: 9 });

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: { slug: "acme", parentId: 9, id: { not: 1 } },
        select: { id: true },
      });
      expect(available).toBe(true);
    });
  });

  describe("clearEventTypeLeadThreshold", () => {
    it("nulls maxLeadThreshold for every event type of the team", async () => {
      prismaMock.eventType.updateMany.mockResolvedValue({ count: 3 } as never);

      await repo.clearEventTypeLeadThreshold({ teamId: 5 });

      expect(prismaMock.eventType.updateMany).toHaveBeenCalledWith({
        where: { teamId: 5 },
        data: { maxLeadThreshold: null },
      });
    });
  });

  describe("deleteById", () => {
    it("clears invite tokens before deleting the team in one transaction", async () => {
      prismaMock.$transaction.mockResolvedValue([] as never);

      await repo.deleteById({ id: 7 });

      expect(prismaMock.verificationToken.deleteMany).toHaveBeenCalledWith({ where: { teamId: 7 } });
      expect(prismaMock.team.delete).toHaveBeenCalledWith({ where: { id: 7 } });
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });
});
