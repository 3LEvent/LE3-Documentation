---
sidebar_position: 3
---

# Protocoles de Communication

Cette page définit **tous** les canaux par lesquels les services du 3LEvent échangent des données.
Il n'en existe pas d'autre : aucun service n'ouvre la base d'un autre, aucun n'importe son code.

---

## 1. Les canaux, en une table

| Canal | Producteurs | Consommateurs | Transport |
| :--- | :--- | :--- | :--- |
| **Bus d'événements** | Core, Panel, Plugin (via relais) | Core, Live, Panel | Redis Pub/Sub, canal `le3:eventbus` |
| **API Plugin** | Plugin Minecraft | Core | HTTPS + en-tête `x-plugin-secret` |
| **API navigateur** | Frontends `public/js/*.ts` | Core, Live, Panel | `fetch` + cookie de session |
| **Flux temps réel** | Panel | Navigateurs staff | SSE (`GET /api/dashboard/stream`) |
| **Drapeaux partagés** | Panel | Core, Live | Clés Redis `le3:maintenance:*` |

---

## 2. Bus d'événements (Redis Pub/Sub)

### Enveloppe standard

Toute publication sur `le3:eventbus` est un JSON respectant `EcosystemEventEnvelope`
(`backend/events/ecosystem-event.ts`). Les messages qui ne valident pas
`isEcosystemEventEnvelope()` sont ignorés avec un avertissement.

```json
{
  "eventId": "6f1c2f2e-...",
  "type": "plugin.team.points.updated.v1",
  "version": 1,
  "occurredAt": "2026-07-31T15:30:00.000Z",
  "source": {
    "service": "minecraft-plugin",
    "instanceId": "survival-01",
    "environment": "production"
  },
  "aggregate": { "type": "team", "id": "red" },
  "correlationId": "1b0f...",
  "causationId": null,
  "payload": { "slotKey": "red", "points": 420 }
}
```

| Champ | Règle |
| :--- | :--- |
| `eventId` | UUID unique. Sert de clé d'idempotence côté Core (index unique). |
| `type` | `<domaine>.<entité>.<action>[.v<n>]`. Voir le catalogue ci-dessous. |
| `version` | Version du *payload*. Incrémentée sur toute rupture de compatibilité. |
| `source.service` | `minecraft-plugin`, `core-web`, `live-web`, `panel-web`, `discord-bot`, `unknown`. |
| `aggregate` | Entité concernée : `{ type, id }`. Permet le regroupement et le rejeu. |
| `correlationId` | Identifie une chaîne d'actions. Généré si absent. |
| `causationId` | `eventId` de l'événement déclencheur, ou `null`. |

Utilisez toujours la fabrique `createEcosystemEvent()` plutôt que de construire l'objet à la main :
elle remplit `eventId`, `occurredAt`, `environment` et `correlationId` avec les bonnes valeurs par
défaut.

### Contrat dupliqué : règle d'or

`ecosystem-event.ts` existe en trois exemplaires (Core, Live, Panel) et **doit rester compatible
sur le fil**. Les copies ne sont pas identiques : le Panel ajoute `panel-web` et l'énumération
`EventTypes`, le Core ajoute `EVENT_LOG_COLLECTION`.

### Catalogue des types d'événements

**Télémétrie du plugin → écosystème** (relayée par le Core) :

| Type | Payload | Consommé par |
| :--- | :--- | :--- |
| `plugin.teams.snapshot.v1` | `{ teams: [{ slotKey, name, members[] }] }` | Live (read-model équipes) |
| `plugin.team.points.updated.v1` | `{ slotKey, points }` | Live (classement) |
| `plugin.achievement.granted.v1` | `{ uuid, achievementKey?, slotKey? }` | Live (compteur joueur) |
| `plugin.settings.updated.v1` | `{ key, value }` | Live (réglages, ex. `hide_scores`) |

**Télémétrie serveur → Panel** (constantes `EventTypes` du panel) :

| Type | Payload | Effet |
| :--- | :--- | :--- |
| `server.metrics.heartbeat` | `{ tps, mspt, cpuLoad, ramUsedMb, ramMaxMb, playersOnline }` | Persisté dans `servermetrics` + diffusé en SSE |
| `log.entry.created` | `{ level, message, meta? }` | Persisté dans `serverlogs` + SSE + alerte Discord si `ERROR`/`CRITICAL` |
| `achievement.progress.updated` | `{ teamId, achievementId, progress, threshold, completed }` | Met à jour `teamachievementprogresses` |
| `achievement.granted` | idem | idem |
| `team.roster.updated` | `{ slotKey, name, points, memberCount, lpGroup? }` | Met à jour `teamcaches` |

**Commandes Panel → plugin** (déclarées, pas encore émises) :

`achievement.grant.requested`, `achievement.progress.set.requested`,
`achievement.progress.add.requested`.

### Règle de tolérance

Chaque consommateur ignore explicitement les types qu'il ne connaît pas
(`default: break` dans le `switch`). C'est ce qui permet d'ajouter un producteur ou un
consommateur sans toucher aux services existants.

### Persistance et idempotence

Le Core abonne `startEventLogConsumer` au bus et écrit chaque enveloppe dans la collection
`event_bus_events` via un `updateOne(..., { upsert: true })` sur `event_id`. Une erreur de clé
dupliquée (`11000`) est traitée comme un succès : elle signifie qu'une autre instance a déjà
persisté l'événement. Le journal est donc sûr en scaling horizontal.

---

## 3. API Plugin (HTTP, secret partagé)

Le plugin Minecraft est le seul client de ces deux routes, montées sous `/api/plugin` sur le Core.
Elles ne sont **pas** protégées par session : l'authentification repose sur l'en-tête
`x-plugin-secret`, comparé à `process.env.LE3_PLUGIN_SECRET` avec `secureCompare()` (comparaison à
temps constant, protection contre les attaques temporelles).

### `GET /api/plugin/sync-teams`

Renvoie la composition des équipes telle que définie **sur le site**. C'est la source de vérité :
le plugin gère les équipes en lecture seule.

* Le nom d'équipe du site est traduit en `slotKey` du plugin via `TEAM_SLOT_MAP`
  (`Requins Rouges` → `red`, `Bélier Bleus` → `blue`, …).
* Les comptes `ADMIN` et `STAFF` ayant lié leur compte Minecraft sont injectés dans l'équipe
  `admin`, **sauf** s'ils appartiennent déjà à une équipe de tournoi (pas de transfert).
* En effet de bord, la réponse est aussi publiée sur le bus en `plugin.teams.snapshot.v1`, ce qui
  met à jour le Live automatiquement.

```json
{
  "success": true,
  "timestamp": "2026-07-31T15:30:00.000Z",
  "data": [
    { "slotKey": "red", "name": "Requins Rouges", "members": ["<uuid>", "..."] }
  ],
  "error": null
}
```

Côté plugin, `TeamManager.syncTeamsFromSite()` est appelé au démarrage (bloquant, avant l'arrivée
des joueurs), au `/le3core reload` et au `/le3core sync`.

### `POST /api/plugin/events`

Relais du plugin vers le bus. Deux formes de corps sont acceptées :

1. **Enveloppe complète** validée par `isEcosystemEventEnvelope()` → republiée telle quelle.
2. **Forme courte** `{ type, aggregateType, aggregateId, payload, instanceId }` → complétée par
   `createEcosystemEvent()` avec `source.service: 'minecraft-plugin'`.

Réponse `202 Accepted` :

```json
{
  "success": true,
  "data": { "accepted": true, "channel": "le3:eventbus", "eventId": "...", "type": "..." }
}
```

Codes d'erreur : `401` (secret invalide ou absent), `503` (bus indisponible).

---

## 4. Format de réponse des API

Toutes les API des trois applications renvoient la même enveloppe, y compris le gestionnaire
d'erreurs global (`app.use((err, req, res, next) => ...)`) quand le chemin commence par `/api/`.

```json
{
  "success": true,
  "timestamp": "2026-07-31T15:30:00.000Z",
  "data": { },
  "error": null
}
```

En erreur, `success` est `false`, `data` est `null` et `error` vaut
`{ "message": "...", "code": <statut HTTP> }`.

| Statut | Signification |
| :--- | :--- |
| `200` / `201` | Succès |
| `202` | Événement accepté et publié sur le bus |
| `401` | Session absente/expirée, ou secret plugin invalide |
| `403` | Authentifié mais permission insuffisante (`requirePermission`) |
| `404` | Ressource introuvable |
| `503` | Bus d'événements indisponible, ou site en maintenance |

Hors `/api/`, une erreur renvoie la page d'accueil (`index.html` sur Core et Live,
`login.html` sur le Panel) avec le code HTTP correspondant.

---

## 5. Flux temps réel du Panel (SSE)

Le panel n'utilise **pas** de WebSocket pour son dashboard : il expose un flux
**Server-Sent Events** sur `GET /api/dashboard/stream`, protégé par
`requirePermission('VIEW_DASHBOARD', 'VIEW_LOGS')`.

Architecture volontairement économe : **une seule** souscription Redis par processus
(`telemetry-consumer.ts`) alimente un `RealtimeHub` in-process (un `EventEmitter`) qui diffuse à
tous les onglets connectés. Ouvrir dix onglets ne crée pas dix souscriptions Redis.

```text
Redis le3:eventbus ──► telemetry-consumer ──► realtimeHub ──┬──► onglet staff #1 (SSE)
                              │                             ├──► onglet staff #2 (SSE)
                              ├──► MongoDB (servermetrics)  └──► onglet staff #3 (SSE)
                              └──► webhook Discord (si ERROR/CRITICAL)
```

Le service Pterodactyl (`pterodactyl-service.ts`) alimente le **même** hub et les mêmes
collections quand il est configuré, de sorte que la provenance des métriques est transparente
pour le frontend.

---

## 6. Drapeaux Redis partagés (maintenance)

Le mode maintenance est piloté par site depuis le CMS du panel et transite **uniquement** par
Redis — aucun appel HTTP entre le panel et les sites publics.

| Clé Redis | Lue par |
| :--- | :--- |
| `le3:maintenance:main` | `3levent` (`createMaintenanceGuard`) |
| `le3:maintenance:live` | `3levent-live` (`createMaintenanceGuard`) |

Au démarrage, le panel appelle `primeMaintenanceKeys()` qui recopie l'état persisté en MongoDB
vers Redis, puis journalise l'état résultant. C'est ce log qui confirme, au boot, que le panel et
les sites publics parlent bien au même Redis :

```text
[LE3-PANEL] Maintenance synchronisée → 3levent: OFF, 3levent-live: OFF
```

---

## 7. Ajouter un nouvel événement

1. Choisir un `type` suivant `<domaine>.<entité>.<action>.v<n>`.
2. Le déclarer dans les trois copies du contrat si le Panel doit l'utiliser (constante
   `EventTypes`), sinon la chaîne littérale suffit côté producteur.
3. Publier via `createEcosystemEvent()` — jamais un objet construit à la main.
4. Ajouter un `case` dans le consommateur concerné. Ne rien changer chez les autres : ils
   ignoreront le type inconnu.
5. Documenter le type et son payload dans le catalogue de cette page.

---

### Prochaines étapes

* **[Schéma des données](./database-schema)**
* **[Authentification et sessions](./authentication)**
* **[Vue d'ensemble](./overview)**
