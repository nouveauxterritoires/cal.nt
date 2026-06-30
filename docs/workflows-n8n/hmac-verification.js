/**
 * n8n "Code" node — verify a cal.com booking webhook signature.
 *
 * Original clean-room snippet (no /ee code). Drop it into a Code node placed
 * right after the Webhook node. The Webhook node MUST be configured with
 * "Raw Body" enabled so the exact received bytes are available for hashing —
 * any re-serialization would change the signature.
 *
 * cal computes: HMAC-SHA256(rawBody, secret) -> hex, sent as X-Cal-Signature-256.
 * The shared secret is read from the n8n env var CAL_WEBHOOK_SECRET and must be
 * identical to the secret configured on the cal webhook.
 */
const crypto = require("crypto");

const secret = process.env.CAL_WEBHOOK_SECRET;
if (!secret) {
  throw new Error("CAL_WEBHOOK_SECRET is not set on this n8n instance");
}

const item = items[0].json;
// With "Raw Body" on, the unparsed body is exposed here. Adjust the path to match
// your n8n version: `item.body` (string) or `item.rawBody` / `$binary` for some setups.
const rawBody = typeof item.body === "string" ? item.body : JSON.stringify(item.body);

const headers = item.headers || {};
const received = headers["x-cal-signature-256"] || headers["X-Cal-Signature-256"];
if (!received) {
  throw new Error("Missing X-Cal-Signature-256 header — rejecting unauthenticated payload");
}

const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

// Constant-time comparison to avoid timing attacks.
const a = Buffer.from(expected);
const b = Buffer.from(String(received));
const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

if (!valid) {
  throw new Error("Invalid webhook signature — rejecting payload");
}

// Signature OK — forward the parsed event to the rest of the workflow.
const parsed = typeof item.body === "string" ? JSON.parse(item.body) : item.body;
return [{ json: parsed }];
