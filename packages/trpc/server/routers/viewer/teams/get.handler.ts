import { MembershipRepository } from "@calcom/features/membership/repositories/MembershipRepository";
import { TeamRepository } from "@calcom/features/teams/repositories/TeamRepository";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TGetInputSchema } from "./get.schema";

type GetOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TGetInputSchema;
};

export const getHandler = async ({ ctx, input }: GetOptions) => {
  const membershipRepo = new MembershipRepository();
  const membership = await membershipRepo.findUniqueByUserIdAndTeamId({
    userId: ctx.user.id,
    teamId: input.teamId,
  });

  if (!membership) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You are not a member of this team." });
  }

  const team = await new TeamRepository().findById({ id: input.teamId });
  if (!team) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
  }

  return { ...team, membership: { role: membership.role, accepted: membership.accepted } };
};

export default getHandler;
