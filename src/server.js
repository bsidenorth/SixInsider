import "dotenv/config";
import express from "express";
import cors from "cors";
import { ingestRouter } from "./routes/ingest.routes.js";
import { newsRouter } from "./routes/news.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.status(200).json({ ok: true, service: "sixinsider-ingestion" }));

app.use("/api/ingest", ingestRouter);
app.use("/api/news", newsRouter);

// Catch-all error handler — keeps the process alive on unexpected errors
// instead of crashing the whole service.
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`SixInsider ingestion backend listening on port ${PORT}`);
});
