/**
 * Rejects any ingestion request that doesn't carry the shared secret in
 * the `x-webhook-token` header. This guards /api/ingest/* from forged
 * requests, since Apify webhooks don't sign payloads by default.
 */
export function requireWebhookToken(req, res, next) {
  const token = req.header("x-webhook-token");
  const expected = process.env.INGEST_WEBHOOK_SECRET;

  if (!expected) {
    console.error("[auth] INGEST_WEBHOOK_SECRET is not set — refusing all ingestion requests.");
    return res.status(500).json({ error: "Server misconfigured: missing webhook secret." });
  }

  if (!token || token !== expected) {
    return res.status(401).json({ error: "Invalid or missing x-webhook-token." });
  }

  next();
}
