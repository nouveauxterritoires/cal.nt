"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { ConfirmationDialogContent, Dialog } from "@calcom/ui/components/dialog";
import { TextField } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function TeamProfileView({ teamId }: { teamId: number }) {
  const { t } = useLocale();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const teamQuery = trpc.viewer.teams.get.useQuery({ teamId });

  useEffect(() => {
    if (teamQuery.data?.name) setName(teamQuery.data.name);
  }, [teamQuery.data?.name]);

  const updateMutation = trpc.viewer.teams.update.useMutation({
    onSuccess: () => {
      showToast(t("your_team_updated_successfully"), "success");
      utils.viewer.teams.get.invalidate({ teamId });
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const deleteMutation = trpc.viewer.teams.delete.useMutation({
    onSuccess: () => {
      showToast(t("your_team_disbanded_successfully"), "success");
      router.push("/teams");
      router.refresh();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const canManage = teamQuery.data?.membership.role !== "MEMBER";

  return (
    <div className="flex flex-col gap-6">
      <div className="border-subtle bg-default flex flex-col gap-4 rounded-md border p-4">
        <TextField
          label={t("team_name")}
          value={name}
          disabled={!canManage}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <Button
            color="primary"
            loading={updateMutation.isPending}
            disabled={!canManage || !name.trim() || name === teamQuery.data?.name}
            onClick={() => updateMutation.mutate({ id: teamId, name: name.trim() })}>
            {t("update")}
          </Button>
        </div>
      </div>

      {teamQuery.data?.membership.role === "OWNER" && (
        <div className="border-subtle bg-default flex items-center justify-between rounded-md border p-4">
          <div className="flex flex-col">
            <span className="text-emphasis font-medium">{t("disband_team")}</span>
            <span className="text-subtle text-sm">{t("disband_team_description")}</span>
          </div>
          <Button color="destructive" onClick={() => setConfirmOpen(true)}>
            {t("disband_team")}
          </Button>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <ConfirmationDialogContent
          variety="danger"
          title={t("disband_team")}
          confirmBtnText={t("confirm_disband_team")}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate({ teamId })}>
          {t("disband_team_confirmation_message")}
        </ConfirmationDialogContent>
      </Dialog>
    </div>
  );
}

export default TeamProfileView;
