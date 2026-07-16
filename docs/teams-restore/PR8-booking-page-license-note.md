# PR8 — Note de licence (page de booking publique d'équipe, non-org)

**Règle d'or respectée : aucun fichier sous `packages/features/ee/**` ou `apps/api/v2/src/ee/**` n'a été lu, copié ou paraphrasé.** Les pages d'équipe supprimées importaient du `/ee` (org domains, org settings, verified domain, CRM, `getTeamWithMembers`) ; **rien de tout cela n'a été consulté**. La restauration est écrite **from scratch** en s'appuyant uniquement sur des modules cœur (AGPL) sans dépendance org.

| Fichier | Type | Provenance / Licence |
|---|---|---|
| `packages/features/teams/lib/getTeamWithEventTypes.ts` | nouveau | **Original clean-room** (requête Prisma `select`, garde non-org). Compatible MIT si extrait. |
| `packages/features/teams/lib/getTeamWithEventTypes.test.ts` | nouveau | **Original clean-room** (3 tests : garde non-org, filtre MANAGED/hidden, null). |
| `apps/web/server/lib/team/[slug]/[type]/getServerSideProps.ts` | nouveau | Original. Équivalent fonctionnel du SSR utilisateur cœur **AGPL** (`isTeamEvent: true`, org/CRM **retirés**). **AGPL** (apps/web). |
| `apps/web/app/(booking-page-wrapper)/team/[slug]/[type]/page.tsx` | nouveau | Réutilise la vue Booker cœur `users-type-public-view`. **AGPL** (apps/web). |
| `apps/web/app/(booking-page-wrapper)/team/[slug]/page.tsx` | nouveau | Page profil minimale originale (liste des event-types). **AGPL** (apps/web). |

## Comment le blocage `/ee` a été contourné (sans le lire)
- **Origine org (`getOrgFullOrigin`)** : non utilisée. Le stub cœur `getBookerBaseUrlSync()` (déjà présent, renvoie `WEBSITE_URL`) suffit pour les équipes non-org.
- **Données de l'event public** : `getPublicEvent(..., isTeamEvent: true, ...)` (cœur, **zéro import /ee**) résout déjà l'event par slug d'équipe, les hôtes et le profil.
- **Org settings / verified domain / CRM** : **non applicables** aux équipes non-org → simplement absents (pas de stub /ee).
- **Garde stricte** : `prisma.team.findFirst({ where: { slug, parentId: null, isOrganization: false } })` → toute équipe d'organisation renvoie **404**.

## Synthèse licence
- **Zéro `/ee`** : vérifié par grep sur les 5 fichiers (aucun `features/ee` / `src/ee`).
- Le loader + son test = **code original** (réutilisable MIT).
- Les pages/SSR vivent dans `apps/web` (**AGPLv3**, cohérent avec le reste de l'app).

## Limites assumées (équipes non-org uniquement)
- Équipes d'organisation : **404** (org hors-scope, logique sous /ee).
- Pas de redirection verified-domain, pas d'auto-remplissage CRM, pas de réglages SEO d'org (valeurs par défaut : indexable).

## Dérive de schéma Prisma
**Aucune.** PR8 ne touche ni `schema.prisma` ni les migrations.
