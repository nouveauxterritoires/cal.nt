# SSO Keycloak (OIDC) — Chantier 3

SSO OIDC vers un Keycloak **existant** (26.x / Quarkus), entièrement dans le cœur AGPL via **NextAuth v4**. **Aucun code `/ee` / SAML touché.** Le provider `next-auth/providers/keycloak` est sous licence permissive (ISC/MIT).

## Variables d'environnement

| Variable | Description |
|---|---|
| `SSO_KEYCLOAK_ENABLED` | `"true"` pour activer le provider (opt-in). |
| `KEYCLOAK_CLIENT_ID` | Client ID du client confidentiel Keycloak. |
| `KEYCLOAK_CLIENT_SECRET` | Secret du client confidentiel. |
| `KEYCLOAK_ISSUER` | **Keycloak 26.x : `https://<host>/realms/<realm>`** (⚠️ **sans** `/auth`, supprimé depuis KC 17). NextAuth découvre les endpoints via `.well-known/openid-configuration`. |
| `SSO_KEYCLOAK_DISABLE_PASSWORD_LOGIN` | `"true"` pour rejeter le login email/mot de passe local (force le passage par Keycloak). |

Le provider n'est ajouté que si `SSO_KEYCLOAK_ENABLED="true"` **et** les 3 vars `KEYCLOAK_*` sont présentes.

## Configuration côté Keycloak (à exécuter par l'admin)

1. **Créer un client** dans le realm :
   - Client type : **OpenID Connect**
   - Client authentication : **On** (client *confidentiel*)
   - Standard flow : **activé**
   - **Valid redirect URI** : `<NEXT_PUBLIC_WEBAPP_URL>/api/auth/callback/keycloak`
   - PKCE : `S256` (NextAuth v4 active PKCE + state par défaut pour le code flow).
2. **Mappers** (onglet *Client scopes* → scope dédié → *Mappers*) :
   - `email` et `preferred_username` sont exposés par les scopes standards `email`/`profile`.
   - **`email_verified` doit être vrai** : le `signIn` callback de cal rejette tout login dont l'email n'est pas vérifié (`/auth/error?error=unverified-email`).
   - **(Optionnel) Rôles/groupes → cal** : KC 26.x n'inclut **pas** les groupes dans le token par défaut. Ajouter un mapper **« Group Membership »** (claim `groups`) ou un mapper de rôles. Le mapping `groups`/rôles → appartenance d'équipe + flag admin sera branché dans une PR de suivi (Chantier 1 ↔ 3).

## Provisioning & liaison de comptes (JIT)

Le flux OAuth cœur de cal gère le JIT : à la 1re connexion vérifiée, l'utilisateur est créé / fusionné par email **uniquement si `email_verified` est vrai** (pas de liaison silencieuse non vérifiée). Un email déjà rattaché à un compte *credentials* local n'est lié que si l'IdP a prouvé la possession de l'email.

## Désactiver le mot de passe local

`SSO_KEYCLOAK_DISABLE_PASSWORD_LOGIN="true"` fait échouer `authorizeCredentials` avec `ErrorCode.IdentityProviderLoginOnly` (i18n `identity_provider_login_only`).

## Limites (PR de suivi)
- Mapping rôles/groupes Keycloak → équipes/admin (nécessite Chantier 1 mergé).
- Pas de logique org/SAML (hors périmètre).
