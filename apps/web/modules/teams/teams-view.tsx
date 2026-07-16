"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import slugify from "@calcom/lib/slugify";
import type { RouterOutputs } from "@calcom/trpc/react";
import { trpc } from "@calcom/trpc/react";
import { Badge } from "@calcom/ui/components/badge";
import { Button } from "@calcom/ui/components/button";
import { Dialog, DialogContent, DialogFooter } from "@calcom/ui/components/dialog";
import { EmptyScreen } from "@calcom/ui/components/empty-screen";
import { TextField } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TeamList = RouterOutputs["viewer"]["teams"]["list"];

export function CreateTeamButton() {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const createMutation = trpc.viewer.teams.create.useMutation({
    onSuccess: () => {
      showToast(t("team_created_successfully"), "success");
      setOpen(false);
      setName("");
      router.refresh();
    },
    onError: (err) => {
      showToast(err.message, "error");
    },
  });

  return (
    <>
      <Button color="primary" StartIcon="plus" onClick={() => setOpen(true)}>
        {t("new")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={t("create_a_team")} description={t("create_a_team_description")}>
          <TextField
            label={t("team_name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("team_name")}
          />
          <DialogFooter>
            <Button color="secondary" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              color="primary"
              loading={createMutation.isPending}
              disabled={!name.trim()}
              onClick={() => createMutation.mutate({ name: name.trim(), slug: slugify(name.trim()) })}>
              {t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TeamsListView({ teams }: { teams: TeamList }) {
  const { t } = useLocale();
  const router = useRouter();

  const acceptOrLeave = trpc.viewer.teams.acceptOrLeave.useMutation({
    onSuccess: () => router.refresh(),
    onError: (err) => showToast(err.message, "error"),
  });

  if (!teams.length) {
    return (
      <EmptyScreen
        Icon="users"
        headline={t("no_teams")}
        description={t("no_teams_description")}
        buttonRaw={<CreateTeamButton />}
      />
    );
  }

  return (
    <ul className="border-subtle divide-subtle bg-default divide-y rounded-md border">
      {teams.map((team) => (
        <li key={team.id} className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-emphasis font-semibold">{team.name}</span>
            <Badge variant="gray">{team.role.toLowerCase()}</Badge>
            {!team.accepted && <Badge variant="orange">{t("pending")}</Badge>}
          </div>
          {team.accepted ? (
            <Button color="secondary" href={`/settings/teams/${team.id}/members`}>
              {t("manage")}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                color="secondary"
                loading={acceptOrLeave.isPending}
                onClick={() => acceptOrLeave.mutate({ teamId: team.id, accept: true })}>
                {t("accept")}
              </Button>
              <Button
                color="destructive"
                variant="icon"
                StartIcon="x"
                onClick={() => acceptOrLeave.mutate({ teamId: team.id, accept: false })}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
