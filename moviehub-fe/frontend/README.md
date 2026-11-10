# GameReview Frontend

React frontend for the GameReview project. Game data is requested with Fetch API from the Go backend; IGDB credentials remain on the backend.

## Run locally

1. Start the Go API from `moviehub-be/Backend/gamehub` after configuring its environment variables and applying `schema.sql`.
2. Run `npm install` and `npm start` in this directory. The development proxy sends `/api` calls to `http://localhost:8080`.
3. Optional: copy `.env.example` to `.env` and set `REACT_APP_API_URL` if the API is hosted on a different origin.

Run the frontend unit tests with `npm test -- --watchAll=false`.

## Deploy frontend to Vercel

Connect the frontend repository to Vercel, set the project root to this `frontend` directory, and add `REACT_APP_API_URL` with the Render API origin. Pushes to the connected GitHub/GitLab repository then trigger builds. The included `vercel.json` supports React Router refreshes.

Never add IGDB client secrets to this frontend or to `REACT_APP_*` variables. Set them only on the Go backend host.
