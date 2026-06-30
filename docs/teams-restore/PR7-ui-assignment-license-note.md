# PR7 (UI) — Note de licence (onglet *Assignment* event-type d'équipe)

**Règle d'or respectée : aucun fichier sous `packages/features/ee/**` ou `apps/api/v2/src/ee/**` n'a été lu, copié ou paraphrasé.** Le composant `EventTeamAssignmentTab` était présent dans le cœur sous forme de **stub neutralisé** (`dynamic(() => Promise.resolve((_props) => null))`) ; il a été **réécrit en clean-room** contre les types publics du formulaire (`FormValues`, `Host`, `TeamMember`), sans jamais consulter l'implémentation commerciale `/ee`.

| Fichier | Type | Provenance / Licence |
|---|---|---|
| `apps/web/modules/event-types/components/tabs/team/EventTeamAssignmentTab.tsx` | nouveau | **Original clean-room** (écrit contre `FormValues`/`Host`/`TeamMember`). Compatible MIT si extrait. |
| `apps/web/modules/event-types/components/EventTypeWebWrapper.tsx` (remplacement du stub par l'import réel) | édition | Cœur **AGPL** (1 ligne). |
| `packages/i18n/locales/en/common.json` (2 clés : `assign_all_team_members`, `no_hosts_assigned`) | édition | Ajout trivial original. **AGPL** (cœur). |

## Fonctionnement (aucune dépendance `/ee`)
- Lit/écrit **uniquement** le formulaire react-hook-form existant via `useFormContext` : champs `schedulingType`, `hosts`, `assignAllTeamMembers`.
- La persistance passe par le bouton **Save** existant → mutation cœur `viewer.eventTypesHeavy.update` (déjà fonctionnelle, valide que les hosts sont des membres acceptés). **Aucune** procédure tRPC ajoutée.
- Couvre **COLLECTIVE** (tous hosts fixes) et **ROUND_ROBIN** (hosts rotatifs, poids 100 / priorité 2 par défaut). **MANAGED** explicitement hors-scope (affiche une note).

## Synthèse licence
- **Zéro `/ee`** : conforme à la contrainte non négociable.
- Le composant + les défauts d'hôte = **code original**.
- Le fichier wrapper et `common.json` restent **AGPLv3** (cœur), cohérent avec le reste de `apps/web`.

## Dérive de schéma Prisma
**Aucune.** PR7-UI ne touche ni `schema.prisma` ni les migrations.
