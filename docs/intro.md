---
sidebar_position: 1
---

# Introduction au Développement 3LEvent

Bienvenue sur la documentation technique officielle du **3LEvent**. Ce portail centralise les
standards, l'architecture réelle et les procédures d'exploitation de l'écosystème.

Cette documentation décrit **ce qui est déployé**, pas une cible idéale. Chaque affirmation
technique de ce portail est vérifiable dans le code des dépôts référencés ci-dessous.

---

## 1. Les quatre services de l'écosystème

L'écosystème est composé de quatre unités déployables indépendantes. Elles ne partagent
**aucun code** : elles se coordonnent par un bus d'événements Redis et quelques appels HTTP
authentifiés.

| Service | Dépôt | Rôle | Port | Domaine |
| :--- | :--- | :--- | :--- | :--- |
| **Core Web** | `3levent` | Site public : forum, inscriptions, profils, back-office | `3000` | `3levent.fr` |
| **Live Web** | `3levent-live` | Dashboard temps réel : classement, Twitch, pronostics | `3001` | `live.3levent.fr` |
| **Staff Panel** | `3levent-panel` | Monitoring, gestion in-game, éditeur BDD, IAM | `3200` | `panel.3levent.fr` |
| **Plugin Core** | `LE3-Plugin-Core` | Plugin Paper : équipes, succès, progression | — | serveur Minecraft |

:::info Bot Discord
Le bot Discord (`LE3-App-DiscordBot`) est **prévu mais pas encore implémenté**. Le contrat
d'événements réserve déjà le nom de service `discord-bot`, ce qui lui permettra de se brancher
sur le bus sans modifier les services existants. Voir [Bot Discord](./projects/discord-bot).
:::

---

## 2. Stack technique réelle

Les trois applications web partagent strictement la même stack, les mêmes conventions et la même
structure de dossiers. Un développeur qui connaît l'une connaît les trois.

| Composant | Technologie | Version |
| :--- | :--- | :--- |
| **Runtime** | Node.js | `>=20` (images Docker en `node:22-slim`) |
| **Langage** | TypeScript strict, ESM natif | `5.9.x` |
| **Serveur HTTP** | Express | `5.x` |
| **Base de données** | MongoDB via Mongoose | `8.x` |
| **Cache / Sessions / Bus** | Redis (`redis` + `connect-redis`) | `redis:7` |
| **Frontend** | HTML statique + TypeScript compilé (`tsc`), **aucun framework** | — |
| **Styles** | Tailwind CSS (CLI, directive `@theme`) | `4.x` |
| **Plugin Minecraft** | Java + Paper API | Java 21, Paper `1.21.11` |
| **Build plugin** | Maven (shade + fmt-maven-plugin) | — |
| **Exécution** | Docker | — |

:::warning Ce que la stack n'est PAS
Il n'y a **ni Angular, ni React, ni framework SPA, ni TanStack Query, ni Cloudflare Pages, ni
Workers**. Le frontend est composé de fichiers `.html` servis par Express et de fichiers `.ts`
compilés en JavaScript natif chargé par `<script type="module">`. Les anciennes versions de cette
documentation décrivaient une stack Angular qui n'a jamais été déployée.
:::

---

## 3. Structure commune des applications web

Les trois applications suivent la même arborescence. Le backend et le frontend ont chacun leur
`tsconfig.json` et sont compilés séparément vers `dist/`.

```text
<app>/
├── backend/
│   ├── config/db-config.ts       # Connexion Mongoose
│   ├── controllers/              # Logique métier (1 fichier par domaine)
│   ├── events/ecosystem-event.ts # Contrat d'enveloppe du bus (dupliqué par service)
│   ├── middleware/               # auth, maintenance
│   ├── models/                   # Schémas Mongoose
│   ├── routes/                   # Routeurs Express montés sous /api/*
│   ├── services/                 # Redis, consumers, intégrations tierces
│   ├── utils/
│   └── server.ts                 # Point d'entrée
├── public/
│   ├── *.html                    # Pages servies par Express
│   ├── js/*.ts                   # Handlers frontend (compilés par tsc)
│   ├── src/input.css             # Source Tailwind (tokens @theme)
│   └── css/style.css             # Sortie Tailwind (générée)
├── Dockerfile
└── package.json
```

---

## 4. Standards non négociables

### Code

* **Anglais technique** pour tout le code (identifiants, commentaires, logs). Les messages
  destinés aux joueurs et au staff sont en français.
* **TypeScript strict** : `any` interdit, `unknown` sinon.
* **ESM** : les imports relatifs se terminent par `.js`, même en TypeScript
  (`import { Team } from '../models/team-model.js'`).
* **Fichiers en kebab-case** : `plugin-api-controller.ts`, `team-cache-model.ts`.

Détail complet : [Standards de programmation](./guidelines/coding-standards).

### Sécurité

* Aucun secret dans le code source ou dans un fichier commité.
* Toute I/O du plugin Java (SQL, HTTP) est asynchrone : jamais sur le thread principal.
* Les comparaisons de secrets partagés utilisent une comparaison à temps constant
  (`secure-compare.ts`).

Détail complet : [Gestion des secrets](./infrastructure/secrets-management).

### Git

Branches `main` (production) et `develop` (intégration), branches de travail `feat/`, `fix/`,
`docs/`, `refactor/`, `chore/`. Commits au format **Conventional Commits**. Fusion en
**Squash and Merge**. Détail : [Conventions Git](./workflow/git-conventions).

---

## 5. Par où commencer

| Votre objectif | Lire en premier |
| :--- | :--- |
| Comprendre comment les services communiquent | [Vue d'ensemble](./architecture/overview) |
| Monter un environnement local | [Configuration de l'environnement](./guidelines/setup) |
| Travailler sur le site public | [Core Web](./projects/web-core) |
| Travailler sur le panel staff | [Staff Panel](./projects/staff-panel) |
| Travailler sur le plugin | [Plugins Minecraft](./projects/minecraft-plugins) |
| Comprendre les données | [Schéma des données](./architecture/database-schema) |
