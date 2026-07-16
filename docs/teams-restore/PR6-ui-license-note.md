# PR6 — Note de licence (UI Teams : liste + création)

**Aucun fichier `/ee` lu, copié ou paraphrasé.** L'UI est réécrite en clean-room en calquant les **conventions cœur** d'une vue survivante (`apps/web/modules/availability/availability-view.tsx` + sa page App Router) et en consommant le routeur tRPC `viewer.teams` (livré en #4–#7).

| Fichier | Type | Provenance / Licence |
|---|---|---|
| `apps/web/modules/teams/teams-view.tsx` | nouveau | **Original clean-room** (composants client `TeamsListView` + `CreateTeamButton`, hooks `trpc.viewer.teams`). **AGPL** (apps/web). |
| `apps/web/app/(use-page-wrapper)/(main-nav)/teams/page.tsx` | nouveau | Original ; calque la page App Router `availability`. **AGPL**. |
| `packages/i18n/locales/en/common.json` (3 clés) | édition | **AGPL**. |

## Périmètre (compile-only)
- **Vérifié : `tsc` apps/web complet = 0 erreur** (types OK, y compris les nouveaux fichiers).
- **Non vérifié sans app qui tourne** : rendu visuel, comportement runtime des hooks/dialog. À relire avec un dev server.
- Couvre : page `/teams` (liste des équipes + rôle + statut pending + lien « Manage ») et création d'équipe (dialog → `viewer.teams.create`).
- **Reste UI** (PRs suivantes) : settings membres (`/settings/teams/[id]/members`), invitations UI, onglet assignment event-type, page de booking publique d'équipe.

## Dérive de schéma Prisma
**Aucune.**
