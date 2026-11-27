-- Full-text search over title (A), AI summary (B) and metadata tags (C).
CREATE INDEX "missions_search_idx" ON "missions" USING GIN (
  (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("ai_summary", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("metadata"->>'tags', '')), 'C')
  )
);
