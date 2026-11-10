# GameReview Backend

The Go API is in `gamehub/`. It calls IGDB and stores account, review, and wishlist data in Supabase PostgreSQL.

## Start the backend

1. Run `gamehub/schema.sql` in the Supabase SQL Editor.
2. From `Backend/gamehub`, set `DATABASE_URL`, `JWT_SECRET`, `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`, and `ALLOWED_ORIGINS`.
3. Run `go run .`. The API listens on port 8080 locally.

Run backend checks from `Backend/gamehub` with `go test ./...`. Render deployment settings are in `gamehub/render.yaml`.
