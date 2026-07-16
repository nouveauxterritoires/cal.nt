import { getTeamWithEventTypes } from "@calcom/features/teams/lib/getTeamWithEventTypes";
import { WEBAPP_URL } from "@calcom/lib/constants";
import type { PageProps } from "app/_types";
import { _generateMetadata } from "app/_utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const getSlug = async (params: PageProps["params"]) => {
  const { slug } = await params;
  return Array.isArray(slug) ? slug[0] : slug;
};

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const slug = await getSlug(params);
  const team = slug ? await getTeamWithEventTypes(slug) : null;
  return await _generateMetadata(
    () => team?.name ?? "",
    () => team?.bio ?? "",
    team?.hideBranding ?? false,
    WEBAPP_URL,
    `/team/${slug}`
  );
};

const TeamProfilePage = async ({ params }: PageProps): Promise<JSX.Element> => {
  const slug = await getSlug(params);
  const team = slug ? await getTeamWithEventTypes(slug) : null;

  if (!team) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        {team.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.logoUrl}
            alt={team.name ?? team.slug ?? "team"}
            className="border-subtle h-16 w-16 rounded-full border object-cover"
          />
        ) : (
          <div className="bg-emphasis text-emphasis flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold">
            {(team.name ?? team.slug ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-emphasis mt-4 text-2xl font-bold">{team.name}</h1>
        {team.bio && <p className="text-subtle mt-2 text-sm">{team.bio}</p>}
      </div>

      {team.eventTypes.length === 0 ? (
        <p className="text-subtle text-center text-sm">No bookable event types yet.</p>
      ) : (
        <ul className="border-subtle divide-subtle bg-default divide-y rounded-md border">
          {team.eventTypes.map((eventType) => (
            <li key={eventType.id}>
              <Link
                href={`/team/${team.slug}/${eventType.slug}`}
                className="hover:bg-muted flex flex-col gap-1 px-5 py-4">
                <span className="text-emphasis font-medium">{eventType.title}</span>
                {eventType.description && (
                  <span className="text-subtle line-clamp-2 text-sm">{eventType.description}</span>
                )}
                <span className="text-subtle text-xs">{eventType.length} min</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default TeamProfilePage;
