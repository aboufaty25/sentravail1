# SenTravail — instructions for Claude Code

PWA job platform for Senegal (sentravail.com). Tagline: « Montre ce que tu sais faire ».

## Rules
- UI language: French (plan i18n for Wolof later). Code and comments: English.
- Work phase by phase (see README "Avancement"). Never start a phase before the previous one works.
- After each feature: run the app, test (`npm test`), then commit with a clear message.
- Mobile first: must be great on a low-end Android phone on 3G. Light pages, compressed images, lazy-loading, no heavy front-end framework.
- Never commit secrets: everything goes through `.env` (keep `.env.example` up to date).

## Stack
Node 20+/Express 5, server-rendered EJS + vanilla JS, Tailwind CLI (v3), MongoDB/Mongoose (`2dsphere`),
Cloudinary (media), phone + password auth (bcryptjs) with express-session + connect-mongo,
helmet, express-rate-limit, zod, CSRF (csrf-sync), Leaflet/OSM.

## Deployment
Hostinger Business plan, Node.js Web App deployed from GitHub (`main`), MongoDB Atlas. See DEPLOIEMENT.md.
- No native npm modules (shared hosting builds).
- No SSH npm commands on Hostinger: one-off scripts run locally against Atlas.
- `public/css/app.css` is committed; run `npm run build:css` after changing styles or views.
- Media uploads must go directly from the browser to Cloudinary (signed uploads), never through the server.

## Testing
`npm test` runs HTTP tests with an in-memory User store; set `TEST_MONGODB_URI` to run them against a real database.
