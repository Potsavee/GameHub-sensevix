# GameReview Go API

This Go service calls IGDB, persists the game catalog, reviews, and wishlists in PostgreSQL, and owns authentication and role checks.

## Run locally

1. Create a Supabase project and run `schema.sql` in its SQL Editor. For local PostgreSQL, run `docker compose up -d db` from `Backend`.
2. Use `.env.example` as a variable checklist. Go does not load `.env` automatically; export `DATABASE_URL`, a private `JWT_SECRET` (at least 32 characters), `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`, and `ALLOWED_ORIGINS` into the process environment. In a Codespace Bash terminal, load a completed `.env` with `set -a; source .env; set +a`.
3. From this directory run `go run .`; the API listens on port 8080 or the host-provided `PORT`.

To create the first administrator, register normally, then promote that account once in Supabase:

```sql
UPDATE members SET role='admin' WHERE lower(email)=lower('admin@example.com');
```

Only Go calls Twitch OAuth and IGDB. Keep `IGDB_CLIENT_SECRET` out of React and all `REACT_APP_*` variables.

## Deploy

Use the Render blueprint at `Backend/gamehub/render.yaml`. Set `DATABASE_URL` to Supabase PostgreSQL and `ALLOWED_ORIGINS` to the Vercel origin. Deploy the sibling `frontend` project on Vercel with `REACT_APP_API_URL` set to the Render origin.
