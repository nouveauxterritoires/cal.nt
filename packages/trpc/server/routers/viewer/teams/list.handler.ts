import { TeamRepository } from "@calcom/features/teams/repositories/TeamRepository";
import type { TrpcSessionUser } from "../../../types";
import type { TGetListSchema } from "./list.schema";

type ListOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TGetListSchema;
};

export const listHandler = async ({ ctx, input }: ListOptions) => {
  const teamRepo = new TeamRepository();
  return teamRepo.findTeamsByUserId({
    userId: ctx.user.id,
    includeOrgs: input?.includeOrgs,
  });
};

export default listHandler;
