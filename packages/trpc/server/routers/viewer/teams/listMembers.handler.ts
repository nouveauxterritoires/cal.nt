import { TeamMembershipRepository } from "@calcom/features/teams/repositories/TeamMembershipRepository";
import { TRPCError } from "@trpc/server";
import type { TrpcSessionUser } from "../../../types";
import type { TListMembersInputSchema } from "./listMembers.schema";

type ListMembersOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TListMembersInputSchema;
};

export const listMembersHandler = async ({ ctx, input }: ListMembersOptions) => {
  const repo = new TeamMembershipRepository();

  const callerMembership = await repo.findByUserIdAndTeamId({ userId: ctx.user.id, teamId: input.teamId });
  if (!callerMembership) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You are not a member of this team." });
  }

  return repo.listByTeamId({ teamId: input.teamId });
};

export default listMembersHandler;
