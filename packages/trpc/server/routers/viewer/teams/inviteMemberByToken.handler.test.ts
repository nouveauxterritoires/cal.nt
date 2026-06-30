import { beforeEach, describe, expect, it, vi } from "vitest";
import { inviteMemberByTokenHandler } from "./inviteMemberByToken.handler";

vi.mock("@calcom/features/teams/repositories/TeamInviteRepository");
vi.mock("@calcom/features/teams/repositories/TeamMembershipRepository");

import { TeamInviteRepository } from "@calcom/features/teams/repositories/TeamInviteRepository";
import { TeamMembershipRepository } from "@calcom/features/teams/repositories/TeamMembershipRepository";

const inviteRepo = {
  findByToken: vi.fn(),
  deleteByToken: vi.fn(),
};
const membershipRepo = {
  findByUserIdAndTeamId: vi.fn(),
  setAccepted: vi.fn(),
  create: vi.fn(),
};

const ctx = (id: number, email: string) =>
  ({ user: { id, email } }) as unknown as Parameters<typeof inviteMemberByTokenHandler>[0]["ctx"];

const future = () => new Date(Date.now() + 86_400_000);
const past = () => new Date(Date.now() - 86_400_000);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(TeamInviteRepository).mockImplementation(function () {
    return inviteRepo as unknown as TeamInviteRepository;
  });
  vi.mocked(TeamMembershipRepository).mockImplementation(function () {
    return membershipRepo as unknown as TeamMembershipRepository;
  });
});

describe("inviteMemberByTokenHandler", () => {
  it("404s on an unknown token", async () => {
    inviteRepo.findByToken.mockResolvedValueOnce(null);
    await expect(
      inviteMemberByTokenHandler({ ctx: ctx(1, "a@b.com"), input: { token: "x" } })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects an expired token", async () => {
    inviteRepo.findByToken.mockResolvedValueOnce({ identifier: "a@b.com", teamId: 3, expires: past() });
    await expect(
      inviteMemberByTokenHandler({ ctx: ctx(1, "a@b.com"), input: { token: "x" } })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("forbids redeeming a token issued for a different email", async () => {
    inviteRepo.findByToken.mockResolvedValueOnce({
      identifier: "someone@else.com",
      teamId: 3,
      expires: future(),
    });
    await expect(
      inviteMemberByTokenHandler({ ctx: ctx(1, "a@b.com"), input: { token: "x" } })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(inviteRepo.deleteByToken).not.toHaveBeenCalled();
  });

  it("accepts an existing pending membership and consumes the token", async () => {
    inviteRepo.findByToken.mockResolvedValueOnce({ identifier: "A@B.com", teamId: 3, expires: future() });
    membershipRepo.findByUserIdAndTeamId.mockResolvedValueOnce({ id: 9, role: "MEMBER", accepted: false });
    await inviteMemberByTokenHandler({ ctx: ctx(1, "a@b.com"), input: { token: "tok" } });
    expect(membershipRepo.setAccepted).toHaveBeenCalledWith({ userId: 1, teamId: 3, accepted: true });
    expect(membershipRepo.create).not.toHaveBeenCalled();
    expect(inviteRepo.deleteByToken).toHaveBeenCalledWith({ token: "tok" });
  });

  it("creates a membership when none exists yet", async () => {
    inviteRepo.findByToken.mockResolvedValueOnce({ identifier: "a@b.com", teamId: 3, expires: future() });
    membershipRepo.findByUserIdAndTeamId.mockResolvedValueOnce(null);
    const result = await inviteMemberByTokenHandler({ ctx: ctx(1, "a@b.com"), input: { token: "tok" } });
    expect(membershipRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, teamId: 3, accepted: true })
    );
    expect(result).toEqual({ teamId: 3 });
  });
});
