import { MembershipRepository } from "@calcom/features/membership/repositories/MembershipRepository";
import { TeamRepository } from "@calcom/features/teams/repositories/TeamRepository";
import { MembershipRole } from "@calcom/prisma/enums";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TDeleteInputSchema } from "./delete.schema";

type DeleteOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TDeleteInputSchema;
};

export const deleteHandler = async ({ ctx, input }: DeleteOptions) => {
  const teamRepo = new TeamRepository();

  const team = await teamRepo.findIsOrganizationById({ id: input.teamId });
  if (!team) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  const membership = await new MembershipRepository().findUniqueByUserIdAndTeamId({
    userId: ctx.user.id,
    teamId: input.teamId,
  });

  if (!membership || !membership.accepted || membership.role !== MembershipRole.OWNER) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only the team owner can delete a team." });
  }

  await teamRepo.deleteById({ id: input.teamId });

  return { id: input.teamId };
};

export default deleteHandler;
