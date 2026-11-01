# Déploiement sur Hostinger (hébergement mutualisé)

SenTravail est une application **Node.js / Express** avec une base **MySQL Hostinger**. Elle tourne dans la section **Web App (Node.js)**, disponible uniquement sur les plans **Business** et **Cloud** (pas sur Single ni Premium).

Les tables sont créées **automatiquement** au démarrage de l'application. Il n'y a rien à faire dans phpMyAdmin.

---

## 1. Créer la base MySQL

1. hPanel → **Sites web** → **Gérer** → **Bases de données** → **Gestion**.
2. Renseigner le nom de la base, le nom d'utilisateur et un mot de passe fort → **Créer**.
3. Noter les valeurs **complètes, avec le préfixe** (ex. `u123456789_sentravail`) :
   - nom de la base
   - utilisateur
   - mot de passe

## 2. Créer l'application

1. hPanel → **Sites web** → **Créer un site** → **Web App**.
2. **Importer un dépôt Git** → autoriser GitHub → choisir `aboufaty25/sentravail1`, branche `main`.
3. Paramètres de build :

   | Réglage | Valeur |
   |---|---|
   | Framework | **Express.js** (ou *Other*) |
   | Version Node.js | **22.x** |
   | Commande d'installation | `npm install` |
   | Commande de build | `npm run build` |
   | Fichier d'entrée | `src/server.js` |
   | Commande de démarrage | `npm start` (si demandée) |

4. **Variables d'environnement**, à saisir dans Hostinger et **jamais** dans le code :

   | Variable | Valeur |
   |---|---|
   | `NODE_ENV` | `production` |
   | `BASE_URL` | `https://sentravail.com` (l'adresse du **site**) |
   | `DB_HOST` | `127.0.0.1` (surtout **pas** `localhost`) |
   | `DB_PORT` | `3306` |
   | `DB_USER` | l'utilisateur MySQL, ex. `u123456789_sentravail` |
   | `DB_PASSWORD` | le mot de passe MySQL |
   | `DB_NAME` | le nom de la base, ex. `u123456789_sentravail` |
   | `SESSION_SECRET` | une longue chaîne aléatoire (voir ci-dessous) |
   | `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | phase 2, peuvent rester vides |
   | `ADSENSE_CLIENT_ID` | phase 6, peut rester vide |

   Ne **pas** définir `PORT` : Hostinger le fournit.

   Pour générer `SESSION_SECRET`, sur n'importe quel ordinateur :
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Déployer**. Ensuite, chaque `git push` sur `main` redéploie automatiquement. Après une modification des variables, cliquer sur **Restart**.

## 3. Domaine et HTTPS

- Connecter `sentravail.com` à l'application et activer le **SSL** (gratuit).
- Le cookie de session est marqué `Secure` en production : le site **doit** être servi en `https://`, sinon la connexion ne fonctionne pas.

## 4. Vérifier

- `https://sentravail.com/healthz` doit répondre `{"status":"ok"}`.
- Dans phpMyAdmin, les tables `users`, `user_trades`, `sessions` et `schema_migrations` doivent apparaître.
- S'inscrire, modifier le profil, se déconnecter, se reconnecter.

| Symptôme dans les logs | Cause probable |
|---|---|
| `DB_… must be set in production` | variable manquante |
| `Access denied for user …@'::1'` | `DB_HOST` vaut `localhost` : mettre `127.0.0.1` |
| `Access denied for user …` | utilisateur ou mot de passe erroné (noms avec préfixe `u…_`) |
| `ECONNREFUSED` | mauvais `DB_HOST` / `DB_PORT` |
| Connexion qui « ne tient pas » | site ouvert en `http://` au lieu de `https://` |
| Page sans style | `npm run build` absent des paramètres de build |

## 5. Données de démonstration (optionnel)

Hostinger ne permet pas de lancer des commandes npm à la main. Pour remplir la base depuis ton ordinateur :

1. hPanel → **Bases de données** → **MySQL distant** : ajouter **ton adresse IP** pour cette base, et noter le nom d'hôte distant (ex. `srv123.hstgr.io`).
2. Sur ton ordinateur, dans le dossier du projet :
   ```bash
   DB_HOST=srv123.hstgr.io DB_USER=u123_sentravail DB_PASSWORD='…' DB_NAME=u123_sentravail npm run seed
   ```
3. Retirer ensuite ton IP de l'accès distant.

Le seed crée des comptes de démo avec le mot de passe `demo1234`. Ne pas le lancer une fois le site ouvert au public.

## Notes techniques

- Migrations : `src/db/migrations.js`. Elles sont appliquées au démarrage et suivies dans la table `schema_migrations`. Pour faire évoluer le schéma, on **ajoute** une migration, on ne modifie jamais une migration déjà déployée.
- Pool MySQL limité à 5 connexions (limite du mutualisé).
- `bcryptjs` est en pur JavaScript, sans compilation native sur l'hébergement.
- `public/css/app.css` est versionné : après une modification des vues ou du style, lancer `npm run build:css` avant de committer.
- Les vidéos ne passeront **jamais** par le serveur : elles iront directement du téléphone vers Cloudinary (phase 2).
