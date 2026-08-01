---
sidebar_position: 2
---

# Core Web - `3levent`

Le site public du 3LEvent : forum, portail d'inscription, profils joueurs, back-office, et
**passerelle unique du plugin Minecraft** vers le reste de l'écosystème.

| | |
| :--- | :--- |
| **Dépôt** | `3levent` |
| **Paquet npm** | `le3-app-server` |
| **Port** | `3000` |
| **Domaine** | `3levent.fr` |
| **Base** | MongoDB (`LE3_DATABASE_URL`) |

Stack, arborescence et scripts : voir [Applications Web](./web-applications).

---

## 1. Responsabilités

1. **Forum** : catégories hiérarchiques, threads, commentaires, recherche, épinglage, verrouillage.
2. **Portail d'inscription** : liaison Microsoft (compte Minecraft) et Discord, OTP, rattachement
   à une équipe.
3. **Profils** : liaison/déliaison Discord et Twitch.
4. **Back-office `/admin`** : statistiques, architecture du forum, gestion des membres, audit,
   gestion du tournoi.
5. **Passerelle plugin** : `/api/plugin/*`, seul point de contact du serveur Minecraft.
6. **Journal du bus** : persiste chaque événement de `le3:eventbus` dans `eventlogs`.

---

## 2. Pages servies

| Route | Fichier | Garde |
| :--- | :--- | :--- |
| `/` | `index.html` | - |
| `/signup` | `signup.html` | - |
| `/forum` | `forum.html` | - |
| `/forum/threads/:id` | `thread.html` | - |
| `/forum/create` | `create-thread.html` | session requise |
| `/search` | `search.html` | - |
| `/profile` | `profile.html` | - |
| `/login` | `login.html` | redirige vers `/profile` si déjà connecté |
| `/admin` | `admin.html` | rôle `STAFF` ou `ADMIN` |

### Redirections courtes

`server.ts` expose une table `REDIRECTS` : `/wiki`, `/soutien`, `/discord`, `/twitter`,
`/youtube`, `/direct` (→ `live.3levent.fr`), `/rules`, `/cgu`, `/credits`. Les trois dernières
pointent vers des threads du forum par identifiant - **elles cassent si le thread est supprimé**.

---

## 3. API

### `/api/auth` - identité

`GET /microsoft/login` · `/microsoft/callback` · `/discord/login` · `/discord/callback` ·
`/twitch/login` · `/twitch/callback` · `/me` · `/logout`, `DELETE /discord/unlink` ·
`/twitch/unlink`.

Détail des flux : [Authentification et sessions](../architecture/authentication).

### `/api/portal` - inscription à l'événement

`GET /me` (statut du portail), `POST /otp/create`, flux Discord et Microsoft dédiés,
`POST /signup` (finalisation).

### `/api/forum`

Lecture publique : `/categories`, `/news/latest`, `/activity`, `/search`, `/threads`,
`/threads/:id`, `/stats`, `/users/search`, `/my-posts`.
Écriture authentifiée : `POST /threads`, `PUT /threads/:id`, `POST /threads/:id/comments`,
`PUT /comments/:id`, plus les actions de modération (`PATCH` / `DELETE`).

### `/api/users`

`GET /me` (via `protect`), `POST /register`, `POST /login`, `GET /:id`, `DELETE /:id`.

### `/api/admin`

Toutes les routes exigent `requireAuth` **et** `authorize(...)` :

| Section | Routes | Rôles |
| :--- | :--- | :--- |
| Dashboard | `GET /stats` | `STAFF`, `ADMIN` |
| Forum | `GET/POST/PUT/DELETE /categories[/:id]`, `PATCH /categories/reorder` | `ADMIN` |
| Membres | `GET /users/search` | `STAFF`, `ADMIN` |
| Membres | `PATCH /users/status`, `DELETE /users/:id` | `ADMIN` |
| Audit | `GET /logs` | `ADMIN` |
| Tournoi | `GET /signups`, `GET /teams` | `STAFF`, `ADMIN` |
| Tournoi | `DELETE /signups/:id`, `DELETE /teams/:id` | `ADMIN` |


### `/api/plugin` - réservé au serveur Minecraft

`GET /sync-teams` et `POST /events`, authentifiées par l'en-tête `x-plugin-secret`.
Contrat détaillé : [Protocoles de communication](../architecture/communication-protocol).

---

## 4. Correspondance équipes site ↔ plugin

`plugin-api-controller.ts` traduit le nom d'équipe du site en `slotKey` du plugin :

| Équipe (site) | `slotKey` | Équipe (site) | `slotKey` |
| :--- | :--- | :--- | :--- |
| Requins Rouges | `red` | Renards Roses | `pink` |
| Bélier Bleus | `blue` | Vautours Violets | `purple` |
| Ours Orange | `orange` | Caimans Cyan | `cyan` |
| Jaguards Jaunes | `yellow` | Administrateurs | `admin` |
| Vipères Vertes | `green` | | |

Les comptes `ADMIN` et `STAFF` ayant lié leur compte Minecraft sont injectés automatiquement dans
l'équipe `admin` - mais **jamais** s'ils appartiennent déjà à une équipe de tournoi : l'équipe
admin a la priorité la plus basse, il n'y a pas de transfert.

---

## 5. Mode maintenance

`createMaintenanceGuard(redisClient, 'le3:maintenance:main')` est monté juste après la session. Le
drapeau est écrit par le CMS du [Staff Panel](./staff-panel) ; le Core ne fait que le lire. Aucun
appel HTTP entre les deux services.

---

## 6. Variables d'environnement

| Variable | Rôle |
| :--- | :--- |
| `PORT`, `NODE_ENV` | Serveur |
| `LE3_DATABASE_URL` *(ou `MONGO_URI`)* | MongoDB - **obligatoire**, `throw` si absente |
| `REDIS_URL` | Sessions + bus (défaut `redis://le3-redis:6379`) |
| `LE3_SESSION_SECRET` *(ou `SESSION_SECRET`)* | Secret de session - doit être identique au Live |
| `LE3_COOKIE_DOMAIN` | Domaine du cookie (défaut `.3levent.fr`) |
| `LE3_JWT_SECRET` | Vérification des JWT dans `protect` |
| `LE3_PLUGIN_SECRET` | Secret partagé avec le plugin |
| `LE3_MS_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | OAuth Microsoft |
| `LE3_DISCORD_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | OAuth Discord |
| `LE3_DISCORD_BOT_TOKEN`, `LE3_DISCORD_GUILD_ID` | Attribution de rôles Discord |
| `DISCORD_ROLE_INSCRIT_ID`, `DISCORD_TEAM_ROLES_IDS` | Identifiants de rôles Discord |
| `LE3_TWITCH_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | OAuth Twitch |

---

### Prochaines étapes

* **[Live Web](./web-live)** · **[Staff Panel](./staff-panel)**
* **[Protocoles de communication](../architecture/communication-protocol)**
