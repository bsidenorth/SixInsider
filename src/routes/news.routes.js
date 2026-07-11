import { Router } from "express";
import { supabase } from "../lib/supabaseClient.js";

export const newsRouter = Router();

/**
 * GET /api/news
 * Public feed endpoint, ordered by most recent first.
 *
 * Query params (all optional):
 *   page     - 1-indexed page number (default 1)
 *   limit    - items per page, max 50 (default 20)
 *   status   - "rumor" | "confirmed" | "leak"
 *   trending - "true" to only return cross-referenced trending items
 */
newsRouter.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("news")
      .select("id, title, summary, status, source_url, source_platform, is_trending, slug, published_at", {
        count: "exact",
      })
      .order("published_at", { ascending: false })
      .range(from, to);

    if (req.query.status) {
      query = query.eq("status", req.query.status);
    }
    if (req.query.trending === "true") {
      query = query.eq("is_trending", true);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[news] Query failed:", error.message);
      return res.status(500).json({ error: "Failed to load news." });
    }

    res.status(200).json({
      items: data,
      page,
      limit,
      total: count,
      hasMore: from + data.length < (count ?? 0),
    });
  } catch (err) {
    console.error("[news] Unexpected error:", err.message);
    res.status(500).json({ error: "Failed to load news." });
  }
});

/**
 * GET /api/news/:slug
 * Single news item, used for the SEO-friendly individual article pages.
 */
newsRouter.get("/:slug", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .eq("slug", req.params.slug)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "News item not found." });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("[news/:slug] Unexpected error:", err.message);
    res.status(500).json({ error: "Failed to load news item." });
  }
});
