# SenTravail — « Montre ce que tu sais faire »

Plateforme d'emploi PWA pour le Sénégal (sentravail.com) : fil vidéo des savoir-faire, garants, contact direct sur WhatsApp.

## Démarrage

```bash
cp .env.example .env      # puis renseigner DB_* (MySQL) et SESSION_SECRET
npm install
npm run seed              # comptes de démo (mot de passe : demo1234)
npm run dev               # http://localhost:3000
```

- `npm run dev` : nodemon + watch Tailwind
- `npm run build` : compile le CSS (Tailwind)
- `npm start` : production
- `npm run seed` : données de démonstration (refusé en production sans `--force`)
- `npm test` : tests (inscription, connexion, CSRF, profil, modèle). Ils tournent sur SQLite en mémoire ; avec `TEST_DB_NAME=…` (et `TEST_DB_HOST/USER/PASSWORD`), sur une vraie base MySQL.

Les tables MySQL sont créées automatiquement au démarrage (migrations dans `src/db/migrations.js`).

## Déploiement

Hostinger (plan Business, Web App Node.js) + base MySQL Hostinger : voir [DEPLOIEMENT.md](DEPLOIEMENT.md).

## Avancement

- [x] Phase 1 — Socle : Express + EJS + Tailwind, MySQL, inscription/connexion (téléphone + mot de passe), profil modifiable, pages légales
- [ ] Phase 2 — Fil : Cloudinary, Posts, fil vertical, likes
- [ ] Phase 3 — Confiance : garants, signalements, modération
- [ ] Phase 4 — Proximité : géolocalisation, carte, « Disponible aujourd'hui »
- [ ] Phase 5 — PWA & SEO
- [ ] Phase 6 — Monétisation
