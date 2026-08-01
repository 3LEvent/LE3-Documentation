---
sidebar_position: 4
---

# Staff Panel - `3levent-panel`

L'outil interne du staff, derrière SSO Authentik : monitoring serveur, gestion in-game, éditeur
de base de données et gestion des accès.

| | |
| :--- | :--- |
| **Dépôt** | `3levent-panel` |
| **Paquet npm** | `le3-panel-server` |
| **Port** | `3200` |
| **Domaine** | `panel.3levent.fr` |
| **Bases** | MongoDB dédiée + MySQL du plugin (lecture/écriture auditée) |

Stack, arborescence et scripts : voir [Applications Web](./web-applications).

---

## 1. Les quatre modules

### Tableau de bord

* Métriques serveur en direct : TPS, MSPT, charge CPU, RAM, joueurs connectés.
* Console de logs temps réel via **SSE** (`GET /api/dashboard/stream`).
* Alertes Discord automatiques sur les logs `ERROR` et `CRITICAL`.
* Hub de ressources configurable (wiki, docs, règlement, Docker, Pterodactyl), filtré par rôle.

Deux sources alimentent les mêmes collections et le même hub temps réel, de façon transparente
pour le frontend :

1. les événements `server.metrics.heartbeat` / `log.entry.created` reçus sur le bus ;
2. le **service Pterodactyl** (`pterodactyl-service.ts`), qui interroge directement le serveur de
   jeu quand il est configuré - et ne fait rien sinon.

### Gestion in-game

Répertoire des succès lu directement depuis `achievements.yml` (le fichier du plugin, ou son
miroir désigné par `LE3_ACHIEVEMENTS_CONFIG_PATH`), avec filtres par jour et par monde.

Routes : `GET /api/achievements`, `/days`, `/worlds`, `/:id/yaml`.

### Éditeur de base de données

Remplace phpMyAdmin pour la base MySQL du plugin. Restreint à une **liste blanche stricte**
(`EDITABLE_TABLES`) : le nom de table *et* chaque nom de colonne sont validés avant toute requête
(`assertEditableTable`, `assertEditableColumn`), ce qui ferme la porte à l'injection par
identifiant.

| Table | Clé primaire | Colonnes éditables |
| :--- | :--- | :--- |
| `teams` | `id` | `id`, `name`, `points` |
| `team_achievements` | `team_id`, `achievement_key` | + `progress`, `completed` |
| `player_achievements` | `team_id`, `player_id`, `achievement_key` | (clé seule) |
| `core_settings` | `setting_key` | `setting_key`, `setting_value` |

Pagination bornée (25 par défaut, 100 maximum) et recherche `LIKE` sur les colonnes autorisées.
**Chaque écriture est auditée** : `dbeditoraudits` conserve l'auteur, l'action, la clé primaire
et les états `before` / `after`. `GET /api/db-editor/audit` expose la piste d'audit.

### IAM

Gestion des rôles panel, des groupes d'accès et de l'annuaire du staff. Toutes les routes sont
protégées en bloc :

```ts
router.use(requireAuth, requirePermission('MANAGE_IAM'));
```

Routes : `GET /health`, `/access-groups`, `/roles`, `PUT /roles`, `DELETE /roles/:id`,
`GET /staff`, `PATCH /staff/:id/role`, `PATCH /staff/:id/status`, `DELETE /staff/:id`.

Modèle de permissions complet : [Authentification et sessions](../architecture/authentication).

### CMS (bonus)

`GET/PATCH /api/cms/config` (nom de l'événement, maintenance par site, `hide_scores`,
inscriptions ouvertes), `GET/PATCH /api/cms/env` (intégrations), `GET/PUT
/api/cms/achievements-file` (édition du YAML des succès), et la gestion des liens de ressources.

:::danger Les clés `LE3_AUTHENTIK_*` ne sont pas éditables depuis le CMS
C'est volontaire : une faute de frappe sur l'issuer ou le `client_id` verrouillerait **tout le
monde** hors du panel, sans possibilité de correction par l'interface. Ces clés se modifient
uniquement dans l'environnement.
:::

---

## 2. Sécurité : trois barrières

1. **Pages** : `PRIVATE_PAGES` (`dashboard`, `achievements`, `database`, `iam`, `profile`, `cms`)
   est déclaré **avant** `express.static`, pour qu'un HTML privé ne puisse jamais être servi à un
   visiteur non authentifié. `/` redirige vers `/dashboard.html` ou `/login.html` selon la session.
2. **Navigation** : le frontend masque les onglets non autorisés. Confort, pas sécurité.
3. **API** : chaque route re-vérifie sa permission via `requirePermission`. C'est la seule
   barrière qui compte.

La session du panel est **isolée** de celle des joueurs : cookie `le3panel.sid`, préfixe Redis
`le3panel:sess:`, TTL de 8 heures (« une session de panel staff ne doit pas traîner des jours »).

---

## 3. Temps réel : une souscription, N onglets

```text
Redis le3:eventbus ──► telemetry-consumer ──► realtimeHub (EventEmitter) ──► N flux SSE
                              ├──► MongoDB (servermetrics / serverlogs, capped)
                              └──► webhook Discord si niveau ERROR/CRITICAL
```

Ouvrir dix onglets du dashboard ne crée **pas** dix souscriptions Redis : une seule souscription
par processus alimente un hub in-process qui diffuse à tous les clients SSE.

---

## 4. Développement local

Le panel est la seule application avec un environnement local complet et scripté.

```bash
npm install
cp .env.example .env      # puis remplir
npm run docker:up         # mongo + redis + mysql (données de démo)
npm run seed:dev          # rôles panel + config du site (aucun compte staff)
npm run build
npm start                 # http://localhost:3200
```

Sur la page de connexion, le bouton **« Connexion développeur (local) »** ouvre une session
`SUPER_ADMIN` sans instance Authentik. Il exige les **deux** conditions :
`NODE_ENV !== 'production'` **et** `LE3_DEV_AUTH_BYPASS=true`.

`docker-compose.dev.yml` lance MongoDB 7, Redis 7 et MySQL 8 (port hôte **3307** pour éviter le
conflit avec un MySQL local), initialisé par `scripts/mysql-init.sql` qui reproduit exactement les
quatre tables du plugin avec des données de démonstration.

Arrêt : `npm run docker:down` (`-v` pour effacer les volumes).

Rechargement à chaud : `npm run dev` (backend) et `npm run dev:css` (Tailwind) dans deux
terminaux.

---

## 5. Variables d'environnement

| Variable | Rôle |
| :--- | :--- |
| `PORT`, `NODE_ENV` | Serveur (défaut `3200`) |
| `LE3_MONGO_URI` | MongoDB du panel - **obligatoire**, `throw` si absente |
| `REDIS_URL` | Bus **partagé** avec le Core, le Live et le plugin |
| `LE3_SESSION_SECRET`, `LE3_COOKIE_DOMAIN` | Session isolée du panel |
| `LE3_AUTHENTIK_ISSUER` | Issuer OIDC, **slash final obligatoire** |
| `LE3_AUTHENTIK_CLIENT_ID` / `_CLIENT_SECRET` | Client OIDC |
| `LE3_AUTHENTIK_REDIRECT_URI` | Doit correspondre **au caractère près** à Authentik |
| `LE3_AUTHENTIK_POST_LOGOUT_REDIRECT_URI`, `LE3_AUTHENTIK_SCOPES` | Optionnels |
| `LE3_BOOTSTRAP_SUPER_ADMIN` | Amorçage du premier admin - **à vider ensuite** |
| `LE3_DEV_AUTH_BYPASS` | Bypass local, jamais en production |
| `LE3_DISCORD_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | Liaison Discord (jamais connexion) |
| `LE3_DISCORD_ALERT_WEBHOOK_URL` | Salon privé d'alertes critiques |
| `LE3_ACHIEVEMENTS_CONFIG_PATH` | Chemin du `achievements.yml` |
| `LE3_PLUGIN_MYSQL_HOST` / `_PORT` / `_DATABASE` / `_USER` / `_PASSWORD` | Base du plugin |
| `LE3_PTERODACTYL_URL` / `_API_KEY` / `_SERVER_ID` | Clé **client** (`ptlc_…`) avec accès console |
| `LE3_PANEL_URL`, `LE3_PANEL_ALLOWED_ORIGIN` | URL publique, origines CORS |

---

### Prochaines étapes

* **[Authentification et sessions](../architecture/authentication)**
* **[Schéma des données](../architecture/database-schema)**
* **[Core Web](./web-core)** · **[Live Web](./web-live)**
