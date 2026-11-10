-- GameReview schema for Supabase PostgreSQL. Run once on a new project.
BEGIN;

CREATE TABLE IF NOT EXISTS members (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50) NOT NULL CHECK (char_length(btrim(display_name)) >= 1),
    avatar_url VARCHAR(500),
    role VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_members_email ON members (lower(email));

-- IGDB IDs are the stable external keys. Go fetches metadata and upserts it here
-- before reviews and wishlists refer to the game.
CREATE TABLE IF NOT EXISTS games (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_th VARCHAR(255) NOT NULL DEFAULT '',
    original_title VARCHAR(255) NOT NULL DEFAULT '',
    original_language VARCHAR(2) NOT NULL DEFAULT 'en',
    genre VARCHAR(100) NOT NULL DEFAULT '',
    release_date DATE,
    summary TEXT NOT NULL DEFAULT '',
    summary_th TEXT NOT NULL DEFAULT '',
    summary_en TEXT NOT NULL DEFAULT '',
    cover_url VARCHAR(500),
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_reviews (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    text TEXT NOT NULL CHECK (char_length(btrim(text)) >= 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (member_id, game_id)
);
CREATE INDEX IF NOT EXISTS idx_game_reviews_game ON game_reviews (game_id, created_at DESC);

CREATE TABLE IF NOT EXISTS game_wishlist (
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    game_id BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, game_id)
);
CREATE INDEX IF NOT EXISTS idx_game_wishlist_member ON game_wishlist (member_id, added_at DESC);

COMMIT;
