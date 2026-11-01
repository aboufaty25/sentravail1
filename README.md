# SenTravail — « Montre ce que tu sais faire »

Plateforme d'emploi PWA pour le Sénégal (sentravail.com) : fil vidéo des savoir-faire, garants, contact direct sur WhatsApp.

## Démarrage

```bash
cp .env.example .env      # puis renseigner MONGODB_URI et SESSION_SECRET
npm install
npm run seed              # comptes de démo (mot de passe : demo1234)
npm run dev               # http://localhost:3000
```

- `npm run dev` : nodemon + watch Tailwind
- `npm start` : production (compile le CSS puis lance le serveur)
- `npm run seed` : données de démonstration (refusé en production sans `--force`)
- `npm test` : tests HTTP (inscription, connexion, CSRF, profil). Sans base, un magasin mémoire remplace MongoDB ; avec `TEST_MONGODB_URI=mongodb://…` les mêmes tests tournent sur une vraie base.

## Avancement

- [x] Phase 1 — Socle : Express + EJS + Tailwind, MongoDB, inscription/connexion (téléphone + mot de passe), profil modifiable, pages légales
- [ ] Phase 2 — Fil : Cloudinary, Posts, fil vertical, likes
- [ ] Phase 3 — Confiance : garants, signalements, modération
- [ ] Phase 4 — Proximité : géolocalisation, carte, « Disponible aujourd'hui »
- [ ] Phase 5 — PWA & SEO
- [ ] Phase 6 — Monétisation
