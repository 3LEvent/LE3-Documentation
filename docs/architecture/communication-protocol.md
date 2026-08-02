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
| **Bus d'événements** | Plugin, Core, Live | Plugin, Core, Live, Panel | Redis Pub/Sub, canal `le3:eventbus` |
| **API Plugin** | Plugin Minecraft | Core | HTTPS + en-tête `x-plugin-secret` |
| **API navigateur** | Frontends `public/js/*.ts` | Core, Live, Panel | `fetch` + cookie de session |
| **Flux temps réel** | Panel | Navigateurs staff | SSE (`GET /api/dashboard/stream`) |
| **Drapeaux partagés** | Panel | Core, Live | Clés Redis `le3:maintenance:*` |
| **Cache partagé** | Plugin | Écosystème | Clés Redis `le3:core:team:*` |

---

## 2. Bus d'événements (Redis Pub/Sub)

### Enveloppe standard

Toute publication sur `le3:eventbus` est un JSON respectant `EcosystemEventEnvelope`
(`backend/events/ecosystem-event.ts`). Les messages qui ne valident pas
`isEcosystemEventEnvelope()` sont ignorés avec un avertissement.

```json
{
  "eventId": "6f1c2f2e-...",
  "type": "plugin.team.points.updated",
  "version": 1,
  "occurredAt": "2026-08-02T15:30:00.000Z",
  "source": {
    "service": "minecraft-plugin",
    "instanceId": "craftbukkit-25565",
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
| `eventId` | UUID unique. Sert de clé d'idempotence côté Core (index unique sur `event_id`). |
| `type` | `<domaine>.<entité>.<action>`. **Jamais** de suffixe de version. Voir le catalogue ci-dessous. |
| `version` | Version du *payload*. Incrémentée sur toute rupture de compatibilité. |
| `source.service` | `minecraft-plugin`, `core-web`, `live-web`, `panel-web`, `discord-bot`, `unknown`. |
| `source.instanceId` | Identifiant de l'instance émettrice. Côté plugin : `<nom serveur>-<port>`. |
| `source.environment` | `production`, `development`… Côté plugin, vient de `general.environment` du `config.yml`. |
| `aggregate` | Entité concernée : `{ type, id }`. Permet le regroupement et le rejeu. |
| `correlationId` | Identifie une chaîne d'actions. Généré si absent. |
| `causationId` | `eventId` de l'événement déclencheur, ou `null`. |

Utilisez toujours la fabrique `createEcosystemEvent()` (TypeScript) ou `EcosystemEvent.envelope()`
(Java) plutôt que de construire l'objet à la main : elles remplissent `eventId`, `occurredAt`,
`environment` et `correlationId` avec les bonnes valeurs par défaut.

:::danger Pas de suffixe `.v<n>` dans le type
La version vit **uniquement** dans le champ `version` de l'enveloppe. Deux endroits pour la même
information finissent toujours par se contredire. Les types `plugin.*` ont perdu leur suffixe
`.v1` le 2026-08-02 ; tout code qui en écrit un ne recevra jamais rien.
:::

### Contrat dupliqué : règle d'or

`ecosystem-event.ts` existe en trois exemplaires (Core, Live, Panel) et les copies doivent rester
**identiques au caractère près**, pas seulement compatibles. Un test de contrat
(`ecosystem-event.test.ts`, lui aussi dupliqué à l'identique, 17 tests Vitest) fige la liste des
`EventTypes` : toute modification appliquée à un seul dépôt fait échouer la CI des deux autres.

Vérification manuelle :

```bash
md5 repos/LE3-Web-{Main,Live,Panel}/backend/events/ecosystem-event.ts
# une seule empreinte attendue
```

Le plugin Minecraft porte la même définition en Java
(`fr.le3event.core.redis.EcosystemEvent`) : elle doit être modifiée dans la même pull request, et
`CONTRACT_REVISION` incrémenté des deux côtés. Révision courante : **`2026-08-02.2`**.

### Catalogue des types d'événements

Tous les types sont déclarés dans `EventTypes` (TypeScript) et `EcosystemEvent.Types` (Java).
**Aucun producteur ni consommateur ne doit utiliser une chaîne littérale** : une faute de frappe y
produit un consommateur qui ne reçoit jamais rien, sans la moindre erreur.

**Publiés par le plugin Minecraft**, directement sur Redis :

| Constante | Type | Payload | Consommé par |
| :--- | :--- | :--- | :--- |
| `TEAM_ROSTER_UPDATED` | `team.roster.updated` | `{ slotKey, name, points, memberCount, lpGroup }` | Panel (`teamcaches`) |
| `TEAM_POINTS_UPDATED` | `plugin.team.points.updated` | `{ slotKey, points }` | Live (classement) |
| `PLAYER_ACHIEVEMENT_GRANTED` | `plugin.achievement.granted` | `{ uuid, achievementKey, slotKey }` | Live (compteur joueur) |
| `SETTING_UPDATED` | `plugin.settings.updated` | `{ key, value }` | Live (réglages, ex. `hide_scores`) |

`TEAM_ROSTER_UPDATED` et `TEAM_POINTS_UPDATED` sont émis par `TeamManager` à chaque
synchronisation et à chaque variation de score. `PLAYER_ACHIEVEMENT_GRANTED` est émis par
`AchievementManager` quand un joueur est crédité. `SETTING_UPDATED` est émis par
`LE3CorePlugin.setHideScoresEnabled()`.

**Publié par le Core** :

| Constante | Type | Payload | Consommé par |
| :--- | :--- | :--- | :--- |
| `TEAM_SNAPSHOT_PUBLISHED` | `plugin.teams.snapshot` | `{ teams: [{ slotKey, name, members[] }] }` | Live (read-model équipes), **plugin** (re-synchronisation, hors auto-écho) |

:::warning Boucle de rebouclage sur `plugin.teams.snapshot`
Ce type est publié en réponse à `GET /api/plugin/sync-teams`, dont le plugin est le seul appelant.
Se re-synchroniser à chaque snapshot produirait une boucle infinie : sync → snapshot → sync → …

`TeamManager.wasSyncRequestedRecently()` horodate chaque requête sortante et ignore les snapshots
reçus dans les **30 secondes** qui suivent : ce sont ses propres échos. Un snapshot arrivant hors
de cette fenêtre a été déclenché par quelqu'un d'autre et provoque bien une re-synchronisation.
:::

**Télémétrie serveur → Panel** :

| Constante | Type | Effet |
| :--- | :--- | :--- |
| `METRICS_HEARTBEAT` | `server.metrics.heartbeat` | Persisté dans `servermetrics` + diffusé en SSE |
| `LOG_ENTRY_CREATED` | `log.entry.created` | Persisté dans `serverlogs` + diffusé en SSE |

**Publié par le Live** :

| Constante | Type | Payload | Consommé par |
| :--- | :--- | :--- | :--- |
| `PREDICTION_CREATED` | `live.prediction.created` | `{ userId, username, teamId, teamName }` | aucun consommateur |

:::note Un type sans consommateur reste un type du contrat
Il est déclaré dans les quatre copies pour qu'un service futur puisse s'y abonner sans toucher au
producteur. Jusqu'à la révision `2026-08-02.2` il était publié en chaîne littérale suffixée `.v1`,
en violation des deux règles ci-dessus.
:::

:::info Types supprimés le 2026-08-02
Les types `achievement.progress.updated`, `achievement.granted` et les trois commandes
`achievement.*.requested` ont été retirés du contrat. Les succès sont attribués **uniquement**
dans le plugin ; le Panel n'en est plus qu'un annuaire en lecture seule, et plus aucun service ne
consommait ces types.
:::

### Auto-filtrage

Un service ne réagit jamais à ses propres événements : ils reviennent sur le même canal, et les
traiter produirait une boucle. Côté plugin, `EcosystemEventBus.dispatch()` compare
`source.service` à `EcosystemEvent.SERVICE_NAME` et laisse tomber le message avant même de
chercher un handler.

### Règle de tolérance

Chaque consommateur ignore explicitement les types qu'il ne connaît pas
(`default: break` dans le `switch`). C'est ce qui permet d'ajouter un producteur ou un
consommateur sans toucher aux services existants.

### Persistance et idempotence

Le Core abonne `startEventLogConsumer` au bus et écrit chaque enveloppe dans la collection
`eventlogs` (modèle `EventLog`) via un `updateOne(..., { upsert: true })` sur `event_id`. Une
erreur de clé dupliquée (`11000`) est traitée comme un succès : elle signifie qu'une autre
instance a déjà persisté l'événement. Le journal est donc sûr en scaling horizontal.

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
* En effet de bord, la réponse est aussi publiée sur le bus en `plugin.teams.snapshot`, ce qui
  met à jour le Live automatiquement.

```json
{
  "success": true,
  "timestamp": "2026-08-02T15:30:00.000Z",
  "data": [
    { "slotKey": "red", "name": "Requins Rouges", "members": ["<uuid>", "..."] }
  ],
  "error": null
}
```

Côté plugin, `TeamManager.syncTeamsFromSite()` est appelé au démarrage (bloquant, avant l'arrivée
des joueurs), au `/le3core reload`, au `/le3core sync`, et à la réception d'un
`plugin.teams.snapshot` externe.

### `POST /api/plugin/events`

Relais HTTP vers le bus, pour un producteur qui n'a **pas** d'accès direct à Redis.

Le plugin ne l'utilise plus depuis le 2026-08-02 : il publie directement sur Redis. L'endpoint est
conservé pour les deux cas où il reste la seule voie possible : un plugin déployé sans accès
Redis, et tout producteur externe futur.

Deux formes de corps sont acceptées :

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
  "timestamp": "2026-08-02T15:30:00.000Z",
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
                              ├──► MongoDB (serverlogs)
                              └──► MongoDB (teamcaches, sur team.roster.updated)
```

Le service Pterodactyl (`pterodactyl-service.ts`) alimente le **même** hub et les mêmes
collections quand il est configuré, de sorte que la provenance des métriques est transparente
pour le frontend.

---

## 6. Drapeaux Redis partagés (maintenance)

Le mode maintenance est piloté par site depuis le CMS du panel et transite **uniquement** par
Redis. Aucun appel HTTP entre le panel et les sites publics.

| Clé Redis | Lue par |
| :--- | :--- |
| `le3:maintenance:main` | `LE3-Web-Main` (`createMaintenanceGuard`) |
| `le3:maintenance:live` | `LE3-Web-Live` (`createMaintenanceGuard`) |

Au démarrage, le panel appelle `primeMaintenanceKeys()` qui recopie l'état persisté en MongoDB
vers Redis, puis journalise l'état résultant. C'est ce log qui confirme, au boot, que le panel et
les sites publics parlent bien au même Redis :

```text
[LE3-PANEL] Maintenance synchronised -> 3levent: OFF, 3levent-live: OFF
```

---

## 7. Cache Redis partagé (`le3:core:team:*`)

Écrit en *write-through* par le plugin, lisible par n'importe quel service sans ouvrir la base
MySQL du plugin.

| Clé | Type | Contenu | TTL |
| :--- | :--- | :--- | :--- |
| `le3:core:team:<slot>:progress` | Hash | `achievement_key` → progression | 300 s |
| `le3:core:team:<slot>:points` | String | Total de points de l'équipe | 300 s |

Le préfixe est configurable (`redis.cache.key_prefix`), le TTL aussi
(`redis.cache.ttl_seconds`, `0` désactive l'expiration). Le TTL n'est qu'un filet de sécurité
contre une clé périmée ayant survécu à un crash : la source de vérité reste MySQL, et une clé
absente est un simple *cache miss*.

Le cache est invalidé équipe par équipe à chaque re-synchronisation du roster
(`RedisCache.invalidateTeam()`), pour qu'un instantané périmé ne survive jamais au renommage ou au
vidage d'une équipe.

---

## 8. Ajouter un nouvel événement

1. Choisir un `type` suivant `<domaine>.<entité>.<action>`. **Pas de suffixe `.v<n>`** : la
   version vit dans le champ `version` de l'enveloppe.
2. Le déclarer dans `EventTypes`, dans les **trois** copies du contrat, et dans
   `EcosystemEvent.Types` côté plugin. Incrémenter `CONTRACT_REVISION` dans la même PR.
3. Mettre à jour `ecosystem-event.test.ts` dans les trois dépôts : le test fige la liste des types.
4. Publier via `createEcosystemEvent()` ou `EcosystemEvent.envelope()`, jamais un objet construit
   à la main.
5. Ajouter un `case` dans le consommateur concerné. Ne rien changer chez les autres : ils
   ignoreront le type inconnu.
6. Documenter le type et son payload dans le catalogue de cette page.

---

### Prochaines étapes

* **[Schéma des données](./database-schema)**
* **[Authentification et sessions](./authentication)**
* **[Vue d'ensemble](./overview)**
