# Test local — Teams + SSO Keycloak + Workflows n8n

Branche d'intégration : `integration/local-test` (= Teams stack #4→#7 + UI #10 + booking #11 + SSO #8 + n8n #9).
Serveur : `http://localhost:3000` (déjà lancé via `yarn dev`).

---

## A) Teams — testable immédiatement (aucun setup)

1. **Créer une équipe** : `/teams` → **New** → nom + slug. Tu en es **owner**.
2. **Inviter** : ouvre l'équipe → **Manage** (`/settings/teams/<id>/members`) → email (ex. `free@example.com`) + rôle → **Invite**.
3. **Accepter** : connecte-toi avec le compte invité → `/teams` → **Accept**.
4. **Event-type d'équipe** : `/event-types` → bouton **New** de la section de l'équipe → crée l'event → tu arrives sur l'onglet **Assignment**.
5. **Assigner les hôtes** : choisis **Collective** (tous fixes) ou **Round-robin** (rotation) → coche les membres → **Save**.
6. **Booking public** : `/team/<slug>` (liste) → clic sur un event → `/team/<slug>/<event-slug>` → page de réservation.

> ⚠️ **Sélecteur de créneaux** : le Booker récupère les dispos via l'API v2 (`NEXT_PUBLIC_API_V2_URL=http://localhost:5555/api/v2`). Si ce service n'est pas lancé, **aucun créneau ne s'affiche** — sur **toutes** les pages de booking (pas un bug Teams). Lance-le si besoin (je peux le démarrer).

---

## B) SSO Keycloak — petit setup

### 1. Côté Keycloak (admin)
Dans le realm de ton choix :
- **Clients → Create client** → *OpenID Connect*, **Client ID** = `cal-nt`
- **Client authentication** = **ON** (confidentiel) · **Standard flow** = ON
- **Valid redirect URIs** = `http://localhost:3000/api/auth/callback/keycloak`
- **Valid post logout redirect URIs** = `http://localhost:3000/*`
- **Web origins** = `http://localhost:3000`
- **Save** → onglet **Credentials** → copie le **Client secret**
- Crée un **utilisateur test** avec un **email** + **Email verified = ON** + un mot de passe
  (le provisioning JIT exige `email_verified`).

### 2. Côté `.env` (déjà scaffoldé en bas du fichier)
```
SSO_KEYCLOAK_ENABLED="true"
KEYCLOAK_ISSUER="https://<host>/realms/<realm>"   # Keycloak 26.x : pas de /auth
KEYCLOAK_CLIENT_ID="cal-nt"
KEYCLOAK_CLIENT_SECRET="<secret copié>"
# Optionnel : forcer SSO-only (désactive email/mot de passe)
SSO_KEYCLOAK_DISABLE_PASSWORD_LOGIN="false"
```
Puis **dis-moi de redémarrer** le serveur (les vars d'env sont lues au boot).

### 3. Se connecter
Il n'y a pas (encore) de bouton dédié sur `/auth/login`. Va sur :
`http://localhost:3000/api/auth/signin/keycloak`
→ redirection vers Keycloak → après login, le compte est **provisionné automatiquement** (JIT) et connecté.
> Je peux ajouter un bouton « Se connecter avec Keycloak » sur `/auth/login` si tu veux (petit follow-up).

---

## C) Workflows n8n

Côté cal = **webhooks natifs signés** (HMAC-SHA256, header `X-Cal-Signature-256`). Aucun moteur /ee.

1. **Lancer n8n** : `npx n8n` (ou `docker run -it --rm -p 5678:5678 n8nio/n8n`) → `http://localhost:5678`
2. **Importer** les 3 workflows : `docs/workflows-n8n/workflows/cal-reminder.json`, `cal-followup.json`, `cal-no-show.json`
3. Chaque workflow a un nœud **Webhook** → copie son **Production URL**
4. Dans le nœud **Code** de vérif HMAC, renseigne le **secret partagé** (voir `docs/workflows-n8n/hmac-verification.js`)
5. **Côté cal** : Settings → Developer → **Webhooks** → New → *Subscriber URL* = l'URL n8n, *Secret* = le même secret, coche les triggers (Booking created/cancelled/rescheduled…)
6. **Fais une réservation** → cal envoie le webhook signé → n8n vérifie le HMAC → exécute.

Détails complets : `docs/workflows-n8n/README.md`.

---

## Bascule de branche
Le serveur tourne sur `integration/local-test`. Les PRs restent propres (#4→#11, #8, #9). Pour revenir à un état « propre » : `git checkout feat/teams-booking-page` (Teams seul) ou `main`.
