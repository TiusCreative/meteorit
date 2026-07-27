-- Migration: Ensure articles table exists and has proper columns and indices
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  r2_path TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  tags TEXT,
  image TEXT,
  excerpt TEXT,
  date TEXT,
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Published',
  review_status TEXT DEFAULT 'Otomatis',
  ai_provider TEXT
);

CREATE INDEX IF NOT EXISTS idx_articles_category_created ON articles(category, createdAt DESC);
