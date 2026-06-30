# Chantier 3 (SSO Keycloak) — Note de licence

**Aucun fichier `/ee` lu, copié ou paraphrasé.** Le SSO repose entièrement sur le **cœur AGPL** + le provider Keycloak natif de **NextAuth v4** (`next-auth/providers/keycloak`, licence permissive ISC/MIT). Le code SSO/SAML `/ee` n'est pas touché — le provider OIDC est ajouté **à côté**, indépendant.

| Fichier | Type | Provenance / Licence |
|---|---|---|
| `packages/prisma/schema.prisma` (enum `IdentityProvider` + `KEYCLOAK`) | édition | Cœur **AGPL**. Valeur additive. |
| `packages/prisma/migrations/20260501000000_add_keycloak_identity_provider/migration.sql` | nouveau | Migration additive originale. |
| `packages/features/auth/lib/identityProviders.ts` (mapping `keycloak`) | édition | **AGPL**. |
| `packages/features/auth/lib/next-auth-options.ts` (provider gated + garde mot de passe) | édition | **AGPL**. |
| `packages/lib/constants.ts` (`SSO_KEYCLOAK_*`) | édition | **AGPL**. |
| `packages/lib/errorCodes.ts` (`IdentityProviderLoginOnly`) | édition | **AGPL**. |
| `packages/i18n/locales/en/common.json` (`identity_provider_login_only`) | édition | **AGPL**. |
| `packages/features/auth/lib/identityProviders.test.ts` | édition | **AGPL** (test existant mis à jour). |

## Dérive de schéma Prisma (taxe de merge)
**1 valeur d'enum additive** (`IdentityProvider.KEYCLOAK`) + 1 migration. Additif et non destructif ; risque de conflit upstream **faible** (cal pourrait un jour ajouter sa propre valeur OIDC). Approuvé explicitement par le mainteneur.

## Sécurité
- Email non vérifié → login rejeté (`signIn` callback cœur, claim `email_verified`).
- Client confidentiel + PKCE S256 (défaut NextAuth v4).
- Pas de liaison silencieuse d'un email non vérifié à un compte local existant.
