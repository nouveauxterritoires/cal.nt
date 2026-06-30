import { TEAMS_ENABLED } from "@calcom/lib/constants";
import { TRPCError } from "@trpc/server";
import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { ZCreateInputSchema } from "./create.schema";
import { ZGetListSchema } from "./list.schema";

// Disabling the feature flag removes the whole Teams surface at the API boundary
// while keeping the router registered, so dependent client types stay stable.
const teamsProcedure = authedProcedure.use(async ({ next }) => {
  if (!TEAMS_ENABLED) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Teams are disabled on this instance." });
  }
  return next();
});

export const teamsRouter = router({
  create: teamsProcedure.input(ZCreateInputSchema).mutation(async ({ ctx, input }) => {
    const handler = (await import("./create.handler")).createHandler;
    return handler({ ctx, input });
  }),

  list: teamsProcedure.input(ZGetListSchema).query(async ({ ctx, input }) => {
    const handler = (await import("./list.handler")).listHandler;
    return handler({ ctx, input });
  }),

  listOwnedTeams: teamsProcedure.query(async ({ ctx }) => {
    const handler = (await import("./listOwnedTeams.handler")).listOwnedTeamsHandler;
    return handler({ ctx });
  }),
});
