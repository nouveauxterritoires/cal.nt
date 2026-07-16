import prismaMock from "@calcom/testing/lib/__mocks__/prismaMock";
import type { PrismaClient } from "@calcom/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamInviteRepository } from "./TeamInviteRepository";

const repo = new TeamInviteRepository(prismaMock as unknown as PrismaClient);

describe("TeamInviteRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createToken", () => {
    it("stores a lowercased identifier, a random token and a future expiry", async () => {
      prismaMock.verificationToken.create.mockResolvedValue({ token: "t" } as never);

      await repo.createToken({ email: "Person@Example.com", teamId: 3 });

      const call = prismaMock.verificationToken.create.mock.calls[0][0];
      expect(call.data.identifier).toBe("person@example.com");
      expect(call.data.teamId).toBe(3);
      expect(call.data.expiresInDays).toBe(7);
      expect(typeof call.data.token).toBe("string");
      expect((call.data.token as string).length).toBeGreaterThan(16);
      expect(call.data.expires.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("findByToken", () => {
    it("looks up by unique token", async () => {
      prismaMock.verificationToken.findUnique.mockResolvedValue(null as never);

      await repo.findByToken({ token: "abc" });

      expect(prismaMock.verificationToken.findUnique).toHaveBeenCalledWith({
        where: { token: "abc" },
        select: { id: true, identifier: true, teamId: true, expires: true },
      });
    });
  });

  describe("deleteByToken", () => {
    it("removes the token", async () => {
      prismaMock.verificationToken.deleteMany.mockResolvedValue({ count: 1 } as never);

      await repo.deleteByToken({ token: "abc" });

      expect(prismaMock.verificationToken.deleteMany).toHaveBeenCalledWith({ where: { token: "abc" } });
    });
  });
});
