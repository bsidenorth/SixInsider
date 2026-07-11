// Keywords a scraped item must mention (case-insensitive) to be considered
// relevant to the product. Kept as a plain array so it's easy to tune
// without touching logic.
const RELEVANCE_KEYWORDS = [
  "gta 6",
  "gta6",
  "gta vi",
  "rockstar games",
  "rockstar",
  "trailer",
  "leak",
  "vazamento",
];

// Words that push the classifier toward "leak" when present alongside a
// relevant keyword.
const LEAK_SIGNALS = ["leak", "leaked", "datamine", "datamined", "vazamento", "vazou"];

/**
 * Returns true if the raw scraped text is relevant enough to ingest.
 */
export function isRelevant(text = "") {
  const lower = text.toLowerCase();
  return RELEVANCE_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Very lightweight heuristic classifier. Official-source posts are
 * treated as confirmed; anything with leak/datamine language is a leak;
 * everything else defaults to rumor. This is intentionally simple — swap
 * in a proper classifier or LLM call here later without touching callers.
 */
export function classifyStatus({ text = "", sourcePlatform = "" }) {
  if (sourcePlatform === "official") return "confirmed";

  const lower = text.toLowerCase();
  if (LEAK_SIGNALS.some((sig) => lower.includes(sig))) return "leak";

  return "rumor";
}

/**
 * Extracts a small set of significant keywords from a text, used for
 * lightweight topic comparison in the cross-reference step. Filters out
 * very short/common words.
 */
const STOPWORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "have", "will",
  "about", "into", "just", "your", "their", "what", "when", "where",
  "para", "com", "que", "uma", "dos", "das", "sobre",
]);

export function extractTopicTokens(text = "") {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4 && !STOPWORDS.has(w))
  );
}
