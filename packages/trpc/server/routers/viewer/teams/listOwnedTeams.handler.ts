import { TeamRepository } from "@calcom/features/teams/repositories/TeamRepository";
import type { TrpcSessionUser } from "../../../types";

type ListOwnedTeamsOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
};

export const listOwnedTeamsHandler = async ({ ctx }: ListOwnedTeamsOptions) => {
  const teamRepo = new TeamRepository();
  return teamRepo.findOwnedTeamsByUserId({ userId: ctx.user.id });
};

export default listOwnedTeamsHandler;
