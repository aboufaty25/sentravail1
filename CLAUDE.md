# SenTravail — instructions for Claude Code

PWA job platform for Senegal (sentravail.com). Tagline: « Montre ce que tu sais faire ».

## Rules
- UI language: French (plan i18n for Wolof later). Code and comments: English.
- Work phase by phase (see README "Avancement"). Never start a phase before the previous one works.
- After each feature: run the app, test (`npm test`), then commit with a clear message.
- Mobile first: must be great on a low-end Android phone on 3G. Light pages, compressed images, lazy-loading, no heavy front-end framework.
- Never commit secrets: everything goes through `.env` (keep `.env.example` up to date).

## Stack
Node 20+/Express 5, server-rendered EJS + vanilla JS, Tailwind CLI (v3), MySQL (Hostinger) via mysql2 with raw SQL
behind `src/db` (no ORM; migrations in `src/db/migrations.js`, run at startup; geo = latitude/longitude columns),
Cloudinary (media), phone + password auth (bcryptjs) with express-session + express-mysql-session,
helmet, express-rate-limit, zod, CSRF (csrf-sync), Leaflet/OSM.

## Deployment
Hostinger Business plan, Node.js Web App deployed from GitHub (`main`), Hostinger MySQL (DB_HOST=127.0.0.1). See DEPLOIEMENT.md.
- No native npm modules (shared hosting builds).
- No SSH npm commands on Hostinger: schema changes go through migrations; one-off scripts run locally via remote MySQL.
- Every migration must provide both `mysql` and `sqlite` statements (tests run on SQLite).
- `public/css/app.css` is committed; run `npm run build:css` after changing styles or views.
- Media uploads must go directly from the browser to Cloudinary (signed uploads), never through the server.

## Testing
`npm test` runs the tests on an in-memory SQLite database (node:sqlite) through the same `src/db` interface;
set `TEST_DB_NAME` (+ `TEST_DB_HOST/PORT/USER/PASSWORD`) to run them against a real MySQL database.
