# Chantier 1 — Cartographie Teams (T1.1)

> Rapport produit **avant** tout code, comme exigé. Branche : `feat/teams-core`.
> État du fork au 2026-06-30 (HEAD). Commit de suppression EE/rebranding : `ab21c7f805 refactor: Cal.diy (#28903)`.

## TL;DR

La suppression a été **chirurgicale au niveau HTTP/UI** : le routeur tRPC `viewer/teams` et toutes les pages UI ont été retirés, **mais la couche données et la logique de booking ont survécu**.

**Conséquence majeure : aucune migration Prisma n'est nécessaire.** La tâche T1.2 (migrations) est probablement un **no-op**. Le chantier se réduit à : **reconstruire le routeur tRPC `teams` + les pages UI**, par-dessus une infra intacte.

---

## 1. Couche données (Prisma) — ✅ INTACTE

`packages/prisma/schema.prisma` :
- `model Team` (l.557) : `id, name, slug, logoUrl, parentId, isOrganization, isPrivate, rrResetInterval, rrTimestampBasis, hideBranding, brandColor, darkBrandColor, theme` ; relations `members (Membership[])`, `eventTypes (EventType[])`, `parent/children`.
- `model Membership` (l.744) : `id, teamId, userId, accepted, role (MembershipRole), customRoleId` ; relations `team, user, Host[]`.
- `enum MembershipRole` (MEMBER/ADMIN/OWNER) ✅
- `enum SchedulingType` (ROUND_ROBIN/COLLECTIVE/MANAGED) ✅
- `EventType` : `teamId`, `team`, `schedulingType`, `assignAllTeamMembers`, `assignRRMembersUsingSegment` ✅

➡️ **Pas de modèle/relation manquant pour le périmètre core. Pas de migration additive requise.**

## 2. Logique de booking équipe — ✅ INTACTE

- `packages/features/bookings/lib/getLuckyUser.ts` — sélection round-robin (poids, RR reset interval).
- `packages/features/bookings/lib/service/RegularBookingService.ts` — gère ROUND_ROBIN / COLLECTIVE / MANAGED.
- `handleNewBooking/getEventTypesFromDB.ts`, `loadUsers.ts`, `loadAndValidateUsers.ts` — chargent `team`, `hosts[]`, `assignAllTeamMembers`.
- Test : `handleNewBooking/test/computeTeamData.test.ts`.

## 3. Services membership — ✅ INTACTS

`packages/features/membership/` : `MembershipRepository.ts`, `MembershipService.ts` (isMember/isAdmin/isOwner), `PrismaOrgMembershipRepository.ts`.
Aussi : `auth/lib/checkAdminOrOwner.ts`, `auth/signup/utils/createOrUpdateMemberships.ts`, `apps/web/app/cache/membership.ts`.

## 4. tRPC `viewer/teams` — ❌ MANQUANT (à reconstruire)

Routeur entier supprimé (`packages/trpc/server/routers/viewer/teams/`, 116 fichiers, **48 procédures**). Non enregistré dans `viewer/_router.tsx`.

Survivants utiles : `availability.listTeam` (✅, `listTeamAvailability.handler.ts`) et `loggedInViewer.teamsAndUserProfilesQuery` (✅).

### Découpage des 48 procédures supprimées

**EN PÉRIMÈTRE (core teams — à réintroduire) :**
`create, update, delete, get, list, listOwnedTeams, listMembers, legacyListMembers, listSimpleMembers, getMembershipbyUser, hasTeamMembership, checkIfMembershipExists, changeMemberRole, removeMember, updateMembership, hasEditPermissionForUser, inviteMember, inviteMemberByToken, createInvite, deleteInvite, listInvites, resendInvitation, setInviteExpiration, acceptOrLeave, getMemberAvailability, addMembersToEventTypes, removeHostsFromEventTypes, publish, roundRobinReassign, roundRobinManualReassign, getRoundRobinHostsToReasign`

**HORS PÉRIMÈTRE (org / billing / PBAC / insights — à ne PAS réintroduire) :**
`getSubscriptionStatus, listInvoices, hasActiveTeamPlan, hasTeamPlan, getUpgradeable, skipTeamTrials, skipTrialForTeam, getInternalNotesPresets, updateInternalNotesPresets, getManagedEventUsersToReassign, managedEventReassign, managedEventManualReassign, getActiveUserBookings, getActiveUserBreakdown, getUserConnectedApps, getSMSLockStateTeamsUsers, getTeamsForFeature`

> ⚠️ Certaines procédures « en périmètre » importent des dépendances coupées (PBAC, billing). Au câblage, on **élague** ces dépendances ou on les remplace par des gardes de rôle simples (`checkAdminOrOwner`). Tout point de blocage `/ee` sera signalé, pas recopié.

## 5. UI Teams — ❌ MANQUANTE (à reconstruire)

Supprimés (non-`/ee`, non-org) :
- **Gestion** : `settings/teams/new`, `settings/(settings-layout)/teams/[id]/{profile,members,settings,appearance}` (⚠️ `billing`, `roles`, `features` = hors périmètre).
- **Liste** : `(main-nav)/teams/{page,server-page,CTA,actions}.tsx`.
- **Onboarding équipe** : `onboarding/teams/**`, `modules/onboarding/teams/**`, `useCreateTeam.ts`.
- **Pages de réservation publiques** : `(booking-page-wrapper)/team/[slug]/[type]/**` (page de booking collectif/RR — **essentiel** au flux).
- **Assignment event-type** : `modules/event-types/components/tabs/assignment/EventTeamAssignmentTab*.tsx`, `useTeamMembersWithSegment.tsx`.

Aucune route `settings/teams` ni `apps/web/modules/teams` ne subsiste.

## 6. Références cassées — ✅ AUCUNE

Suppression propre : aucun import survivant vers `viewer.teams.*`, `@calcom/features/teams` ou `@calcom/features/ee/teams`. **Pas de dette de réamorçage** avant de reconstruire.

---

## Stratégie de restauration proposée

1. **Restaurer depuis l'historique git** (`git checkout ab21c7f805^ -- <paths non-/ee>`) le routeur `viewer/teams` et les pages UI **en périmètre uniquement**, puis **élaguer** les procédures/imports org/billing/PBAC.
2. **Enregistrer** `teamsRouter` dans `viewer/_router.tsx`, derrière le flag `TEAMS_ENABLED`.
3. **Recâbler** les pages UI (liste, settings membres, création, booking public d'équipe, onglet assignment).
4. **Tests d'intégration** : créer équipe → inviter → accepter → event-type collectif → booking round-robin.

### Découpage en PRs (respect <500 lignes / <10 fichiers)
- **PR 1** — Routeur tRPC `teams` (procédures CRUD équipe + membres), flag, tests unitaires.
- **PR 2** — Invitations (invite/accept/resend/expiration) + emails.
- **PR 3** — UI gestion (liste + settings membres + création).
- **PR 4** — Event-type d'équipe (onglet assignment) + page de booking publique collectif/RR.
- **PR 5** — Round-robin reassign + tests d'intégration de bout en bout.

## ⚠️ Décision de licence requise (bloquant pour le câblage)

Le routeur `viewer/teams` et les pages UI à restaurer sont du **cœur cal.com sous AGPLv3** (hors `/ee`). Les réintroduire — même via l'historique git de ton propre fork — fait **hériter ces fichiers de l'AGPLv3**, pas de la licence MIT.

Aucune ligne de `/ee` n'est touchée (clean-room respecté), mais le résultat **ne peut pas rester MIT** sur ces fichiers. À arbitrer avant de committer du code.
