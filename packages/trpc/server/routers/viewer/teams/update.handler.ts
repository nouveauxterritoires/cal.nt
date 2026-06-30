import { MembershipRepository } from "@calcom/features/membership/repositories/MembershipRepository";
import { TeamRepository } from "@calcom/features/teams/repositories/TeamRepository";
import { validateIntervalLimitOrder } from "@calcom/lib/intervalLimits/validateIntervalLimitOrder";
import { uploadLogo } from "@calcom/lib/server/avatar";
import type { Prisma } from "@calcom/prisma/client";
import { RRTimestampBasis } from "@calcom/prisma/enums";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TUpdateInputSchema } from "./update.schema";

type UpdateOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TUpdateInputSchema;
};

const isUploadableLogo = (logo: string) =>
  logo.startsWith("data:image/png;base64,") ||
  logo.startsWith("data:image/jpeg;base64,") ||
  logo.startsWith("data:image/jpg;base64,");

export const updateHandler = async ({ ctx, input }: UpdateOptions) => {
  const teamRepo = new TeamRepository();

  const prevTeam = await teamRepo.findById({ id: input.id });
  if (!prevTeam) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Team not found." });
  }

  const adminOrOwner = await MembershipRepository.getAdminOrOwnerMembership(ctx.user.id, input.id);
  if (!adminOrOwner) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (input.slug) {
    const isSlugAvailable = await teamRepo.isSlugAvailableForUpdate({
      slug: input.slug,
      teamId: input.id,
      parentId: prevTeam.parentId,
    });
    if (!isSlugAvailable) {
      throw new TRPCError({ code: "CONFLICT", message: "Slug already in use." });
    }
  }

  if (input.bookingLimits && !validateIntervalLimitOrder(input.bookingLimits)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Booking limits must be in ascending order." });
  }

  const data: Prisma.TeamUpdateInput = {
    name: input.name,
    bio: input.bio,
    slug: input.slug,
    hideBranding: input.hideBranding,
    isPrivate: input.isPrivate,
    hideBookATeamMember: input.hideBookATeamMember,
    hideTeamProfileLink: input.hideTeamProfileLink,
    brandColor: input.brandColor,
    darkBrandColor: input.darkBrandColor,
    theme: input.theme,
    bookingLimits: input.bookingLimits ?? undefined,
    includeManagedEventsInLimits: input.includeManagedEventsInLimits ?? undefined,
    rrResetInterval: input.rrResetInterval,
    rrTimestampBasis: input.rrTimestampBasis,
  };

  if (input.logo && isUploadableLogo(input.logo)) {
    data.logoUrl = await uploadLogo({ teamId: input.id, logo: input.logo });
  } else if (typeof input.logo !== "undefined" && !input.logo) {
    data.logoUrl = null;
  }

  if (
    input.rrTimestampBasis &&
    input.rrTimestampBasis !== RRTimestampBasis.CREATED_AT &&
    prevTeam.rrTimestampBasis === RRTimestampBasis.CREATED_AT
  ) {
    await teamRepo.clearEventTypeLeadThreshold({ teamId: input.id });
  }

  return teamRepo.updateById({ id: input.id, data });
};

export default updateHandler;
