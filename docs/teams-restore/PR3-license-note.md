# PR3 — Note de licence (gestion des membres)

**Aucun fichier `/ee` lu, copié ou paraphrasé.** Les handlers upstream `removeMember`/`changeMemberRole`/`acceptOrLeave` étaient entièrement couplés à du `/ee` (`RemoveMemberServiceFactory`, `RoleManagementFactory`/PBAC, `TeamService.acceptTeamMembership/leaveTeamMembership`). Ils sont **réécrits en clean-room** avec des règles de rôle simples.

| Fichier | Type | Provenance / Licence |
|---|---|---|
| `packages/features/teams/repositories/TeamMembershipRepository.ts` | nouveau | **Original clean-room** (data access seul). Compatible MIT. |
| `…/teams/listMembers.{handler,schema}.ts` | nouveau | Original ; membre du team requis. **AGPL** (trpc). |
| `…/teams/acceptOrLeave.{handler,schema}.ts` | nouveau | Original ; accept = `accepted=true`, leave = delete (refus si dernier owner). **AGPL**. |
| `…/teams/removeMember.{handler,schema}.ts` | nouveau | Original ; ADMIN/OWNER (ou self), owner-only pour retirer admin/owner, protège le dernier owner. **AGPL**. |
| `…/teams/changeMemberRole.{handler,schema}.ts` | nouveau | Original ; ownership = owner-only, protège le dernier owner. **AGPL**. |
| `…/teams/_router.tsx` (4 procédures) | édition | **AGPL**. |
| `TeamMembershipRepository.test.ts` | nouveau | Original clean-room. |

## Règles métier clean-room (remplacement PBAC/factories)
- Permissions via `checkAdminOrOwner` + rôle de la membership du caller (pas de PBAC).
- Invariant « au moins un owner » appliqué sur leave / remove / demote.
- Pas de logique org / bulk / impersonation (hors périmètre).

## Dérive de schéma Prisma
**Aucune.**
