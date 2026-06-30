# PR2 — Note de licence (Team get / update / delete)

**Aucun fichier `/ee` lu, copié ou paraphrasé.** Les originaux AGPL `viewer/teams/{get,update,delete}.handler` ont servi de référence d'interface ; toutes les dépendances `/ee` (PBAC `PermissionCheckService`, `TeamRepository`/`TeamService` commerciaux, `getOrgFullOrigin`, redirections org, billing/metadata) ont été **retirées et remplacées en clean-room**.

| Fichier | Type | Provenance / Licence |
|---|---|---|
| `packages/features/teams/repositories/TeamRepository.ts` (+ méthodes `findById`, `findIsOrganizationById`, `isSlugAvailableForUpdate`, `updateById`, `clearEventTypeLeadThreshold`, `deleteById`) | édition | **Original clean-room**. Compatible MIT. |
| `…/teams/get.{handler,schema}.ts` | nouveau | Original ; garde de rôle via `MembershipRepository` (pas de PBAC). **AGPL** (paquet trpc). |
| `…/teams/update.{handler,schema}.ts` | nouveau | Original simplifié : org-redirect + billing-metadata **supprimés** ; permission ADMIN/OWNER via `MembershipRepository.getAdminOrOwnerMembership`. **AGPL**. |
| `…/teams/delete.{handler,schema}.ts` | nouveau | Original ; OWNER-only ; suppression clean-room (purge `VerificationToken` avant `team.delete`, le reste cascade). **AGPL**. |
| `…/teams/_router.tsx` (3 procédures) | édition | **AGPL**. |
| `TeamRepository.test.ts` | édition | Original clean-room. |

## Remplacements PBAC → contrôle de rôle (clean-room)
- `update` : `team.update` (fallback OWNER/ADMIN) → `MembershipRepository.getAdminOrOwnerMembership` (accepted + ADMIN/OWNER).
- `delete` : `team.delete` (fallback OWNER) → membership accepté + rôle `OWNER`.

## Dérive de schéma Prisma
**Aucune.** Pas de changement de `schema.prisma` ni de migration.
