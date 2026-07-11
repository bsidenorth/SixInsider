import { Router } from "express";
import { supabase } from "../lib/supabaseClient.js";
import { isRelevant, classifyStatus } from "../lib/relevance.js";
import { checkCrossReference } from "../lib/crossReference.js";
import { slugify } from "../lib/slugify.js";
import { requireWebhookToken } from "../middleware/auth.js";

export const ingestRouter = Router();

/**
 * Normalizes one raw scraped item (shape varies slightly between the
 * Twitter Scraper and Reddit Scraper actors on Apify) into a common
 * shape the rest of the pipeline can rely on.
 */
function normalizeItem(raw, fallbackPlatform) {
  const text = raw.text ?? raw.fullText ?? raw.title ?? raw.selftext ?? "";
  const url = raw.url ?? raw.link ?? raw.permalink ?? null;
  const platform = raw.platform ?? fallbackPlatform ?? "unknown";
  const createdAt = raw.createdAt ?? raw.date ?? new Date().toISOString();

  return { text: String(text).trim(), url, platform, createdAt };
}

/**
 * Runs the full pipeline for a batch of raw items: filter -> classify ->
 * cross-reference -> insert. Errors on individual items are logged and
 * skipped so one bad item never kills the whole batch.
 */
async function ingestItems(rawItems, fallbackPlatform) {
  const results = { inserted: 0, skippedIrrelevant: 0, failed: 0 };

  for (const raw of rawItems) {
    try {
      const item = normalizeItem(raw, fallbackPlatform);

      if (!item.text || !item.url) {
        results.failed += 1;
        continue;
      }

      if (!isRelevant(item.text)) {
        results.skippedIrrelevant += 1;
        continue;
      }

      const status = classifyStatus({ text: item.text, sourcePlatform: item.platform });
      const title = item.text.slice(0, 180);
      const summary = item.text.slice(0, 280);

      const isTrending = await checkCrossReference({
        title,
        summary,
        sourcePlatform: item.platform,
      });

      const { error } = await supabase.from("news").insert({
        title,
        summary,
        content: item.text,
        status,
        source_url: item.url,
        source_platform: item.platform,
        is_trending: isTrending,
        slug: slugify(title),
        published_at: item.createdAt,
      });

      if (error) {
        console.error("[ingest] Insert failed:", error.message);
        results.failed += 1;
      } else {
        results.inserted += 1;
      }
    } catch (err) {
      console.error("[ingest] Unexpected error processing item:", err.message);
      results.failed += 1;
    }
  }

  return results;
}

/**
 * POST /api/ingest/apify
 * Target this endpoint from an Apify webhook (Actor > Integrations > Webhooks,
 * event: ACTOR.RUN.SUCCEEDED). Apify sends a run-finished notification; we
 * then pull the dataset items ourselves using the Apify API token.
 */
ingestRouter.post("/apify", requireWebhookToken, async (req, res) => {
  try {
    const datasetId =
      req.body?.resource?.defaultDatasetId ?? req.body?.eventData?.defaultDatasetId;

    if (!datasetId) {
      return res.status(400).json({ error: "Missing defaultDatasetId in Apify webhook payload." });
    }

    const apifyUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_TOKEN}`;
    const response = await fetch(apifyUrl);

    if (!response.ok) {
      throw new Error(`Apify dataset fetch failed with status ${response.status}`);
    }

    const items = await response.json();
    const fallbackPlatform = req.query.platform ?? "unknown";
    const results = await ingestItems(items, fallbackPlatform);

    res.status(200).json({ ok: true, ...results });
  } catch (err) {
    console.error("[ingest/apify] Fatal error:", err.message);
    res.status(500).json({ error: "Failed to process Apify webhook." });
  }
});

/**
 * POST /api/ingest/raw
 * Accepts a raw JSON array of scraped items directly in the body, useful
 * for local testing or for scrapers that push data straight to us
 * instead of going through an Apify webhook.
 * Body: { platform: "twitter" | "reddit", items: [...] }
 */
ingestRouter.post("/raw", requireWebhookToken, async (req, res) => {
  try {
    const { platform, items } = req.body ?? {};

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Body must include an `items` array." });
    }

    const results = await ingestItems(items, platform ?? "unknown");
    res.status(200).json({ ok: true, ...results });
  } catch (err) {
    console.error("[ingest/raw] Fatal error:", err.message);
    res.status(500).json({ error: "Failed to process ingestion payload." });
  }
});
