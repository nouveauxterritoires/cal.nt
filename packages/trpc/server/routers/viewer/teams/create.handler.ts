import { TeamRepository } from "@calcom/features/teams/repositories/TeamRepository";
import { WEBAPP_URL } from "@calcom/lib/constants";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TCreateInputSchema } from "./create.schema";

type CreateOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TCreateInputSchema;
};

export const createHandler = async ({ ctx, input }: CreateOptions) => {
  const { name, slug, bio } = input;

  const teamRepo = new TeamRepository();

  const slugCollision = await teamRepo.findBySlug({ slug });
  if (slugCollision) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "team_url_taken" });
  }

  const team = await teamRepo.create({ name, slug, bio, ownerId: ctx.user.id });

  return {
    team,
    url: `${WEBAPP_URL}/settings/teams/${team.id}/members`,
  };
};

export default createHandler;
