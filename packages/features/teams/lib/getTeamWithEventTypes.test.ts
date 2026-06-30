import prismaMock from "@calcom/testing/lib/__mocks__/prismaMock";
import type { PrismaClient } from "@calcom/prisma/client";
import { SchedulingType } from "@calcom/prisma/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTeamWithEventTypes } from "./getTeamWithEventTypes";

const prisma = prismaMock as unknown as PrismaClient;

describe("getTeamWithEventTypes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes the query to non-organization teams only", async () => {
    prismaMock.team.findFirst.mockResolvedValue({ id: 1, slug: "acme", eventTypes: [] } as never);

    await getTeamWithEventTypes("acme", prisma);

    expect(prismaMock.team.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ slug: "acme", parentId: null, isOrganization: false }),
      })
    );
  });

  it("only loads visible, non-managed event types", async () => {
    prismaMock.team.findFirst.mockResolvedValue({ id: 1, slug: "acme", eventTypes: [] } as never);

    await getTeamWithEventTypes("acme", prisma);

    const arg = prismaMock.team.findFirst.mock.calls[0][0];
    expect(arg.select.eventTypes.where).toEqual({
      hidden: false,
      schedulingType: { not: SchedulingType.MANAGED },
    });
  });

  it("returns null when no matching non-org team exists", async () => {
    prismaMock.team.findFirst.mockResolvedValue(null as never);

    await expect(getTeamWithEventTypes("missing", prisma)).resolves.toBeNull();
  });
});
