# SixInsider — Ingestion Backend

Node.js/Express service that ingests scraped GTA 6 news (via Apify's
Twitter/Reddit scrapers), filters it for relevance, cross-references
sources, writes to Supabase, and serves the public `/api/news` feed.

## Setup

```bash
npm install
cp .env.example .env   # then fill in your real values
npm run dev             # http://localhost:8787
```

Required env vars (see `.env.example`):
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Project Settings > API. Use the **service_role** key here, never the anon key, and never expose it to the frontend.
- `APIFY_TOKEN` — from Apify Console > Settings > Integrations.
- `INGEST_WEBHOOK_SECRET` — any long random string you invent. Both Apify (via a custom header, or a `?token=` query param translated in your reverse proxy) and any manual test calls must send this in the `x-webhook-token` header.

## Endpoints

| Method | Path                | Purpose                                                        | Auth              |
|--------|---------------------|------------------------------------------------------------------|-------------------|
| GET    | `/health`            | Liveness check                                                   | none              |
| POST   | `/api/ingest/apify`  | Target of an Apify webhook (`ACTOR.RUN.SUCCEEDED`)                | `x-webhook-token`  |
| POST   | `/api/ingest/raw`    | Manual/direct ingestion: `{ platform, items: [...] }`             | `x-webhook-token`  |
| GET    | `/api/news`          | Public feed. Query: `page`, `limit`, `status`, `trending`         | none (public read) |
| GET    | `/api/news/:slug`    | Single news item, for SEO article pages                          | none (public read) |

## Wiring up Apify

1. Create an Apify task using the **Twitter Scraper** or **Reddit Scraper** actor, searching for `GTA 6`, `Rockstar Games`, `GTA VI`.
2. Set it to run on a schedule (every 12–24h is enough for an MVP — keeps Apify's free credits and your Supabase egress low).
3. In the task's **Integrations > Webhooks**, add a webhook for event `ACTOR.RUN.SUCCEEDED`, pointing at:
   `https://your-backend-url.com/api/ingest/apify?platform=twitter`
   (swap `platform=reddit` for the Reddit task)
4. Add the header `x-webhook-token: <your INGEST_WEBHOOK_SECRET>` in the webhook's custom headers config.

## Testing locally without Apify

```bash
curl -X POST http://localhost:8787/api/ingest/raw \
  -H "Content-Type: application/json" \
  -H "x-webhook-token: your_secret_here" \
  -d '{
    "platform": "twitter",
    "items": [
      { "text": "Leaked GTA 6 map datamine shows a third city district", "url": "https://twitter.com/example/1", "createdAt": "2026-07-10T12:00:00Z" }
    ]
  }'
```

## Deploying (free options)

Any Node host works — Render, Railway, or Fly.io all have free/cheap
tiers suitable for an MVP. Set the same environment variables from
`.env.example` in the host's dashboard, point Apify's webhook at the
deployed URL, and you're live.

## Notes on the relevance & cross-reference logic

- `src/lib/relevance.js` — keyword filter + a simple heuristic status
  classifier (official source = confirmed, leak/datamine language =
  leak, everything else = rumor). This is intentionally simple; swap in
  a real classifier or an LLM call later without touching the routes.
- `src/lib/crossReference.js` — compares a new item's keywords against
  the last 24h of news from *other* platforms using Jaccard similarity.
  A match flags both items `is_trending = true`.
