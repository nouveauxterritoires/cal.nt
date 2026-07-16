"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { MembershipRole } from "@calcom/prisma/enums";
import { trpc } from "@calcom/trpc/react";
import { Badge } from "@calcom/ui/components/badge";
import { Button } from "@calcom/ui/components/button";
import { EmptyScreen } from "@calcom/ui/components/empty-screen";
import { TextField } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";
import { useState } from "react";

const ROLES: MembershipRole[] = [MembershipRole.MEMBER, MembershipRole.ADMIN, MembershipRole.OWNER];

export function TeamMembersView({ teamId }: { teamId: number }) {
  const { t } = useLocale();
  const utils = trpc.useUtils();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MembershipRole>(MembershipRole.MEMBER);

  const membersQuery = trpc.viewer.teams.listMembers.useQuery({ teamId });
  const teamQuery = trpc.viewer.teams.get.useQuery({ teamId });

  // Mirror the server-side guard: only admins/owners may invite or mutate members.
  const myRole = teamQuery.data?.membership.role;
  const canManage = myRole === MembershipRole.ADMIN || myRole === MembershipRole.OWNER;

  const invalidate = () => utils.viewer.teams.listMembers.invalidate({ teamId });
  const onError = (err: { message: string }) => showToast(err.message, "error");

  const inviteMutation = trpc.viewer.teams.inviteMember.useMutation({
    onSuccess: () => {
      showToast(t("invitation_sent"), "success");
      setInviteEmail("");
      invalidate();
    },
    onError,
  });
  const changeRoleMutation = trpc.viewer.teams.changeMemberRole.useMutation({
    onSuccess: invalidate,
    onError,
  });
  const removeMutation = trpc.viewer.teams.removeMember.useMutation({
    onSuccess: () => {
      showToast(t("member_removed"), "success");
      invalidate();
    },
    onError,
  });

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <div className="border-subtle bg-default flex items-end gap-2 rounded-md border p-4">
          <TextField
            containerClassName="flex-1"
            label={t("invite_team_member")}
            type="email"
            value={inviteEmail}
            placeholder="colleague@example.com"
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <select
            aria-label={t("role")}
            className="border-default bg-default text-default h-9 rounded-md border px-2 text-sm"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as MembershipRole)}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role.toLowerCase()}
              </option>
            ))}
          </select>
          <Button
            color="primary"
            loading={inviteMutation.isPending}
            disabled={!inviteEmail.trim()}
            onClick={() => inviteMutation.mutate({ teamId, emails: inviteEmail.trim(), role: inviteRole })}>
            {t("invite")}
          </Button>
        </div>
      )}

      {membersQuery.data && membersQuery.data.length > 0 ? (
        <ul className="border-subtle divide-subtle bg-default divide-y rounded-md border">
          {membersQuery.data.map((member) => (
            <li key={member.user.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col">
                <span className="text-emphasis font-medium">{member.user.name ?? member.user.email}</span>
                <span className="text-subtle text-sm">{member.user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                {!member.accepted && <Badge variant="orange">{t("pending")}</Badge>}
                {canManage ? (
                  <>
                    <select
                      aria-label={t("role")}
                      className="border-default bg-default text-default h-9 rounded-md border px-2 text-sm"
                      value={member.role}
                      disabled={changeRoleMutation.isPending}
                      onChange={(e) =>
                        changeRoleMutation.mutate({
                          teamId,
                          memberId: member.user.id,
                          role: e.target.value as MembershipRole,
                        })
                      }>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role.toLowerCase()}
                        </option>
                      ))}
                    </select>
                    <Button
                      color="destructive"
                      variant="icon"
                      StartIcon="trash"
                      onClick={() => removeMutation.mutate({ teamId, memberId: member.user.id })}
                    />
                  </>
                ) : (
                  <Badge variant="gray">{member.role.toLowerCase()}</Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyScreen Icon="users" headline={t("no_members")} description={t("no_members_description")} />
      )}
    </div>
  );
}

export default TeamMembersView;
