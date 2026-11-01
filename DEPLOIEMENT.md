# Déploiement sur Hostinger (hébergement mutualisé)

SenTravail est une application **Node.js / Express**. Sur Hostinger, elle tourne dans la section **Web App (Node.js)**, disponible uniquement sur les plans **Business** et **Cloud** (pas sur Single ni Premium).

L'hébergement mutualisé ne fournit pas MongoDB : la base de données est sur **MongoDB Atlas** (gratuit pour démarrer).

---

## 1. Créer la base MongoDB Atlas

1. Créer un compte sur https://www.mongodb.com/cloud/atlas et un cluster **M0 (gratuit)**. Région conseillée : **Europe (Paris ou Francfort)**, la plus proche du Sénégal et des serveurs Hostinger.
2. **Database Access** → ajouter un utilisateur (ex. `sentravail`) avec un mot de passe fort et le rôle *Read and write to any database*.
3. **Network Access** → *Add IP Address* → `0.0.0.0/0`. L'IP d'un hébergement mutualisé n'est pas fixe : c'est le mot de passe qui protège la base.
4. **Connect** → *Drivers* → copier l'adresse, puis ajouter le nom de la base après `.net/` :
   ```
   mongodb+srv://sentravail:MOTDEPASSE@cluster0.xxxxx.mongodb.net/sentravail?retryWrites=true&w=majority
   ```

## 2. Créer l'application sur Hostinger

1. hPanel → **Sites web** → **Créer un site** → **Web App**.
2. **Importer un dépôt Git** → autoriser GitHub → choisir `aboufaty25/sentravail1`, branche `main`.
3. Paramètres de build (vérifier ce que Hostinger a détecté) :

   | Réglage | Valeur |
   |---|---|
   | Framework | **Express.js** (ou *Other*) |
   | Version Node.js | **22.x** |
   | Commande d'installation | `npm install` |
   | Commande de build | `npm run build` |
   | Fichier d'entrée | `src/server.js` |
   | Commande de démarrage | `npm start` (si demandée) |
   | Dossier de sortie | laisser vide / `public` si obligatoire |

4. **Variables d'environnement**, à saisir dans Hostinger et **jamais** dans le code :

   | Variable | Valeur |
   |---|---|
   | `NODE_ENV` | `production` |
   | `BASE_URL` | `https://sentravail.com` |
   | `MONGODB_URI` | l'adresse Atlas de l'étape 1 |
   | `SESSION_SECRET` | une longue chaîne aléatoire (voir ci-dessous) |
   | `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | phase 2, peut rester vide pour l'instant |
   | `ADSENSE_CLIENT_ID` | phase 6, peut rester vide |

   Pour générer `SESSION_SECRET`, sur n'importe quel ordinateur :
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Ne pas définir `PORT` : Hostinger le fournit.

   Le **Database Connect Wizard** de Hostinger (tableau de bord Node.js) peut aussi remplir `MONGODB_URI` automatiquement depuis Atlas. Vérifier ensuite que le nom de la variable est bien `MONGODB_URI`.

5. **Déployer**. Ensuite, chaque `git push` sur `main` redéploie automatiquement.

## 3. Domaine et HTTPS

- Connecter `sentravail.com` à l'application (tableau de bord du site → Domaine) et activer le **SSL** (gratuit).
- Le cookie de session est marqué `Secure` en production : le site **doit** être servi en HTTPS, sinon la connexion ne fonctionne pas.

## 4. Vérifier

- `https://sentravail.com/healthz` doit répondre `{"status":"ok"}`.
- S'inscrire, modifier le profil, se déconnecter, se reconnecter.
- En cas d'échec : tableau de bord → **Deployments** → journal du build, puis redémarrer avec **Restart**.

| Symptôme | Cause probable |
|---|---|
| `MONGODB_URI must be set in production` dans les logs | variable manquante |
| `[fatal] … querySrv` ou `timed out` | `0.0.0.0/0` absent dans Atlas *Network Access*, ou mot de passe erroné |
| Connexion qui « ne tient pas » (retour à la page connexion) | site ouvert en `http://` au lieu de `https://` |
| Page sans style | le build n'a pas tourné : `npm run build` doit figurer dans les paramètres |

## 5. Données de démonstration (optionnel)

Hostinger ne permet pas de lancer des commandes npm à la main. Pour remplir la base, lancer le seed **depuis ton ordinateur** en pointant vers Atlas :

```bash
MONGODB_URI="mongodb+srv://…/sentravail" npm run seed
```

Le seed crée des comptes de démo avec le mot de passe `demo1234`. Ne pas le faire sur la base de production une fois le site ouvert au public.

## Notes techniques

- `bcryptjs` (pur JavaScript) est utilisé à la place de `bcrypt` pour éviter toute compilation native sur l'hébergement.
- `public/css/app.css` est versionné : le site garde son style même si l'étape de build est sautée. Après une modification du style, lancer `npm run build:css` avant de committer.
- Les sessions sont stockées dans MongoDB (collection `sessions`), donc les redémarrages ne déconnectent personne.
- Limites du mutualisé : CPU, RAM et nombre de processus limités. Les vidéos ne passeront **jamais** par le serveur : elles iront directement du téléphone vers Cloudinary (phase 2).
