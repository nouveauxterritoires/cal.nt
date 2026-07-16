import { getServerSession } from "@calcom/features/auth/lib/getServerSession";
import { buildLegacyRequest } from "@lib/buildLegacyCtx";
import type { PageProps } from "app/_types";
import { _generateMetadata } from "app/_utils";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { TeamMembersView } from "~/teams/team-members-view";

export const generateMetadata = async () =>
  await _generateMetadata(
    (t) => t("team_members"),
    (t) => t("members_team_description"),
    undefined,
    undefined,
    "/settings/teams"
  );

const Page = async ({ params }: PageProps) => {
  const session = await getServerSession({ req: buildLegacyRequest(await headers(), await cookies()) });
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const teamId = Number(id);
  if (Number.isNaN(teamId)) {
    notFound();
  }

  return <TeamMembersView teamId={teamId} />;
};

export default Page;
