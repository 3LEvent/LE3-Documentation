---
sidebar_position: 3
---

# Live Web - `3levent-live`

Le dashboard temps réel destiné aux spectateurs : classement des équipes, statut des streams
Twitch et pronostics.

| | |
| :--- | :--- |
| **Dépôt** | `3levent-live` |
| **Paquet npm** | `le3-live-server` |
| **Port** | `3001` |
| **Domaine** | `live.3levent.fr` |
| **Base** | MongoDB dédiée (`LE3_DATABASE_URL`) |

Stack, arborescence et scripts : voir [Applications Web](./web-applications).

---

## 1. Principe : un read-model, pas une API cliente

Le Live **n'appelle jamais** l'API du Core et **n'ouvre jamais** la base MySQL du plugin. Il
s'abonne au bus `le3:eventbus` et projette les événements qu'il comprend dans sa propre base
MongoDB (`live-event-consumer.ts`). Le classement est ensuite servi depuis cette projection
locale.

```text
plugin ──HTTP──► Core ──publish──► le3:eventbus ──► live-event-consumer ──► MongoDB Live
                                                                                  │
                                                          GET /api/live/leaderboard
```

Avantage : le Live reste disponible et cohérent même si le Core est indisponible ou si le serveur
Minecraft redémarre.

### Événements consommés

| Type | Payload | Projection |
| :--- | :--- | :--- |
| `plugin.teams.snapshot.v1` | `{ teams: [{ slotKey, name, members }] }` | upsert de `liveteamstates` (nom, points à 0 à la création) |
| `plugin.team.points.updated.v1` | `{ slotKey, points }` | mise à jour des points |
| `plugin.achievement.granted.v1` | `{ uuid, achievementKey?, slotKey? }` | `$inc` sur `liveplayerachievementstates` |
| `plugin.settings.updated.v1` | `{ key, value }` | upsert de `livesettingstates` (ex. `hide_scores`) |

Tout autre type est **ignoré volontairement** (`default: break`), ce qui permet d'ajouter des
producteurs sans toucher à ce fichier.

Les `slotKey` sont normalisés en minuscules, les UUID en minuscules sans tirets.

---

## 2. API

### `GET /api/live/leaderboard`

Fusionne les profils et les noms d'équipe issus de MongoDB avec le read-model événementiel.
**Mise en cache Redis 5 secondes** pour absorber les pics de trafic pendant l'événement.

### `GET /api/live/game-status`

Renvoie l'épreuve en cours selon un calendrier d'événement automatisé.

### `POST /api/predictions/vote` · `GET /api/predictions/my-vote`

Pronostic du spectateur sur l'équipe gagnante, protégé par `protect` (session partagée).
La logique valide l'équipe demandée, refuse un second vote, persiste dans `predictions` puis
déclenche un **webhook Discord** (`DISCORD_PREDICTION_WEBHOOK_URL`).

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
`.3levent.fr`. Le commentaire du code est explicite : *« Doit être identique à l'app
principale »*.

:::danger Fail-fast plus strict que le Core
Contrairement au Core, le Live **refuse de démarrer** si `LE3_SESSION_SECRET` *ou*
`LE3_DATABASE_URL` manque - il n'y a pas de secret de repli. C'est le comportement souhaitable ;
le Core devrait s'aligner dessus.
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
| `LE3_DATABASE_URL` *(ou `MONGO_URI`)* | MongoDB - obligatoire |
| `REDIS_URL` | Sessions, bus, cache du classement |
| `LE3_SESSION_SECRET` *(ou `SESSION_SECRET`)* | **Identique au Core** : obligatoire |
| `LE3_COOKIE_DOMAIN` | Domaine du cookie (défaut `.3levent.fr`) |
| `LE3_JWT_SECRET` | Vérification JWT |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | API Helix |
| `DISCORD_PREDICTION_WEBHOOK_URL` | Notification des pronostics |

:::note Nommage incohérent
Les variables Twitch du Live s'appellent `TWITCH_*` alors que celles du Core suivent la convention
`LE3_TWITCH_*`. À harmoniser lors d'un prochain passage.
:::

---

### Prochaines étapes

* **[Core Web](./web-core)** · **[Staff Panel](./staff-panel)**
* **[Schéma des données](../architecture/database-schema)**
