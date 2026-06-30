# Chantier 2 (Workflows n8n) — Note de licence

**Aucun fichier `/ee` lu, copié ou paraphrasé.** Aucun code du moteur de workflow commercial (`packages/features/ee/workflows/**`) n'est réimplémenté. La logique est **déléguée à n8n** (externe) et branchée sur les **webhooks de booking natifs** du cœur AGPL.

| Artefact | Type | Provenance / Licence |
|---|---|---|
| `docs/workflows-n8n/README.md` | doc | Originale. |
| `docs/workflows-n8n/hmac-verification.js` | snippet n8n | **Original clean-room** (HMAC-SHA256 standard). Compatible MIT. |
| `docs/workflows-n8n/workflows/*.json` | exports n8n | Originaux (artefacts externes). |

## Sécurité
- Vérification **HMAC-SHA256** obligatoire en tête de chaque workflow, comparaison en temps constant, secret partagé `CAL_WEBHOOK_SECRET`. Algorithme conforme au cœur cal (`X-Cal-Signature-256 = HMAC-SHA256(body, secret)`).
- Le *Webhook node* doit être en **Raw Body** pour que la signature corresponde.

## Périmètre
- **Aucune modification du code cal ni du schéma Prisma** → zéro taxe de merge upstream.
- Mapping `event-type → workflow` géré **hors schéma cal** (filtre n8n ou data table n8n).
- Idempotence par `payload.uid + action` (statique n8n ; remplaçable par data table/Redis pour du durable multi-instance).
