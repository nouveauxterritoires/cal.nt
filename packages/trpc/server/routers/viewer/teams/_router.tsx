import { TEAMS_ENABLED } from "@calcom/lib/constants";
import { TRPCError } from "@trpc/server";
import authedProcedure from "../../../procedures/authedProcedure";
import { router } from "../../../trpc";
import { ZAcceptOrLeaveInputSchema } from "./acceptOrLeave.schema";
import { ZChangeMemberRoleInputSchema } from "./changeMemberRole.schema";
import { ZCreateInputSchema } from "./create.schema";
import { ZDeleteInputSchema } from "./delete.schema";
import { ZGetInputSchema } from "./get.schema";
import { ZGetListSchema } from "./list.schema";
import { ZListMembersInputSchema } from "./listMembers.schema";
import { ZRemoveMemberInputSchema } from "./removeMember.schema";
import { ZUpdateInputSchema } from "./update.schema";

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

  get: teamsProcedure.input(ZGetInputSchema).query(async ({ ctx, input }) => {
    const handler = (await import("./get.handler")).getHandler;
    return handler({ ctx, input });
  }),

  update: teamsProcedure.input(ZUpdateInputSchema).mutation(async ({ ctx, input }) => {
    const handler = (await import("./update.handler")).updateHandler;
    return handler({ ctx, input });
  }),

  delete: teamsProcedure.input(ZDeleteInputSchema).mutation(async ({ ctx, input }) => {
    const handler = (await import("./delete.handler")).deleteHandler;
    return handler({ ctx, input });
  }),

  listMembers: teamsProcedure.input(ZListMembersInputSchema).query(async ({ ctx, input }) => {
    const handler = (await import("./listMembers.handler")).listMembersHandler;
    return handler({ ctx, input });
  }),

  acceptOrLeave: teamsProcedure.input(ZAcceptOrLeaveInputSchema).mutation(async ({ ctx, input }) => {
    const handler = (await import("./acceptOrLeave.handler")).acceptOrLeaveHandler;
    return handler({ ctx, input });
  }),

  removeMember: teamsProcedure.input(ZRemoveMemberInputSchema).mutation(async ({ ctx, input }) => {
    const handler = (await import("./removeMember.handler")).removeMemberHandler;
    return handler({ ctx, input });
  }),

  changeMemberRole: teamsProcedure.input(ZChangeMemberRoleInputSchema).mutation(async ({ ctx, input }) => {
    const handler = (await import("./changeMemberRole.handler")).changeMemberRoleHandler;
    return handler({ ctx, input });
  }),
});
