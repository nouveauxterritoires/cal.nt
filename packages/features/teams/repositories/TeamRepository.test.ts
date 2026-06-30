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
});
