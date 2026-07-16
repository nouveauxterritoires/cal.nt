# PR1 — Note de licence (Team création + listing)

**Règle d'or respectée : aucun fichier sous `packages/features/ee/**` ou `apps/api/v2/src/ee/**` n'a été lu, copié ou paraphrasé.** Les originaux `viewer/teams` (cœur AGPL) ont servi de **référence d'interface** uniquement ; toute dépendance vers `/ee` (TeamRepository, TeamService, payments, PBAC, org) a été **retirée**, pas recopiée.

| Fichier | Type | Provenance / Licence |
|---|---|---|
| `packages/features/teams/repositories/TeamRepository.ts` | nouveau | **Original clean-room** (écrit contre le schéma Prisma). Compatible MIT. |
| `packages/lib/constants.ts` (ajout `TEAMS_ENABLED`) | édition | Ajout trivial original. Le fichier reste **AGPL** (cœur). |
| `packages/trpc/server/routers/viewer/teams/_router.tsx` | nouveau | Original (middleware de flag + lazy-imports, convention maison). Vit dans `packages/trpc` (**AGPL**). |
| `…/teams/create.schema.ts` · `create.handler.ts` | nouveau | Original simplifié (billing/org **supprimés**). Délègue au repo clean-room. **AGPL** (paquet trpc). |
| `…/teams/list.schema.ts` · `list.handler.ts` | nouveau | Équivalents fonctionnels du cœur **AGPL** `viewer/teams` (déps `/ee` retirées). **AGPL**. |
| `…/teams/listOwnedTeams.handler.ts` | nouveau | Idem. **AGPL**. |
| `packages/trpc/server/routers/viewer/_router.tsx` (enregistrement) | édition | Cœur **AGPL**. |
| `packages/features/teams/repositories/TeamRepository.test.ts` | nouveau | Original clean-room. |

## Synthèse licence
- **Zéro `/ee`** : conforme à la contrainte non négociable.
- `TeamRepository` + son test + le flag = **code original** (réutilisable MIT si extrait).
- Les fichiers tRPC `viewer/teams` héritent de l'**AGPLv3** (décision déjà validée : « Accepter l'AGPLv3 »), cohérent avec le paquet `packages/trpc` qui est déjà AGPL.

## Dérive de schéma Prisma
**Aucune.** PR1 ne touche pas `schema.prisma` ni les migrations → pas de taxe de maintenance sur les merges upstream.
