"use client";

import type {
  EventTypeSetupProps,
  FormValues,
  Host,
  TeamMember,
} from "@calcom/features/eventtypes/lib/types";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { SchedulingType } from "@calcom/prisma/enums";
import { Avatar } from "@calcom/ui/components/avatar";
import { Badge } from "@calcom/ui/components/badge";
import { EmptyScreen } from "@calcom/ui/components/empty-screen";
import { useFormContext } from "react-hook-form";

// cal.com host defaults: priority 2 = "medium", weight 100 = even round-robin distribution.
const DEFAULT_PRIORITY = 2;
const DEFAULT_WEIGHT = 100;

type Props = {
  orgId: number | null;
  teamMembers: TeamMember[];
  team: EventTypeSetupProps["team"];
  eventType: EventTypeSetupProps["eventType"];
};

const toHost = (userId: number, isFixed: boolean): Host => ({
  userId,
  isFixed,
  priority: DEFAULT_PRIORITY,
  weight: DEFAULT_WEIGHT,
  groupId: null,
});

export const EventTeamAssignmentTab = ({ teamMembers, eventType }: Props) => {
  const { t } = useLocale();
  const formMethods = useFormContext<FormValues>();

  const schedulingType = formMethods.watch("schedulingType");
  const hosts = formMethods.watch("hosts");
  const assignAllTeamMembers = formMethods.watch("assignAllTeamMembers");

  // Managed event types assign members through child event-types, not the hosts table.
  if (schedulingType === SchedulingType.MANAGED) {
    return (
      <div className="border-subtle bg-default rounded-md border p-6">
        <p className="text-emphasis font-medium">{t("managed_event")}</p>
        <p className="text-subtle mt-1 text-sm">{t("managed_event_url_clarification")}</p>
      </div>
    );
  }

  const isCollective = schedulingType === SchedulingType.COLLECTIVE;
  const selectedUserIds = new Set(hosts.map((host) => host.userId));

  const setHosts = (next: Host[]) => formMethods.setValue("hosts", next, { shouldDirty: true });

  const onSchedulingTypeChange = (next: SchedulingType) => {
    formMethods.setValue("schedulingType", next, { shouldDirty: true });
    // Collective hosts are all fixed; round-robin hosts rotate (non-fixed).
    setHosts(hosts.map((host) => ({ ...host, isFixed: next === SchedulingType.COLLECTIVE })));
  };

  const onToggleAssignAll = (checked: boolean) => {
    formMethods.setValue("assignAllTeamMembers", checked, { shouldDirty: true });
    if (checked) {
      setHosts(teamMembers.map((member) => toHost(Number(member.value), isCollective)));
    }
  };

  const onToggleMember = (userId: number, checked: boolean) => {
    if (checked) {
      setHosts([...hosts, toHost(userId, isCollective)]);
    } else {
      setHosts(hosts.filter((host) => host.userId !== userId));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="border-subtle bg-default rounded-md border p-4">
        <legend className="text-emphasis px-1 text-sm font-medium">{t("scheduling_type")}</legend>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="border-subtle hover:border-emphasis flex flex-1 cursor-pointer items-start gap-3 rounded-md border p-3">
            <input
              type="radio"
              name="schedulingType"
              className="mt-1"
              checked={isCollective}
              onChange={() => onSchedulingTypeChange(SchedulingType.COLLECTIVE)}
            />
            <span>
              <span className="text-emphasis block text-sm font-medium">{t("collective")}</span>
              <span className="text-subtle block text-sm">{t("collective_description")}</span>
            </span>
          </label>
          <label className="border-subtle hover:border-emphasis flex flex-1 cursor-pointer items-start gap-3 rounded-md border p-3">
            <input
              type="radio"
              name="schedulingType"
              className="mt-1"
              checked={schedulingType === SchedulingType.ROUND_ROBIN}
              onChange={() => onSchedulingTypeChange(SchedulingType.ROUND_ROBIN)}
            />
            <span>
              <span className="text-emphasis block text-sm font-medium">{t("round_robin")}</span>
              <span className="text-subtle block text-sm">{t("round_robin_description")}</span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="border-subtle bg-default rounded-md border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emphasis text-sm font-medium">
              {isCollective ? t("fixed_hosts") : t("hosts")}
            </p>
            <p className="text-subtle text-sm">{t("select_members")}</p>
          </div>
          <label className="text-default flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={assignAllTeamMembers}
              onChange={(e) => onToggleAssignAll(e.target.checked)}
            />
            {t("assign_all_team_members")}
          </label>
        </div>

        {teamMembers.length === 0 ? (
          <div className="mt-4">
            <EmptyScreen Icon="users" headline={t("no_team_members")} description={t("add_members")} />
          </div>
        ) : (
          <ul className="divide-subtle mt-4 divide-y">
            {teamMembers.map((member) => {
              const userId = Number(member.value);
              const checked = assignAllTeamMembers || selectedUserIds.has(userId);
              return (
                <li key={member.value} className="flex items-center gap-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label={member.label}
                    checked={checked}
                    disabled={assignAllTeamMembers}
                    onChange={(e) => onToggleMember(userId, e.target.checked)}
                  />
                  <Avatar size="sm" alt={member.label} imageSrc={member.avatar} />
                  <div className="flex flex-col">
                    <span className="text-emphasis text-sm font-medium">{member.label}</span>
                    <span className="text-subtle text-sm">{member.email}</span>
                  </div>
                  {checked && (
                    <Badge className="ml-auto" variant="gray">
                      {isCollective ? t("fixed_hosts") : t("host")}
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!assignAllTeamMembers && hosts.length === 0 && (
          <p className="text-subtle mt-3 text-sm">{t("no_hosts_assigned")}</p>
        )}
      </div>

      {eventType.team?.name && (
        <p className="text-subtle text-sm">
          {t("team")}: <span className="text-emphasis font-medium">{eventType.team.name}</span>
        </p>
      )}
    </div>
  );
};

export default EventTeamAssignmentTab;
