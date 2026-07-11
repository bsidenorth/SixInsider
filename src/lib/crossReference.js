import { supabase } from "./supabaseClient.js";
import { extractTopicTokens } from "./relevance.js";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const SIMILARITY_THRESHOLD = 0.35; // Jaccard overlap required to call two items "the same topic"

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Given a freshly-ingested item, checks the last 24h of news from OTHER
 * platforms for topic overlap. If a match is found, both the existing
 * row and the new item are flagged is_trending = true.
 *
 * Returns true if the new item should be inserted as trending.
 */
export async function checkCrossReference({ title, summary, sourcePlatform }) {
  const since = new Date(Date.now() - TWENTY_FOUR_HOURS_MS).toISOString();
  const newTokens = extractTopicTokens(`${title} ${summary ?? ""}`);

  const { data: recent, error } = await supabase
    .from("news")
    .select("id, title, summary, source_platform, is_trending")
    .neq("source_platform", sourcePlatform)
    .gte("published_at", since)
    .limit(200);

  if (error) {
    console.error("[crossReference] Failed to fetch recent news:", error.message);
    return false; // fail safe: don't block ingestion, just skip trending flag
  }

  let matchedExistingId = null;

  for (const candidate of recent ?? []) {
    const candidateTokens = extractTopicTokens(`${candidate.title} ${candidate.summary ?? ""}`);
    const similarity = jaccardSimilarity(newTokens, candidateTokens);
    if (similarity >= SIMILARITY_THRESHOLD) {
      matchedExistingId = candidate.id;
      break;
    }
  }

  if (matchedExistingId) {
    const { error: updateError } = await supabase
      .from("news")
      .update({ is_trending: true })
      .eq("id", matchedExistingId);

    if (updateError) {
      console.error("[crossReference] Failed to flag existing item as trending:", updateError.message);
    }
    return true;
  }

  return false;
}
