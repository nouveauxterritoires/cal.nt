# PR4 — Note de licence (invitations)

**Aucun fichier `/ee` lu, copié ou paraphrasé.** L'upstream `inviteMemberUtils` (génération de token, liens, emails) vivait sous `/ee`. Tout est **réécrit en clean-room** sur des briques **cœur** : `UserRepository`, le service email `@calcom/emails/organization-email-service` (`sendTeamInviteEmail`), `@calcom/i18n/server` (`getTranslation`), et le modèle `VerificationToken`.

| Fichier | Type | Provenance / Licence |
|---|---|---|
| `packages/features/teams/repositories/TeamInviteRepository.ts` | nouveau | **Original clean-room** (token via `node:crypto`). Compatible MIT. |
| `packages/features/teams/repositories/TeamMembershipRepository.ts` (+ `create`) | édition | Original clean-room. |
| `packages/features/teams/services/TeamInviteService.ts` | nouveau | **Original clean-room** (orchestration invite/email). Compatible MIT. |
| `…/teams/inviteMember.{handler,schema}.ts` | nouveau | Original ; ADMIN/OWNER requis ; cap `MAX_NB_INVITES`. **AGPL** (trpc). |
| `…/teams/inviteMemberByToken.{handler,schema}.ts` | nouveau | Original ; redeem token (vérif email + expiration). **AGPL**. |
| `…/teams/_router.tsx` (2 procédures) | édition | **AGPL**. |
| `TeamInviteRepository.test.ts` | nouveau | Original clean-room. |

## Comportement clean-room
- Utilisateur existant invité → membership `accepted=false` + email (`isCalcomMember=true`, lien `/teams`).
- Email inconnu → `VerificationToken` (7 j) + email (`isCalcomMember=false`, lien `/signup?token=…`).
- `inviteMemberByToken` : vérifie token non expiré + email correspondant, crée/active la membership, supprime le token.
- Simplifications (hors périmètre) : pas de logique org/sous-équipe/auto-join ; langue de l'email = locale de l'inviteur.

## Dérive de schéma Prisma
**Aucune.** `VerificationToken.teamId` existait déjà.
