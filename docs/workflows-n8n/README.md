# Workflows via n8n — Chantier 2

Délégation de toute la logique de workflow (rappels, follow-ups, no-show) à **n8n**, branché sur les **webhooks de booking natifs** de cal (cœur AGPL). On ne réimplémente **aucun** moteur de workflow `/ee`.

## 1. Webhooks natifs

cal envoie un POST HTTP à l'URL souscrite pour chaque évènement. Triggers disponibles (enum `WebhookTriggerEvents`) :

`BOOKING_CREATED`, `BOOKING_REQUESTED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`, `BOOKING_REJECTED`, `BOOKING_PAYMENT_INITIATED`, `BOOKING_PAID`, `BOOKING_NO_SHOW_UPDATED`, `MEETING_STARTED`, `MEETING_ENDED`, `RECORDING_READY`, `RECORDING_TRANSCRIPTION_GENERATED`, `FORM_SUBMITTED`, `FORM_SUBMITTED_NO_EVENT`, `OOO_CREATED`, `AFTER_HOSTS_CAL_VIDEO_NO_SHOW`, `AFTER_GUESTS_CAL_VIDEO_NO_SHOW`.

### Enveloppe du payload

```json
{
  "triggerEvent": "BOOKING_CREATED",
  "createdAt": "2026-06-30T10:00:00.000Z",
  "payload": {
    "uid": "abc123",
    "title": "30 min meeting",
    "type": "30min",
    "startTime": "2026-07-01T09:00:00Z",
    "endTime": "2026-07-01T09:30:00Z",
    "organizer": { "name": "...", "email": "...", "timeZone": "...", "language": { "locale": "en" } },
    "attendees": [{ "name": "...", "email": "...", "timeZone": "..." }],
    "eventTypeId": 42,
    "location": "...",
    "metadata": {}
  }
}
```

Le contenu de `payload` varie selon le trigger (champs `bookingId`, `status`, `cancellationReason`, etc.). En-têtes envoyés par cal :

| Header | Valeur |
|---|---|
| `X-Cal-Signature-256` | HMAC-SHA256 du **corps brut** avec le secret du webhook (hex). |
| `X-Cal-Webhook-Version` | version du payload. |
| `Content-Type` | `application/json`. |

### Configurer le webhook côté cal

Settings → Developer → Webhooks (ou par event-type) :
- **Subscriber URL** : l'URL de production du *Webhook node* n8n.
- **Secret** : une chaîne aléatoire forte (`openssl rand -hex 32`) — la **même** que `CAL_WEBHOOK_SECRET` côté n8n.
- **Event triggers** : cocher ceux nécessaires (au minimum `BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`, `MEETING_ENDED`).

## 2. Vérification HMAC (obligatoire)

Le *Webhook node* n8n doit être en **Raw Body** (sinon la signature ne correspond pas — il faut le corps **exact** reçu). Le node *Code* `Verify HMAC` recalcule `HMAC-SHA256(rawBody, secret)` et compare en **temps constant** à `X-Cal-Signature-256`. Voir [`hmac-verification.js`](./hmac-verification.js).

Le secret partagé est lu depuis la variable d'environnement n8n **`CAL_WEBHOOK_SECRET`**.

## 3. Workflows fournis (imports n8n)

Importer via *n8n → Workflows → Import from File* :

| Fichier | Scénario |
|---|---|
| [`workflows/cal-reminder.json`](./workflows/cal-reminder.json) | **Rappel H-X** : `BOOKING_CREATED` → vérif HMAC → *Wait* jusqu'à (startTime − X h) → email. |
| [`workflows/cal-followup.json`](./workflows/cal-followup.json) | **Follow-up** : `MEETING_ENDED` → vérif HMAC → email de suivi. |
| [`workflows/cal-no-show.json`](./workflows/cal-no-show.json) | **No-show** : `BOOKING_NO_SHOW_UPDATED` → vérif HMAC → branche conditionnelle (no-show) → email de relance. |

Chaque workflow contient le node HMAC en tête. Les nodes d'envoi (SMTP/Brevo/HTTP) sont à **paramétrer avec tes credentials** n8n (placeholders inclus).

## 4. Mapping `event-type → workflow`

Stocké **hors schéma cal** pour ne pas élargir les migrations. Deux options :
- **Filtre dans n8n** (recommandé) : un node *Filter* compare `payload.eventTypeId` à une liste — voir le bloc « Event-type filter » désactivé dans chaque workflow.
- **Table dédiée** dans la base n8n / un *Data table* n8n, requêtée en début de workflow.

## 5. Idempotence

Les webhooks peuvent être re-livrés. Clé d'idempotence = **`payload.uid` + type d'action** (ex. `abc123:reminder`). Chaque workflow écrit cette clé via un node *Code* `Dedupe` (statique workflow data n8n) et **abandonne** si la clé existe déjà. Voir le node `Dedupe` dans chaque export. Pour une dédup durable multi-instance, remplacer par un *Data table* n8n ou Redis (documenté en commentaire du node).
