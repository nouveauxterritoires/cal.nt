# PR5 — Note de licence (assignation des hôtes aux event-types d'équipe)

**Aucun fichier `/ee` lu, copié ou paraphrasé.** Les handlers upstream `addMembersToEventTypes`/`removeHostsFromEventTypes` ne dépendaient de `/ee` que par **PBAC** (`PermissionCheckService`), remplacé par un contrôle de rôle clean-room.

| Fichier | Type | Provenance / Licence |
|---|---|---|
| `packages/features/teams/repositories/TeamEventTypeRepository.ts` | nouveau | **Original clean-room** (table `Host` uniquement). Compatible MIT. |
| `…/teams/addMembersToEventTypes.{handler,schema}.ts` | nouveau | Original ; ADMIN/OWNER ; `isFixed` = `schedulingType === COLLECTIVE`. **AGPL** (trpc). |
| `…/teams/removeHostsFromEventTypes.{handler,schema}.ts` | nouveau | Original ; ADMIN/OWNER. **AGPL**. |
| `…/teams/_router.tsx` (2 procédures) | édition | **AGPL**. |
| `TeamEventTypeRepository.test.ts` | nouveau | Original clean-room. |

## Sécurité / périmètre
- Les event-types sont **filtrés par `teamId`** côté repo : impossible d'assigner/retirer des hôtes hors de l'équipe administrée.
- `isFixed` dérivé du `schedulingType` (collectif = hôtes fixes ; round-robin/managed = non).
- Réservation collective / round-robin elle-même : **déjà fonctionnelle** dans le cœur (`getLuckyUser`, `RegularBookingService`) — non touchée.

## Dérive de schéma Prisma
**Aucune.**
