#!/usr/bin/env bash
# ============================================================================
# Déploiement cal.nvt.one (TEST) — exécuté depuis ta machine, à la racine du repo.
#
#   bash deploy/nvt/deploy.sh
#
# Stack prod auto-suffisante (deploy/nvt/docker-compose.prod.yml) :
#   caddy (façade TLS, hôte :10310) -> calcom (web) + calcom-api (slots) ; database + redis internes.
#   Evolix transmet cal.nvt.one en HTTPS pass-through vers docker02:10310 ; Caddy termine le TLS
#   (certificat Let's Encrypt auto via TLS-ALPN-01) et route /api/v2 -> api, le reste -> web.
#
# Étapes :
#   1. rsync de l'arbre courant (integration/local-test) vers le serveur (sans node_modules/.next/.git/.env).
#   2. .env distant créé au 1er run (secrets aléatoires), conservé ensuite.
#   3. docker compose build (web + api v2) puis up -d. Migrations Prisma + seed app-store auto (start.sh).
#
# Mise à jour : relancer ce script. rsync est incrémental, l'.env et ses secrets sont préservés.
# ============================================================================
set -euo pipefail

# ----------------------------- CONFIG (à vérifier) --------------------------
SSH_USER="cal"
SSH_HOST="nouveauxterritoires-docker02.evolix.net"
SSH_PORT="2222"
REMOTE_DIR="/home/cal/cal.nvt"          # dossier de déploiement sur le serveur
DOMAIN="cal.nvt.one"
HOST_PORT="10226"                        # port hôte recevant le trafic d'Evolix (pont HAProxy)
EXPECTED_BRANCH="integration/local-test"
COMPOSE="docker compose -f docker-compose.prod.yml"
# ---------------------------------------------------------------------------

SSH="ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${REPO_ROOT}"

say() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

# --- 0. Garde-fous ----------------------------------------------------------
command -v rsync >/dev/null || die "rsync introuvable en local."
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
if [ "${BRANCH}" != "${EXPECTED_BRANCH}" ]; then
  printf '\033[1;33m⚠ Branche courante = %s (attendue: %s). Continuer ? [y/N] \033[0m' "${BRANCH}" "${EXPECTED_BRANCH}"
  read -r ans; [ "${ans:-N}" = "y" ] || die "Annulé."
fi
say "Test de la connexion SSH + Docker"
${SSH} "echo ok && docker --version && docker compose version" || die "SSH ou Docker indisponible sur le serveur."

# --- 1. Synchronisation du code --------------------------------------------
say "rsync du code vers ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}"
${SSH} "mkdir -p ${REMOTE_DIR}"
rsync -az --delete \
  -e "ssh -p ${SSH_PORT}" \
  --exclude '.git' \
  --exclude '.omc' \
  --exclude 'node_modules' \
  --exclude '**/node_modules' \
  --exclude '.next' \
  --exclude '**/.next' \
  --exclude '.turbo' \
  --exclude '**/.turbo' \
  --exclude 'dist' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'apps/api/v2/.env' \
  --exclude 'docker-compose.prod.yml' \
  --exclude 'Caddyfile' \
  ./ "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"

# Fichiers de prod à la racine distante (le compose et le Caddyfile attendent des chemins relatifs).
scp -P "${SSH_PORT}" deploy/nvt/docker-compose.prod.yml   "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/docker-compose.prod.yml"
scp -P "${SSH_PORT}" deploy/nvt/Caddyfile                 "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/Caddyfile"
scp -P "${SSH_PORT}" deploy/nvt/.env.production.example   "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/.env.production.example"

# --- 2. .env distant : créé une seule fois, secrets générés et conservés -----
say "Préparation de l'.env distant (secrets générés au 1er run uniquement)"
${SSH} "bash -s" <<REMOTE
set -euo pipefail
cd "${REMOTE_DIR}"
if [ ! -f .env ]; then
  echo "  → 1er déploiement : génération de l'.env + secrets"
  cp .env.production.example .env
  NS="\$(openssl rand -base64 32 | tr -d '\n')"
  ENC="\$(openssl rand -base64 24 | tr -d '\n')"   # 32 chars pour AES256
  JWT="\$(openssl rand -base64 32 | tr -d '\n')"
  PG="\$(openssl rand -hex 16 | tr -d '\n')"       # hex : sûr dans une URL
  sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\${NS}|"                     .env
  sed -i "s|^CALENDSO_ENCRYPTION_KEY=.*|CALENDSO_ENCRYPTION_KEY=\${ENC}|"    .env
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=\${JWT}|"                             .env
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=\${PG}|"                .env
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://calcom:\${PG}@database:5432/calendso|" .env
  echo "  → .env créé. (Édite-le pour Keycloak/email puis relance le script.)"
else
  echo "  → .env distant existant conservé (aucun secret écrasé)."
fi
REMOTE

# --- 3. Build + démarrage ---------------------------------------------------
# Build SÉQUENTIEL (un service à la fois) : deux builds en parallèle saturaient la RAM (OOM/reboot).
# Cache inline BuildKit (voir cache_from dans le compose) → réutilise les couches inchangées au build suivant.
say "Build image web (calcom) — séquentiel + cache buildx"
${SSH} "cd ${REMOTE_DIR} && ${COMPOSE} build calcom"

say "Build image api v2 (calcom-api) — séquentiel + cache buildx"
${SSH} "cd ${REMOTE_DIR} && ${COMPOSE} build calcom-api"

say "Démarrage base + redis"
${SSH} "cd ${REMOTE_DIR} && ${COMPOSE} up -d database redis"

say "Démarrage web + api v2 (migrations Prisma auto via start.sh) + façade Caddy"
${SSH} "cd ${REMOTE_DIR} && ${COMPOSE} up -d calcom calcom-api caddy"

# --- 4. État ---------------------------------------------------------------
say "État des conteneurs"
${SSH} "cd ${REMOTE_DIR} && ${COMPOSE} ps"
say "Logs récents (web + caddy)"
${SSH} "cd ${REMOTE_DIR} && ${COMPOSE} logs --tail=20 calcom caddy" || true

cat <<NOTE

✔ Déploiement terminé.

Vérifs / actions (une fois) :
  • Evolix : cal.nvt.one (HTTPS pass-through) -> docker02:${HOST_PORT}  ✓ (déjà en place d'après toi)
  • 1er certificat : Caddy l'obtient au 1er accès HTTPS à https://${DOMAIN}
    (TLS-ALPN-01 via le 443 transmis). Suivre : ${COMPOSE} logs -f caddy
  • 1er compte admin : https://${DOMAIN}/signup  (pas de seed pro/free en prod)
  • SSO Keycloak : éditer ${REMOTE_DIR}/.env (KEYCLOAK_*, SSO_KEYCLOAK_ENABLED=true) puis relancer ce script.
    Redirect URI Keycloak = https://${DOMAIN}/api/auth/callback/keycloak
  • Logs : ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} 'cd ${REMOTE_DIR} && ${COMPOSE} logs -f calcom calcom-api caddy'
  • Mise à jour future : relancer  bash deploy/nvt/deploy.sh
NOTE
