# Déploiement cal.nvt.one (TEST)

Kit **non commité** pour déployer la branche `integration/local-test`
(Teams + SSO Keycloak + n8n, clean-room) sur le serveur Docker Evolix.

```
ssh cal@nouveauxterritoires-docker02.evolix.net -p 2222   # serveur
https://cal.nvt.one                                       # URL publique
```

## Lancer / mettre à jour

Depuis la racine du repo, sur la branche `integration/local-test` :

```bash
bash deploy/nvt/deploy.sh
```

Une seule commande pour le 1er déploiement **et** les mises à jour (rsync incrémental,
rebuild, restart). L'`.env` distant et ses secrets sont préservés entre les runs.

## Architecture déployée (`docker-compose.prod.yml`)

```
          Internet (HTTPS, SNI cal.nvt.one)
                     │
        Evolix  ──(HTTPS pass-through)──▶  docker02:10310
                     │
                 ┌───▼────── caddy (TLS terminé ici, cert Let's Encrypt auto)
                 │              ├── /api/v2/*  ─▶ calcom-api:3002   (créneaux/slots)
                 │              └── /*         ─▶ calcom:3000       (web + migrations)
                 └── réseau interne ── database (postgres) · redis
```

- **Seul Caddy est exposé** sur l'hôte (`127.0.0.1`? non : `0.0.0.0:10310`, pour
  qu'Evolix l'atteigne). web / api / db / redis restent sur le réseau interne.
- **TLS** : Evolix transmet le HTTPS brut → Caddy présente le certificat
  cal.nvt.one obtenu automatiquement via **TLS-ALPN-01** (challenge sur le 443 transmis).
- **Pas de Prisma Studio** en prod.

## À faire (une fois)

1. **Premier compte admin** : `https://cal.nvt.one/signup` (le seed prod ne crée pas `pro`/`free`).
2. **Certificat** : au 1er accès à `https://cal.nvt.one`, Caddy obtient le cert.
   Vérifier : `docker compose -f docker-compose.prod.yml logs -f caddy`.
   > Si le challenge échoue (Evolix ne transmettrait pas l'ALPN), fallback : déposer
   > un cert manuel et remplacer le bloc `cal.nvt.one { … }` par `tls /chemin/cert /chemin/key`.

## SSO Keycloak

1. Client Keycloak `cal-nt`, redirect URI `https://cal.nvt.one/api/auth/callback/keycloak`.
2. Éditer `/home/cal/cal.nvt/.env` :
   ```
   SSO_KEYCLOAK_ENABLED=true
   KEYCLOAK_ISSUER=https://<host>/realms/<realm>
   KEYCLOAK_CLIENT_ID=cal-nt
   KEYCLOAK_CLIENT_SECRET=<secret>
   ```
3. Relancer `bash deploy/nvt/deploy.sh`. Login via `https://cal.nvt.one/api/auth/signin/keycloak`.

## Workflows n8n

Côté cal = webhooks natifs signés (HMAC). Voir `docs/workflows-n8n/README.md`.
Configurer un webhook cal (Settings → Developer → Webhooks) vers l'URL n8n + même secret HMAC.

## Notes

- **Build lourd** (`MAX_OLD_SPACE_SIZE=6144`, ≈6 Go RAM). Vérifier la RAM du host sinon OOM.
- **Base de données** : conteneur `postgres` + volume `database-data` (persistant). Pour une
  base managée : pointer `DATABASE_HOST`/`POSTGRES_*` dans l'`.env` et retirer le service `database`.
- **`NEXT_PUBLIC_*` figées au build** : changer une URL publique = rebuild (le script le fait).
- **Sécurité** : secrets générés sur le serveur (jamais en local/git) ; seul le port 10310 est exposé.
- Kit **non commité**. Pour le versionner, ignorer d'abord `deploy/nvt/.env` et `deploy/nvt/.env.production`.
```
