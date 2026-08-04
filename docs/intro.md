---
sidebar_position: 1
---

# Introduction au Développement 3LEvent

Bienvenue sur la documentation technique officielle du **3LEvent**. Ce portail centralise les
standards, l'architecture réelle et les procédures d'exploitation de l'écosystème.

Cette documentation décrit **ce qui est déployé**, pas une cible idéale. Chaque affirmation
technique de ce portail est vérifiable dans le code des dépôts référencés ci-dessous.

---

## 1. Les services de l'écosystème

L'écosystème est composé d'unités déployables indépendantes. Elles se coordonnent par un bus
d'événements Redis, un cache Redis partagé et un appel HTTP authentifié.

| Service | Dépôt | Rôle | Port | Domaine |
| :--- | :--- | :--- | :--- | :--- |
| **Core Web** | `LE3-Web-Main` | Site public : forum, inscriptions, profils, back-office | `3000` | `3levent.fr` |
| **Live Web** | `LE3-Web-Live` | Dashboard temps réel : classement, Twitch, pronostics | `3001` | `live.3levent.fr` |
| **Staff Panel** | `LE3-Web-Panel` | Monitoring, gestion in-game, éditeur BDD, IAM | `3200` | `panel.3levent.fr` |
| **Plugin Core** | `LE3-Plugin-Core` | Plugin Paper : équipes, succès, progression | - | serveur Minecraft |
| **Discord Bot** | `LE3-Discord-Bot` | Vérification OTP, équipes, tickets, salons vocaux privés | - | Discord |
| **Discord Admin** | `LE3-Discord-Admin` | Alertes d'infrastructure, exploitation, accès du staff | - | Discord |

Trois dépôts complètent l'organisation sans porter de service déployé :

| Dépôt | Rôle |
| :--- | :--- |
| `LE3-Shared-Workflows` | Moteurs CI/CD réutilisables (`java-engine.yml`, `node-engine.yml`) |
| `LE3-Documentation` | Ce portail, publié sur `doc.3levent.fr` |
| `.github` | Standard d'organisation : `CONTRIBUTING.md`, CODEOWNERS, modèles d'issue et de PR |

Soit **neuf dépôts au total**. `LE3-Discord-Bot` et `LE3-Discord-Admin` ont été créés le
2026-08-04 ; les dix dépôts vides ou inutilisés avaient été supprimés le 2026-08-02.

---

## 2. Stack technique réelle

Les applications web partagent strictement la même stack, les mêmes conventions et la même
structure de dossiers. Un développeur qui connaît l'une connaît les autres.

| Composant | Technologie | Version |
| :--- | :--- | :--- |
| **Runtime** | Node.js | `>=20` sur les applications web, `>=22` sur le bot ; images Docker en `node:22-slim` |
| **Langage** | TypeScript strict, ESM natif | `5.9.x` |
| **Serveur HTTP** | Express | `5.x` |
| **Base de données** | MongoDB via Mongoose | `9.x` |
| **Cache / Sessions / Bus** | Redis (`redis` + `connect-redis`) | `redis:7` |
| **Frontend** | HTML statique + TypeScript compilé (`tsc`), **aucun framework** | - |
| **Styles** | Tailwind CSS (CLI, directive `@theme`) | `4.x` |
| **Tests** | Vitest | 17 tests sur Main et Panel, 23 sur Live, 22 sur le bot |
| **Plugin Minecraft** | Java + Paper API | Java 21, Paper `1.21.11-R0.1-SNAPSHOT` |
| **Client Redis du plugin** | Jedis (shadé et relocalisé) | `7.5.3` |
| **Build plugin** | Maven (shade + fmt-maven-plugin) | - |
| **Exécution** | Docker | - |

---

## 3. Structure commune des applications web

Les applications web suivent la même arborescence. Le backend et le frontend ont chacun leur
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
* Toute I/O du plugin Java (SQL, HTTP, Redis) est asynchrone : jamais sur le thread principal.
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
| Travailler sur le dashboard spectateur | [Live Web](./projects/web-live) |
| Travailler sur le panel staff | [Staff Panel](./projects/staff-panel) |
| Travailler sur le plugin | [Plugins Minecraft](./projects/minecraft-plugins) |
| Comprendre les données | [Schéma des données](./architecture/database-schema) |
