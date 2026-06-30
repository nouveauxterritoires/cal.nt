import { MembershipRole } from "@calcom/prisma/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHandler } from "./create.handler";
import { deleteHandler } from "./delete.handler";

vi.mock("@calcom/features/teams/repositories/TeamRepository");
vi.mock("@calcom/features/membership/repositories/MembershipRepository");

import { MembershipRepository } from "@calcom/features/membership/repositories/MembershipRepository";
import { TeamRepository } from "@calcom/features/teams/repositories/TeamRepository";

const teamRepo = {
  findBySlug: vi.fn(),
  create: vi.fn(),
  findIsOrganizationById: vi.fn(),
  deleteById: vi.fn(),
};
const membershipRepo = {
  findUniqueByUserIdAndTeamId: vi.fn(),
};

const ctx = (userId: number) =>
  ({ user: { id: userId } }) as unknown as Parameters<typeof createHandler>[0]["ctx"];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(TeamRepository).mockImplementation(function () {
    return teamRepo as unknown as TeamRepository;
  });
  vi.mocked(MembershipRepository).mockImplementation(function () {
    return membershipRepo as unknown as MembershipRepository;
  });
});

describe("createHandler", () => {
  it("rejects a taken slug", async () => {
    teamRepo.findBySlug.mockResolvedValueOnce({ id: 9 });
    await expect(createHandler({ ctx: ctx(1), input: { name: "Acme", slug: "acme" } })).rejects.toMatchObject(
      { code: "BAD_REQUEST" }
    );
    expect(teamRepo.create).not.toHaveBeenCalled();
  });

  it("creates the team with the caller as owner", async () => {
    teamRepo.findBySlug.mockResolvedValueOnce(null);
    teamRepo.create.mockResolvedValueOnce({ id: 5, name: "Acme", slug: "acme" });
    const result = await createHandler({ ctx: ctx(42), input: { name: "Acme", slug: "acme" } });
    expect(teamRepo.create).toHaveBeenCalledWith({
      name: "Acme",
      slug: "acme",
      bio: undefined,
      ownerId: 42,
    });
    expect(result.team.id).toBe(5);
  });
});

describe("deleteHandler", () => {
  it("404s when the team does not exist", async () => {
    teamRepo.findIsOrganizationById.mockResolvedValueOnce(null);
    await expect(deleteHandler({ ctx: ctx(1), input: { teamId: 1 } })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("forbids a non-owner from deleting", async () => {
    teamRepo.findIsOrganizationById.mockResolvedValueOnce({ isOrganization: false });
    membershipRepo.findUniqueByUserIdAndTeamId.mockResolvedValueOnce({
      role: MembershipRole.ADMIN,
      accepted: true,
    });
    await expect(deleteHandler({ ctx: ctx(1), input: { teamId: 1 } })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(teamRepo.deleteById).not.toHaveBeenCalled();
  });

  it("lets an accepted owner delete the team", async () => {
    teamRepo.findIsOrganizationById.mockResolvedValueOnce({ isOrganization: false });
    membershipRepo.findUniqueByUserIdAndTeamId.mockResolvedValueOnce({
      role: MembershipRole.OWNER,
      accepted: true,
    });
    await deleteHandler({ ctx: ctx(1), input: { teamId: 7 } });
    expect(teamRepo.deleteById).toHaveBeenCalledWith({ id: 7 });
  });
});
