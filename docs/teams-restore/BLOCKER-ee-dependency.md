# Chantier 1 — Mur de dépendance `/ee` (arbitrage requis)

## Le constat

Le routeur tRPC `viewer/teams` est du **cœur AGPL**, mais ce ne sont que de **fines coquilles** qui délèguent la logique métier à du code situé **sous `/ee` (commercial)** — aujourd'hui **supprimé** du fork et **interdit de lecture/copie**.

Dépendances `/ee` + PBAC mesurées sur le routeur restauré (occurrences) :

| Cible importée | Réf. | Statut |
|---|---|---|
| `features/pbac/services/permission-check.service` | 29 | PBAC — **hors périmètre** → remplacer par contrôle de rôle simple |
| `features/ee/teams/services/teamService` | 13 | **/ee commercial** → clean-room |
| `features/ee/teams/repositories/TeamRepository` | 12 | **/ee commercial** → clean-room |
| `features/ee/teams/lib/queries` (`getTeamWithoutMembers`…) | 12 | **/ee commercial** → clean-room |
| `features/ee/teams/lib/inviteMemberUtils` | 3 | **/ee commercial** → clean-room |
| `ee/billing/**`, `features/ee/billing/**` | ~20 | billing — **hors périmètre** → retirer |
| `features/ee/round-robin/*reassignment` | 2 | **/ee** → différer (RR au booking via `getLuckyUser` reste intact) |
| `ee/organizations/lib/orgDomains`, `getBookerBaseUrlSync` | 3 | org — **hors périmètre** |

Vérifié : `packages/features/ee/teams` = **ABSENT**, `packages/features/pbac` = **ABSENT**.

## Conséquence

« Restaurer depuis git » **ne suffit pas** : le slice AGPL ne compile pas sans la couche `/ee`. Conformément à la consigne (« si tu butes sur une dépendance `/ee`, ne la recopie pas : propose un contournement clean-room »), il faut **réimplémenter en clean-room** la couche service/repository d'équipe, dans un package **non-`/ee`** (`packages/features/teams/`).

Les modèles Prisma étant intacts, écrire ces repositories à neuf est direct. La surface publique (méthodes attendues) est **inférée depuis les sites d'appel AGPL** (le routeur restauré, gardé en référence) + le schéma Prisma — **sans jamais lire le code `/ee`**.

## Surface clean-room à construire (cœur, hors org/billing/PBAC)

- `packages/features/teams/repositories/TeamRepository.ts` — `findById`, `getTeamWithoutMembers`, `findTeamsByUserId`, `findOwnedTeams`, `create`, `update`, `deleteById`, … (Prisma).
- `packages/features/teams/services/TeamService.ts` — création, mise à jour, suppression (+ nettoyage memberships/eventTypes), publication (sans billing).
- `packages/features/teams/lib/inviteMemberUtils.ts` — génération token, lien d'invitation, création membership.
- Remplacement PBAC → `auth/lib/checkAdminOrOwner.ts` + `MembershipRepository` (déjà présents) pour les gardes MEMBER/ADMIN/OWNER.

## Impact planning

L'effort passe de « réintroduction » à « **réimplémentation clean-room d'une couche service/repo** ». Découpage PR1 proposé, **réduit et compilable** :

> **PR1 — Team CRUD (backend clean-room)** : `TeamRepository` + `TeamService` (create/update/delete/get/list/listOwnedTeams), routeur `teams` à 6 procédures, flag `TEAMS_ENABLED`, tests. Membres/invitations/assignment/RR-reassign → PR2+.
