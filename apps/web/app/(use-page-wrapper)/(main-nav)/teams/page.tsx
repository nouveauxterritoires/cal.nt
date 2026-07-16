import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { teamsRouter } from "@calcom/trpc/server/routers/viewer/teams/_router";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import { createRouterCaller, getTRPCContext } from "app/_trpc/context";
import type { PageProps } from "app/_types";
import { _generateMetadata, getTranslate } from "app/_utils";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreateTeamButton, TeamsListView } from "~/teams/teams-view";
import { ShellMainAppDir } from "../ShellMainAppDir";

export const generateMetadata = async () => {
  return await _generateMetadata(
    (t) => t("teams"),
    (t) => t("create_manage_teams_collaborative"),
    undefined,
    undefined,
    "/teams"
  );
};

const Page = async ({ searchParams: _searchParams }: PageProps) => {
  const t = await getTranslate();
  const _headers = await headers();
  const _cookies = await cookies();
  const session = await getServerSession({ req: buildLegacyRequest(_headers, _cookies) });
  if (!session?.user?.id) {
    return redirect("/auth/login");
  }

  const teamsCaller = await createRouterCaller(teamsRouter, await getTRPCContext(_headers, _cookies));
  const teams = await teamsCaller.list();

  return (
    <ShellMainAppDir
      heading={t("teams")}
      subtitle={t("create_manage_teams_collaborative")}
      CTA={<CreateTeamButton />}>
      <TeamsListView teams={teams} />
    </ShellMainAppDir>
  );
};

export default Page;
