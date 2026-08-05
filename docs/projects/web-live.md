---
sidebar_position: 3
---

# Live Web - `LE3-Web-Live`

Le dashboard temps réel destiné aux spectateurs : classement des équipes, statut des streams
Twitch et pronostics.

| | |
| :--- | :--- |
| **Dépôt** | `LE3-Web-Live` |
| **Paquet npm** | `le3-live-server` |
| **Port** | `3001` |
| **Domaine** | `live.3levent.fr` |
| **Base** | MongoDB dédiée (`LE3_MONGO_URI`) |

Stack, arborescence et scripts : voir [Applications Web](./web-applications).

---

## 1. Principe : un read-model, pas une API cliente

Le Live **n'appelle jamais** l'API du Core et **n'ouvre jamais** la base MySQL du plugin. Il
s'abonne au bus `le3:eventbus` et projette les événements qu'il comprend dans sa propre base
MongoDB (`live-event-consumer.ts`). Le classement est ensuite servi depuis cette projection
locale.

```text
plugin ──publish──► le3:eventbus ──► live-event-consumer ──► MongoDB Live
Core   ──publish──►                                                │
                                            GET /api/live/leaderboard
```

Avantage : le Live reste disponible et cohérent même si le Core est indisponible ou si le serveur
Minecraft redémarre.

### Événements consommés

| Type | Payload | Projection |
| :--- | :--- | :--- |
| `plugin.teams.snapshot` | `{ teams: [{ slotKey, name, members }] }` | upsert de `liveteamstates` (nom, points à 0 à la création) |
| `plugin.team.points.updated` | `{ slotKey, points }` | mise à jour des points |
| `plugin.achievement.granted` | `{ uuid, achievementKey?, slotKey? }` | `$inc` sur `liveplayerachievementstates` |
| `plugin.settings.updated` | `{ key, value }` | upsert de `livesettingstates` (ex. `hide_scores`) |

Tout autre type est **ignoré volontairement** (`default: break`), ce qui permet d'ajouter des
producteurs sans toucher à ce fichier.

Les `slotKey` sont normalisés en minuscules, les UUID en minuscules sans tirets.

### Événement publié

Le Live publie `EventTypes.PREDICTION_CREATED` (`live.prediction.created`) à chaque vote
enregistré, avec le payload `{ userId, username, teamId, teamName }`.

:::note[Aucun consommateur aujourd'hui]
Le type est déclaré dans les quatre copies du contrat pour qu'un service futur puisse s'y abonner
sans modification du producteur. Il était publié en chaîne littérale suffixée `.v1` jusqu'à la
révision de contrat `2026-08-02.2`, ce qui violait les deux règles de nommage de la page
[Protocoles de communication](../architecture/communication-protocol).
:::

---

## 2. API

### `GET /api/live/leaderboard`

Fusionne les profils et les noms d'équipe issus de MongoDB avec le read-model événementiel.
**Mise en cache Redis 5 secondes** (`EX: 5`) pour absorber les pics de trafic pendant l'événement.

### `GET /api/live/game-status`

Renvoie l'épreuve en cours, sa description, ses modalités, son image, le nom de l'épreuve suivante
et un compte à rebours en secondes.

L'épreuve active et le compte à rebours sont dérivés du calendrier publié, plus d'aucune
constante du code.

### `GET /api/live/schedule`

Renvoie le programme complet, chaque épreuve portant un statut `PAST`, `LIVE` ou `UPCOMING`
calculé au moment de la requête. C'est cette route qui alimente la section calendrier de la page.

:::info[Le calendrier est édité depuis le panel]
Il était auparavant codé en dur dans une constante `GAME_SCHEDULE` de `live-controller.ts` :
changer le planning demandait une modification du code et un redéploiement.

Le panel possède désormais le calendrier dans sa propre base et le publie dans la clé Redis
partagée `le3:calendar:live`. Live la lit à travers `services/calendar-service.ts`, avec un
cache de cinq secondes, le même mécanisme que le garde de maintenance.

**Aucune donnée de repli.** Si Redis est injoignable ou la clé absente, le site affiche un
programme vide. Un planning de secours masquerait une publication ratée, c'est-à-dire
exactement le défaut que cette architecture corrige.
:::

### `POST /api/predictions/vote` · `GET /api/predictions/my-vote`

Pronostic du spectateur sur l'équipe gagnante, protégé par `protect` (session partagée).
La logique valide l'équipe demandée, refuse un second vote, persiste dans `predictions`, déclenche
un **webhook Discord** (`DISCORD_PREDICTION_WEBHOOK_URL`) puis publie l'événement sur le bus.

---

## 3. Intégration Twitch

`TwitchService.start()` est lancé au démarrage, juste après la connexion MongoDB. C'est un worker
de fond qui :

1. obtient un *App Access Token* via le flux **Client Credentials** ;
2. interroge périodiquement l'API **Helix** (`/streams` et `/users`) pour les pseudos Twitch liés ;
3. maintient un cache en mémoire indexé par `twitch_username` en minuscules, contenant le statut
   « en direct » et l'URL de l'avatar.

Le cache est en mémoire : il est reconstruit à chaque redémarrage et n'est pas partagé entre
instances.

---

## 4. Routage frontend

Le Live est servi en **SPA-like** : toute requête ne commençant pas par `/api` renvoie
`index.html`.

```ts
app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(PUBLIC_PATH, 'index.html')));
```

Le frontend tient en trois fichiers : `live-api.ts` (appels réseau), `live-ui.ts` (rendu) et
`utils.ts`.

---

## 5. Session partagée avec le Core

Même cookie `3levent.sid`, même préfixe `le3:sess:`, même TTL de 7 jours, domaine
`.3levent.fr`. Le middleware `protect` du Live est **purement basé sur la session** : il n'accepte
pas de JWT, contrairement à son homonyme du Core.

:::danger[Démarrage fail-fast]
Le Live **refuse de démarrer** si `LE3_SESSION_SECRET` ou `LE3_MONGO_URI` manque : il n'existe
aucun secret de repli. Le Core applique la même règle depuis le 2026-08-01.
:::

---

## 6. Thème sombre

Le Live est la seule application au thème sombre. Ses tokens propres, définis dans
`public/src/input.css`, s'ajoutent à la palette de marque :

| Token | Valeur | Usage |
| :--- | :--- | :--- |
| `--color-live-bg` | `#0f1424` | Fond principal |
| `--color-live-panel` | `#161d31` | Conteneurs et cartes |
| `--color-live-card` | `#202840` | Lignes du classement |
| `--color-live-border` | `#ffffff1a` | Bordures (blanc 10 %) |

Le Live conserve aussi la palette historique complète (`le3-yellow`, `le3-pink`) et les couleurs
sociales réelles des plateformes, là où le Core les a fusionnées. Voir
[Design System](../guidelines/design-system).

---

## 7. Variables d'environnement

| Variable | Rôle |
| :--- | :--- |
| `PORT`, `NODE_ENV` | Serveur (défaut `3001`) |
| `LE3_MONGO_URI` | MongoDB - **obligatoire**, `throw` si absente |
| `REDIS_URL` | Sessions, bus, cache du classement |
| `LE3_SESSION_SECRET` | **Identique au Core** - obligatoire |
| `LE3_COOKIE_DOMAIN` | Domaine du cookie (défaut `.3levent.fr`) |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | API Helix |
| `DISCORD_PREDICTION_WEBHOOK_URL` | Notification des pronostics |

:::note[Deux variables sans le préfixe `LE3_`]
`TWITCH_CLIENT_ID` et `TWITCH_CLIENT_SECRET` échappent à la convention `LE3_` appliquée partout
ailleurs, y compris aux variables Twitch du Core (`LE3_TWITCH_*`). C'est l'état déployé : renommer
ces deux clés est une rupture, elle demande de mettre à jour le coffre Infisical et les conteneurs
en même temps que le code.
:::

Modèle complet et commenté : [`.env.example`](https://github.com/3LEvent/LE3-Web-Live/blob/main/.env.example).

---

### Prochaines étapes

* **[Core Web](./web-core)** · **[Staff Panel](./staff-panel)**
* **[Schéma des données](../architecture/database-schema)**
