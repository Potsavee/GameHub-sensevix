-- Run once against Supabase PostgreSQL for the IGDB backed game catalog.
CREATE TABLE IF NOT EXISTS games (
  id BIGINT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  cover_url VARCHAR(500),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS game_reviews (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(btrim(text)) >= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, game_id)
);
CREATE INDEX IF NOT EXISTS idx_game_reviews_game ON game_reviews(game_id, created_at DESC);
CREATE TABLE IF NOT EXISTS game_wishlist (
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(member_id, game_id)
);
