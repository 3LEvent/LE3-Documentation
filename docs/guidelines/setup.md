---
sidebar_position: 1
---

# Configuration de l'Environnement

Ce guide décrit la mise en place d'un poste de travail pour contribuer aux dépôts du 3LEvent.

---

## 1. Prérequis communs

| Outil | Version | Nécessaire pour |
| :--- | :--- | :--- |
| **Git** | 2.40+ | tous |
| **Node.js** | **20 LTS ou supérieur** | applications web |
| **npm** | fourni avec Node | applications web |
| **Docker + Docker Compose** | récent | services locaux (Mongo, Redis, MySQL) |
| **JDK 21** (Temurin) | 21 | plugin Minecraft |
| **Maven** | 3.9+ | plugin Minecraft |
| **Terminal** | zsh, bash ou PowerShell 7 | tous |

:::info Pas d'Angular CLI
Aucun CLI de framework frontend n'est requis : le frontend est compilé par `tsc` et
`@tailwindcss/cli`, tous deux installés localement par `npm install`.
:::

Vérification rapide :

```bash
node -v        # v20.x ou plus
npm -v
java -version  # 21.x
mvn -v
docker --version
```

---

## 2. Applications web (`3levent`, `3levent-live`, `3levent-panel`)

Les trois dépôts se montent exactement de la même manière.

```bash
git clone git@github.com:3LEvent/<depot>.git
cd <depot>
npm install
cp .env.example .env    # si présent ; sinon demander le modèle à un lead
```

### Développement avec rechargement à chaud

Deux terminaux :

```bash
npm run dev       # backend, tsx watch, lit .env
npm run dev:css   # Tailwind --watch
```

Le frontend TypeScript n'a **pas** de mode watch dédié : après modification d'un fichier
`public/js/*.ts`, relancez `npm run build:frontend`.

### Build complet

```bash
npm run build     # clean + backend + frontend + css + copie des assets
npm start         # node --env-file=.env dist/backend/server.js
```

| Application | Port | URL locale |
| :--- | :--- | :--- |
| `3levent` | 3000 | http://localhost:3000 |
| `3levent-live` | 3001 | http://localhost:3001 |
| `3levent-panel` | 3200 | http://localhost:3200 |

---

## 3. Services locaux (MongoDB, Redis, MySQL)

Seul `3levent-panel` fournit un `docker-compose.dev.yml` - mais il est utilisable pour l'ensemble
de la stack, puisqu'il lance les trois dépendances.

```bash
cd 3levent-panel
npm run docker:up     # mongo:7 (27017), redis:7 (6379), mysql:8 (3307)
npm run seed:dev      # rôles panel + config du site
npm run docker:down   # arrêt (-v pour effacer les volumes)
```

MySQL est exposé sur le port **3307** côté hôte pour éviter tout conflit avec une instance locale,
et initialisé par `scripts/mysql-init.sql` qui reproduit le schéma du plugin avec des données de
démonstration.

Pointez ensuite les `.env` des autres applications sur ces mêmes instances : `REDIS_URL` doit être
**identique partout**, sinon le bus d'événements et les drapeaux de maintenance ne circulent pas.

### Travailler sur le panel sans Authentik

Mettez `LE3_DEV_AUTH_BYPASS=true` et `NODE_ENV=development`, puis utilisez le bouton
**« Connexion développeur (local) »** de la page de connexion : il ouvre une session
`SUPER_ADMIN`. Les deux conditions sont exigées simultanément - impossible de l'activer par
accident en production.

### Sessions partagées en local

En développement, le cookie n'a **pas** de domaine (`domain: undefined`) : `localhost:3000` et
`localhost:3001` ne partagent donc pas la session comme le font `3levent.fr` et
`live.3levent.fr`. C'est attendu ; testez le partage de session en pré-production.

---

## 4. Plugin Minecraft (`LE3-Plugin-Core`)

```bash
git clone git@github.com:3LEvent/LE3-Plugin-Core.git
cd LE3-Plugin-Core
mvn clean package        # JAR shadé dans target/
```

`JAVA_HOME` doit pointer sur le JDK 21 : Paper 1.21.11 ne compile pas avec une version antérieure.

Le `fmt-maven-plugin` s'exécute en phase `validate` et **reformate les sources** au Google Java
Style à chaque build. Ne combattez pas le formateur : commitez le résultat.

### Serveur de test local

1. Un serveur **Paper 1.21.x** local.
2. Copier `target/LE3CorePlugin-1.0.0-SNAPSHOT.jar` dans `plugins/`.
3. Démarrer une fois pour générer `plugins/LE3CorePlugin/config.yml`, `achievements.yml`,
   `data.yml`.
4. Régler `database.type: sqlite` pour éviter d'avoir besoin de MySQL.
5. Régler `api.sync_url` sur votre Core local (`http://localhost:3000/api/plugin/sync-teams`) et
   `api.secret` sur la même valeur que `LE3_PLUGIN_SECRET`.

---

## 5. Configuration TypeScript

Trois fichiers par application, à ne pas confondre :

| Fichier | Rôle |
| :--- | :--- |
| `tsconfig.json` (racine) | Base commune : `target ES2022`, `NodeNext`, mode strict complet |
| `backend/tsconfig.json` | Serveur : `lib: ["ES2022"]`, `types: ["node"]`, sortie `dist/backend` |
| `public/tsconfig.json` | Navigateur : `lib` avec `DOM`, `types: []`, `module: ESNext`, sortie `dist/public` |

Le mode strict est **complet** et non négociable : `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`,
`noFallthroughCasesInSwitch`, `useUnknownInCatchVariables`.

:::note `verbatimModuleSyntax: false`
Ce réglage est volontaire : il est nécessaire pour que `esModuleInterop` fonctionne avec Express
et Morgan. Ne le passez pas à `true` sans corriger tous les imports par défaut concernés.
:::

Le frontend a `types: []` pour empêcher les types Node de fuiter dans du code navigateur. Si vous
voyez `process` ou `Buffer` dans `public/js/`, c'est une erreur de conception, pas un problème de
configuration.

---

## 6. IDE

### IntelliJ IDEA - Java

* Plugin **Minecraft Development** (événements, dépendances Paper).
* Style de code : **Google Java Style** : importer le même profil que `fmt-maven-plugin`.

### VS Code / WebStorm - TypeScript et documentation

* **ESLint** (les dépôts embarquent `eslint` 9).
* **Tailwind CSS IntelliSense** : attention, Tailwind v4 déclare ses tokens dans `input.css` via
  `@theme`, pas dans `tailwind.config.js`.
* **Mermaid** pour prévisualiser les diagrammes de cette documentation.

---

## 7. Documentation (`LE3-Documentation`)

Site **Docusaurus 3**.

```bash
git clone git@github.com:3LEvent/LE3-Documentation.git
cd LE3-Documentation
npm install
npm start      # http://localhost:3000, rechargement à chaud
npm run build  # vérifie aussi les liens : onBrokenLinks = 'throw'
```

:::warning Toujours builder avant d'ouvrir une PR
`onBrokenLinks: 'throw'` fait échouer le build sur le moindre lien interne cassé. Un `npm run
build` local évite un aller-retour de revue.
:::

---

## 8. Accès à demander

1. **GitHub** : rejoindre l'organisation 3LEvent.
2. **Authentik** (`sso.3levent.fr`) - obligatoire pour accéder au panel staff.
3. **Valeurs `.env`** : jamais transmises par messagerie publique ; voir
   [Gestion des secrets](../infrastructure/secrets-management).

---

### Prochaines étapes

* **[Standards de programmation](./coding-standards)**
* **[Applications Web](../projects/web-applications)**
* **[Conventions Git](../workflow/git-conventions)**
