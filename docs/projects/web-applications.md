---
sidebar_position: 1
---

# Applications Web - Stack commune

Les trois applications web du 3LEvent (`LE3-Web-Main`, `LE3-Web-Live`, `LE3-Web-Panel`) partagent
la même stack, les mêmes conventions et la même chaîne de build. Cette page décrit **ce qui leur
est commun** ; les pages [Core Web](./web-core), [Live Web](./web-live) et
[Staff Panel](./staff-panel) décrivent leurs spécificités.

---

## 1. Stack

| Composant | Choix | Version |
| :--- | :--- | :--- |
| Runtime | Node.js | `>=20` (Docker : `node:22-slim`) |
| Langage | TypeScript strict, **ESM natif** (`"type": "module"`) | `5.9.x` |
| Serveur | Express | `5.x` |
| Base de données | MongoDB / Mongoose | `9.x` |
| Sessions & bus | Redis + `connect-redis` | `redis:7` |
| Sécurité HTTP | `helmet`, `cors` | - |
| Journalisation HTTP | `morgan` | - |
| Tests | Vitest | 17 tests de contrat par dépôt |
| Lint | ESLint | `9.x` |
| Frontend | HTML + TypeScript compilé, **aucun framework** | - |
| CSS | Tailwind CSS via `@tailwindcss/cli` | `4.x` |
| Exécution dev | `tsx --env-file=.env watch` | - |

:::warning Pas de framework frontend
Il n'y a ni Angular, ni React, ni Vue, ni bundler. Les pages sont des fichiers `.html` servis par
Express ; le comportement vient de fichiers `public/js/*.ts` compilés par `tsc` en JavaScript ESM
et chargés en `<script type="module">`. Toute proposition d'introduire un framework doit être
discutée avant d'être implémentée : elle change la chaîne de build des trois applications.
:::

### Dépendances propres à chaque application

| Application | Ajouts |
| :--- | :--- |
| `LE3-Web-Main` | `bcryptjs`, `jsonwebtoken`, `multer` |
| `LE3-Web-Live` | aucune (le client Twitch utilise `fetch` natif) |
| `LE3-Web-Panel` | `mysql2` (base du plugin), `js-yaml` (`achievements.yml`), `ws` |

---

## 2. Arborescence normalisée

```text
<app>/
├── backend/
│   ├── config/db-config.ts        # Connexion Mongoose
│   ├── controllers/               # Logique métier, 1 fichier par domaine
│   ├── events/ecosystem-event.ts  # Contrat du bus (copie locale)
│   ├── events/ecosystem-event.test.ts
│   ├── middleware/                # auth.ts, maintenance.ts
│   ├── models/                    # Schémas Mongoose (kebab-case, suffixe -model)
│   ├── routes/                    # Routeurs Express, suffixe -routes
│   ├── services/                  # Redis, consumers, intégrations tierces
│   ├── types/express.d.ts         # Augmentations Request / SessionData
│   ├── utils/
│   ├── tsconfig.json
│   └── server.ts
├── public/
│   ├── *.html
│   ├── js/*.ts                    # Handlers, suffixe -handler + utils.ts
│   ├── src/input.css              # Tokens Tailwind (@theme)
│   ├── css/style.css              # Généré - ne pas éditer
│   └── tsconfig.json
├── Dockerfile
└── package.json
```

Un contrôleur ne connaît jamais Redis directement : il passe par `req.app.locals.eventBus`.

---

## 3. Séquence de démarrage de `server.ts`

Les trois serveurs suivent la même séquence numérotée en commentaires. La respecter est important :
plusieurs étapes dépendent de l'ordre.

1. Chargement de l'environnement (`dotenv`).
2. Validation **fail-fast** des variables critiques → `throw` si absentes.
3. Connexion MongoDB → `process.exit(1)` en cas d'échec.
4. Résolution du chemin `public/` (essaie `dist/public`, `public`, `../public`).
5. Sécurité réseau : `helmet` (CSP explicite, HSTS 1 an), `cors` (origines en liste blanche),
   `morgan`, parseurs de corps.
6. Session Redis + hydratation `req.user`.
7. Bus d'événements + démarrage des consumers.
8. Routes de pages / garde de maintenance / `express.static`.
9. Montage des routeurs `/api/*`.
10. Gestionnaire d'erreurs global (JSON sous `/api/`, HTML sinon).
11. Écoute + arrêt propre sur `SIGINT` / `SIGTERM`.

:::danger Ordre des routes du Panel
Sur le panel, les routes de pages privées sont déclarées **avant** `express.static`. Inverser cet
ordre exposerait les fichiers HTML privés aux visiteurs non authentifiés.
:::

:::caution Le Live n'implémente pas d'arrêt propre
Le Core et le Panel ferment explicitement le bus, le client Redis de session et le pool MySQL sur
`SIGINT` / `SIGTERM`. Le Live n'a pas de gestionnaire équivalent : ses connexions Redis sont
fermées par le runtime à la sortie du processus.
:::

---

## 4. Scripts npm

Identiques dans les trois dépôts :

| Script | Effet |
| :--- | :--- |
| `npm run dev` | Backend en rechargement à chaud (`tsx --env-file=.env watch`) |
| `npm run dev:css` | Tailwind en mode `--watch` (autre terminal) |
| `npm run clean` | `rm -rf dist` |
| `npm run build:backend` | `tsc -p backend/tsconfig.json` |
| `npm run build:frontend` | `tsc -p public/tsconfig.json` |
| `npm run build:css` | Tailwind minifié vers `public/css/style.css` |
| `npm run copy-assets` | Copie HTML/CSS/images/polices vers `dist/` via `copyfiles` |
| `npm run build` | `clean` + backend + frontend + css + assets |
| `npm start` | `node --env-file=.env dist/backend/server.js` |
| `npm run lint` | `eslint backend` |
| `npm test` · `npm run test:watch` | Suite Vitest |

Le panel ajoute `npm run docker:up`, `docker:down` et `seed:dev` pour son environnement local.

---

## 5. Sécurité HTTP commune

* `app.disable('x-powered-by')` et `app.set('trust proxy', 1)` (les applications tournent derrière
  un reverse proxy).
* CSP explicite par application, adaptée aux domaines réellement embarqués (Twitch, Discord CDN,
  `mc-heads.net`, Google Fonts…). Ajouter une ressource externe **exige** de mettre à jour la
  directive correspondante, sinon le navigateur la bloque silencieusement.
* HSTS : `maxAge: 31536000`, `includeSubDomains`, `preload`.
* CORS en liste blanche : `3levent.fr` / `live.3levent.fr` pour les sites publics,
  `LE3_PANEL_ALLOWED_ORIGIN` pour le panel.
* Limites de corps calibrées par usage : `10mb` sur le Core (téléversements), `5mb` sur le Panel,
  `10kb` sur le Live (qui ne reçoit que des votes).

---

## 6. Conteneurisation

Le `Dockerfile` est identique dans les trois dépôts : `node:22-slim`, installation des dépendances
d'abord (cache de couches), puis copie du projet.

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "backend/server.js"]
```

:::note Contenu attendu de l'image
La commande est `node backend/server.js`, pas `dist/backend/server.js` : c'est le **contenu de
`dist/`** qui est déployé à la racine du contexte de build. Le `npm run build` doit donc avoir été
exécuté avant la construction de l'image.
:::

---

### Prochaines étapes

* **[Core Web](./web-core)** · **[Live Web](./web-live)** · **[Staff Panel](./staff-panel)**
* **[Standards de programmation](../guidelines/coding-standards)**
* **[Design System](../guidelines/design-system)**
