import { MembershipRole } from "@calcom/prisma/enums";
import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { acceptOrLeaveHandler } from "./acceptOrLeave.handler";
import { changeMemberRoleHandler } from "./changeMemberRole.handler";
import { removeMemberHandler } from "./removeMember.handler";

vi.mock("@calcom/features/teams/repositories/TeamMembershipRepository");

import { TeamMembershipRepository } from "@calcom/features/teams/repositories/TeamMembershipRepository";

const mockRepo = {
  findByUserIdAndTeamId: vi.fn(),
  countAcceptedOwners: vi.fn(),
  setAccepted: vi.fn(),
  updateRole: vi.fn(),
  deleteByUserIdAndTeamId: vi.fn(),
};

// ctx only needs user.id for these handlers; cast away the rest of the session shape.
const ctx = (userId: number) =>
  ({ user: { id: userId } }) as unknown as Parameters<typeof changeMemberRoleHandler>[0]["ctx"];

const membership = (role: MembershipRole, accepted = true) => ({ id: 1, role, accepted });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(TeamMembershipRepository).mockImplementation(function () {
    return mockRepo as unknown as TeamMembershipRepository;
  });
});

describe("changeMemberRoleHandler", () => {
  it("rejects a caller who is not admin or owner", async () => {
    mockRepo.findByUserIdAndTeamId.mockResolvedValueOnce(membership(MembershipRole.MEMBER));
    await expect(
      changeMemberRoleHandler({ ctx: ctx(1), input: { teamId: 1, memberId: 2, role: MembershipRole.ADMIN } })
    ).rejects.toThrow(TRPCError);
  });

  it("forbids a non-owner from granting ownership", async () => {
    mockRepo.findByUserIdAndTeamId
      .mockResolvedValueOnce(membership(MembershipRole.ADMIN)) // caller
      .mockResolvedValueOnce(membership(MembershipRole.MEMBER)); // target
    await expect(
      changeMemberRoleHandler({ ctx: ctx(1), input: { teamId: 1, memberId: 2, role: MembershipRole.OWNER } })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("never demotes the last owner", async () => {
    mockRepo.findByUserIdAndTeamId
      .mockResolvedValueOnce(membership(MembershipRole.OWNER)) // caller
      .mockResolvedValueOnce(membership(MembershipRole.OWNER)); // target
    mockRepo.countAcceptedOwners.mockResolvedValueOnce(1);
    await expect(
      changeMemberRoleHandler({
        ctx: ctx(1),
        input: { teamId: 1, memberId: 2, role: MembershipRole.MEMBER },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("updates the role on success", async () => {
    mockRepo.findByUserIdAndTeamId
      .mockResolvedValueOnce(membership(MembershipRole.OWNER))
      .mockResolvedValueOnce(membership(MembershipRole.MEMBER));
    mockRepo.updateRole.mockResolvedValueOnce({ id: 1 });
    await changeMemberRoleHandler({
      ctx: ctx(1),
      input: { teamId: 1, memberId: 2, role: MembershipRole.ADMIN },
    });
    expect(mockRepo.updateRole).toHaveBeenCalledWith({ userId: 2, teamId: 1, role: MembershipRole.ADMIN });
  });
});

describe("removeMemberHandler", () => {
  it("lets a member remove themselves", async () => {
    mockRepo.findByUserIdAndTeamId
      .mockResolvedValueOnce(membership(MembershipRole.MEMBER)) // caller
      .mockResolvedValueOnce(membership(MembershipRole.MEMBER)); // target (self)
    await removeMemberHandler({ ctx: ctx(2), input: { teamId: 1, memberId: 2 } });
    expect(mockRepo.deleteByUserIdAndTeamId).toHaveBeenCalledWith({ userId: 2, teamId: 1 });
  });

  it("forbids a member from removing someone else", async () => {
    mockRepo.findByUserIdAndTeamId.mockResolvedValueOnce(membership(MembershipRole.MEMBER));
    await expect(
      removeMemberHandler({ ctx: ctx(1), input: { teamId: 1, memberId: 2 } })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("never removes the sole owner", async () => {
    mockRepo.findByUserIdAndTeamId
      .mockResolvedValueOnce(membership(MembershipRole.OWNER)) // caller
      .mockResolvedValueOnce(membership(MembershipRole.OWNER)); // target
    mockRepo.countAcceptedOwners.mockResolvedValueOnce(1);
    await expect(
      removeMemberHandler({ ctx: ctx(1), input: { teamId: 1, memberId: 1 } })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("acceptOrLeaveHandler", () => {
  it("accepts a pending membership", async () => {
    mockRepo.findByUserIdAndTeamId.mockResolvedValueOnce(membership(MembershipRole.MEMBER, false));
    await acceptOrLeaveHandler({ ctx: ctx(2), input: { teamId: 1, accept: true } });
    expect(mockRepo.setAccepted).toHaveBeenCalledWith({ userId: 2, teamId: 1, accepted: true });
  });

  it("blocks the sole owner from leaving", async () => {
    mockRepo.findByUserIdAndTeamId.mockResolvedValueOnce(membership(MembershipRole.OWNER));
    mockRepo.countAcceptedOwners.mockResolvedValueOnce(1);
    await expect(
      acceptOrLeaveHandler({ ctx: ctx(2), input: { teamId: 1, accept: false } })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("leaves the team when not the sole owner", async () => {
    mockRepo.findByUserIdAndTeamId.mockResolvedValueOnce(membership(MembershipRole.MEMBER));
    await acceptOrLeaveHandler({ ctx: ctx(2), input: { teamId: 1, accept: false } });
    expect(mockRepo.deleteByUserIdAndTeamId).toHaveBeenCalledWith({ userId: 2, teamId: 1 });
  });
});
