---
sidebar_position: 5
---

# Plugins Minecraft - `LE3-Plugin-Core`

Le noyau Java de l'événement. Il gère les équipes (en lecture seule), le système de succès par
équipe et par joueur, les menus in-game, le chat d'équipe, et la synchronisation avec le site web.

| | |
| :--- | :--- |
| **Dépôt** | `LE3-Plugin-Core` |
| **Artefact Maven** | `fr.le3event.core:le3-core-plugin` |
| **Nom du JAR** | `LE3CorePlugin-<version>.jar` |
| **Nom du plugin** | `LE3CorePlugin` |
| **Classe principale** | `fr.le3event.core.LE3CorePlugin` |
| **Java / API** | Java 25 · Paper `26.2.build.98-stable` (`api-version: 26.2`) |
| **Auteurs** | 3LEvent |

---

## 1. Stack et dépendances

| Dépendance | Portée | Rôle |
| :--- | :--- | :--- |
| `paper-api` `26.2.build.98-stable` | `provided` | API serveur |
| `HikariCP` 7.1.0 | `compile` (shadée) | Pool de connexions SQL |
| `mysql-connector-j` 26.7.0 | `compile` (shadée) | Pilote MySQL |
| `jedis` 7.5.3 | `compile` (shadée) | Client Redis : cache partagé et bus d'événements |
| `PlaceholderAPI` 2.12.3 | `provided` | Expansion `%le3_*%` |
| `LuckPerms` 5.5 | `provided` | Groupes, préfixes et permissions d'équipe |
| `VaultAPI` 1.7.1 | `provided` | Économie (récompenses `money`) |
| `Citizens` 2.0.35 | `provided` | PNJ de dépôt d'objets |
| `MythicMobs` 5.13.0 | `provided` | Réservé, pas de code appelant à ce jour |

Toutes les dépendances embarquées sont **relocalisées** par le `maven-shade-plugin` sous
`fr.le3event.core.libs.*` (`libs.hikari`, `libs.mysql`, `libs.jedis`, `libs.pool2`) afin d'éviter
tout conflit de classes avec les autres plugins du serveur. Les signatures
`META-INF/*.SF|DSA|RSA` sont exclues du JAR final.

Le `fmt-maven-plugin` 2.29 (phase `validate`) applique le **Google Java Style** automatiquement à
chaque build : le formatage n'est pas un sujet de revue de code.

Toutes les intégrations sont en `softdepend` : le plugin démarre et fonctionne sans elles, en
journalisant un avertissement pour chaque hook absent.

---

## 2. Organisation du code

```text
fr.le3event.core
├── LE3CorePlugin.java          # Cycle de vie, getters des managers, jour courant, épinglage
├── commands/                   # TeamCommandHandler, AchievementCommandHandler, LE3CoreCommandHandler
├── data/                       # Achievement, Team (POJO)
├── events/                     # CustomAchievementCompleteEvent, CustomAchievementProgressEvent
├── lib/                        # ToastNotification, AdvancementFrame
├── listeners/
│   ├── MenuListener, PlayerListener, PlayerChatListener
│   └── advancements/           # 50 listeners, un par type de succès
├── managers/                   # DatabaseManager, TeamManager, AchievementManager, LuckPermsManager
├── menus/                      # AchievementMenu, NPCMenu
├── redis/                      # EcosystemEvent, EcosystemEventBus, RedisCache, RedisManager, RedisSettings
└── utils/                      # EventListenerRegistrar, StyledLogger, ColorTranslator, PlaceholdersAPI
```

Ressources : `config.yml`, `achievements.yml`, `data.yml`, `plugin.yml`.

### Convention de paquetage pour un nouveau plugin

`fr.le3event.<nom>.{commands,listeners,managers,menus,data,utils}`, dépôt nommé
`LE3-Plugin-<Nom>` en CamelCase.

---

## 3. Séquence de démarrage (`onEnable`)

L'ordre compte : plusieurs étapes dépendent des précédentes.

1. `saveDefaultConfig()`, initialisation de `StyledLogger` et `ToastNotification`.
2. **Stockage fichier** : crée `achievements.yml` (depuis les ressources) et `data.yml`
   (`current_day`, `hide_scores`).
3. **Hooks** : Vault (économie), LuckPerms, puis **base de données**.
4. **Redis** (optionnel) : pool, cache et bus.
5. **Managers** : `LuckPermsManager`, `TeamManager`, `AchievementManager`.
6. **Chargement des succès**, puis **synchronisation des équipes depuis le site**.
7. Construction des menus, enregistrement des listeners, des commandes et des placeholders,
   puis démarrage du souscripteur Redis. Purge du cache du menu des succès.

:::danger[Un échec de base de données arrête `onEnable` immédiatement]
`initializeDatabase()` renvoie `false`, désactive le plugin, et l'appelant **retourne sur-le-champ**.
Tout ce qui suit déréférence le `DatabaseManager` : continuer ne ferait que transformer une erreur
de configuration lisible en cascade de `NullPointerException`.
:::

:::note[Redis, à l'inverse, n'arrête rien]
Une section `redis` mal formée est signalée en `ERROR`, le cache et le bus sont désactivés, et le
serveur démarre quand même. Le plugin fonctionne sur MySQL seul.
:::

:::caution[La synchronisation initiale est bloquante]
`syncTeamsFromSite().join()` bloque le thread principal au démarrage, volontairement : les équipes
doivent être prêtes avant l'arrivée du premier joueur. Si le site est injoignable, le démarrage
est retardé jusqu'au timeout de 10 secondes de la requête HTTP, et aucune équipe n'est chargée.
:::

À l'arrêt (`onDisable`) : sauvegarde de `data.yml`, arrêt du souscripteur Redis, fermeture du pool
Redis puis du pool HikariCP.

---

## 4. Équipes : le site est la source de vérité

Le plugin **ne crée pas** d'équipes et n'en modifie jamais la composition. `TeamManager.syncTeamsFromSite()`
effectue un `GET` sur `api.sync_url` (par défaut `https://3levent.fr/api/plugin/sync-teams`) avec
l'en-tête `x-plugin-secret`, via le `HttpClient` de Java, timeout 10 s.

Les huit `slotKey` d'équipe (`red`, `blue`, `orange`, `pink`, `green`, `purple`, `cyan`,
`yellow`) plus le slot `admin` sont déclarés dans `config.yml` sous `team_slots`, chacun avec :

* `display_color_name` - nom coloré affiché in-game ;
* `lp_group` - groupe LuckPerms correspondant (`team1` … `team8`, `staff`) ;
* `prefix` - préfixe LuckPerms pondéré (ex. `prefix.100.%img_team1% `) ;
* `permissions` - permissions cosmétiques attribuées aux membres (chapeaux, sacs).

:::warning[Le slot `admin` n'est pas optionnel]
`plugin-api-controller.ts` côté Core injecte dans ce slot chaque compte `ADMIN`/`STAFF` ayant lié
un profil Minecraft. Tant qu'il manquait de `config.yml`, la synchronisation écartait tout le
staff avec un simple avertissement, sans erreur visible. Ajouté le 2026-08-02.
:::

À chaque synchronisation, `TeamManager` :

1. remplace intégralement le cache RAM des équipes et de l'appartenance joueur → équipe ;
2. écarte les slots absents de `config.yml`, avec un avertissement ;
3. reformate les UUID Mojang sans tirets en UUID Java canoniques ;
4. crée ou renomme la ligne `teams` correspondante en MySQL (`createTeamAsync`) ;
5. reconstruit le groupe LuckPerms de chaque équipe et déplace les joueurs qui ont changé de slot ;
6. supprime les groupes LuckPerms des slots devenus obsolètes ;
7. recharge les points depuis MySQL (les points sont **locaux**, jamais écrasés par le site) ;
8. invalide le cache Redis de chaque équipe et publie un `team.roster.updated` par équipe.

La synchronisation est rejouée sur `/le3core reload`, sur `/le3core sync`, et à la réception d'un
événement `plugin.teams.snapshot` externe sur le bus (voir §10).

---

## 5. Système de succès

### Structure d'une entrée `achievements.yml`

```yaml
achievement_equip_diamond_helmet:
  name: "Diamond Helmet Equipped"
  description: "Equip a diamond helmet."
  material: "DIAMOND_HELMET"      # icône du menu
  type: "ARMOR_EQUIP"             # type de déclencheur
  arguments: ["DIAMOND_HELMET"]   # paramètres du déclencheur
  threshold: 1                    # seuil de complétion
  points: 5                       # points accordés à l'équipe
  world: "world"                  # monde où le succès est actif
  day: 1                          # jour d'événement
  rewards:                        # section optionnelle
    xp: 100
    money: 50.0                   # nécessite Vault
    items: ["GOLD_INGOT:5", "DIAMOND:1:SHARPNESS_1"]
    effects: ["SPEED:30:1"]       # EFFET:DURÉE_SEC:AMPLIFICATEUR
    commands: ["broadcast %player% has completed a challenge!"]
```

Valeurs par défaut appliquées à la lecture : `material: BARRIER` (et avertissement si le matériau
est invalide ou de l'air), `type: MANUAL`, `threshold: 1`, `points: 0`, `world: world`, `day: 1`.

Une section `general_rewards` de `config.yml` est appliquée **en plus** des récompenses propres au
succès, à chaque complétion.

### Les 50 types de déclencheurs

Un listener dédié par type, dans `listeners/advancements/`. Quarante-neuf sont enregistrés
inconditionnellement par `EventListenerRegistrar` ; le cinquantième (`NpcInteractionListener`)
n'est enregistré que si Citizens est présent.

**Blocs et objets** : `BLOCK_BREAK`, `BLOCK_PLACE`, `BLOCK_MODIFY`, `CRAFT`, `SMELT`, `REPAIR`,
`ENCHANT`, `ITEM_DROP`, `ITEM_PICKUP`, `USE`, `BUCKET_FILL`, `HOE_LAND`, `FERTILIZE_PLANTS`,
`BOOK_SIGN`, `PLAY_MUSIC_DISC`, `FIREWORK_LAUNCH`.

**Combat et entités** : `ENTITY_KILL`, `PLAYER_KILL`, `ARROW_SHOOT`, `SNOWBALL_THROW`,
`EGG_THROW`, `WINDCHARGE_THROW`, `RAID_WIN`, `TAME`, `BREED`, `EXTRACT_FROM_ANIMAL`,
`VILLAGER_TRADE`.

**Consommation et effets** : `FOOD_CONSUME`, `BREW_POTION`, `USE_POTION`, `GAIN_EFFECT`,
`ARMOR_EQUIP`, `LEVEL_ACHIEVE`, `SLEEP`.

**Déplacement** : `WALK_DISTANCE`, `SNEAK_DISTANCE`, `JUMP_HEIGHT`, `ELYTRA_FLY`,
`ENDER_PEARL_TELEPORT`, `BOAT_DISTANCE`, `MINECART_DISTANCE`, `HORSE_DISTANCE`,
`CAMEL_DISTANCE`, `LLAMA_DISTANCE`, `PIG_DISTANCE`, `STRIDER_DISTANCE`, `GHAST_DISTANCE`.

**Autres** : `FISHING`, `VANILLA` (succès vanilla de Minecraft), `NPC_INTERACTION` (dépôt d'objets
auprès d'un PNJ).

Le type `MANUAL` n'a pas de listener : c'est la valeur par défaut, réservée aux succès attribués
uniquement par commande.

:::note[Deux types dépendent d'un plugin tiers]
`NPC_INTERACTION` n'est actif que si **Citizens** est installé : `NpcInteractionListener` n'est
alors pas enregistré, et l'avertissement `[Hook] Citizens not found` est journalisé au démarrage.
Les succès de ce type restent visibles dans le menu, mais rien ne peut les faire progresser.
:::

Plusieurs listeners acceptent des arguments symboliques en plus des matériaux : `*` (joker),
`FULL_DIAMOND` / `FULL_NETHERITE` / `FULL_IRON` / `FULL_GOLD` / `FULL_CHAINMAIL` / `FULL_COPPER`
et les pièces génériques `HELMET`, `CHESTPLATE`, `LEGGINGS`, `BOOTS` pour `ARMOR_EQUIP`.

### Progression, complétion et révocation

`AchievementManager` centralise toute écriture dans `persistProgress()`, qui met à jour les trois
couches dans le même ordre : cache RAM → MySQL → cache Redis. Aucun autre chemin n'écrit la
progression, ce qui garantit que les trois couches ne peuvent pas diverger.

`applyProgressTransition()` gère les deux franchissements de seuil :

* **vers le haut** : le succès est accordé (points de l'équipe, récompenses à chaque membre en
  ligne, notification toast, `CustomAchievementCompleteEvent`) ;
* **vers le bas** (via `/achievement set` à une valeur inférieure) : les points sont **retirés** à
  l'équipe et le crédit joueur est effacé de `player_achievements`.

Un `CustomAchievementProgressEvent` est levé pour chaque membre en ligne à chaque progression
réelle. Les deux événements Bukkit portent le joueur, le succès, l'équipe, et pour la progression
les valeurs avant/après.

### Accès par jour

Un succès dont le `day` est supérieur au jour courant (`/le3core days`) est masqué et non
progressable, **sauf** pour un joueur portant `le3core.achievement.accessday.<jour>`.

### Ajouter un type de succès

1. Créer `listeners/advancements/<Nom>Listener.java`.
2. Ajouter une ligne dans `EventListenerRegistrar.ADVANCEMENT_LISTENERS` (ordre alphabétique).
3. Documenter le `type` et ses `arguments` dans l'en-tête de `achievements.yml`.
4. Ajouter le type à la liste de cette page.

---

## 6. Menus in-game

### Menu des succès (`/achievement`, `/achievement open`)

Inventaire de 54 emplacements, entièrement paramétré par `menu.slots.achievement_menu` et
`menu.materials.achievement_menu`.

| Interaction | Effet |
| :--- | :--- |
| Clic gauche sur un succès | Épingle le succès (`%le3_pinned_*%`) |
| Shift + clic gauche sur un succès | Affiche l'identifiant du succès (permission `le3core.achievement.copyid`) |
| Clic gauche sur un filtre | Valeur suivante |
| Clic droit sur un filtre | Active / désactive le filtre |
| Shift + clic gauche sur un filtre | Réinitialise tous les filtres |
| Flèches de navigation | Page précédente / suivante |

Trois filtres cumulables : **jour**, **monde**, **catégorie** (le type de déclencheur). Les
succès non terminés sont affichés en premier, chaque groupe trié par nom. Un indicateur de
progression globale occupe l'emplacement 49.

Les icônes sont mises en cache par succès, progression, locale du joueur et état du mode glitch,
si bien qu'un item n'est jamais servi périmé. Les états par joueur (filtres, page, cache de
traduction) sont libérés à la déconnexion.

### Menu PNJ (clic droit sur le PNJ Citizens `general.npc_id`)

Ne présente que les succès de type `NPC_INTERACTION` accessibles au jour courant.

| Interaction | Effet |
| :--- | :--- |
| Clic gauche / droit | Dépose **1** objet requis |
| Shift + clic | Dépose **tout** ce que le joueur possède, dans la limite du seuil restant |

Si les `arguments` valent `*`, l'objet déposé est celui tenu en main. Les objets sont retirés
exactement de l'inventaire, et seule l'icône du slot cliqué est reconstruite - pas tout le menu.

Anti-spam : 300 ms entre deux clics dans le menu PNJ, 500 ms sur le PNJ lui-même, 250 à 500 ms sur
les navigations et filtres du menu des succès.

---

## 7. Chat d'équipe

`PlayerChatListener` intercepte `AsyncChatEvent` en priorité `LOW`.

* Un joueur membre d'une équipe voit ses messages **redirigés vers son équipe uniquement**, avec
  le préfixe `general.team_chat_prefix` et son préfixe LuckPerms rendu via PlaceholderAPI.
* Préfixer le message par `!` force la diffusion **globale** : le `!` est retiré et l'événement
  poursuit son chemin normal.
* Un joueur sans équipe parle dans le chat global.
* La fonctionnalité entière se coupe avec `general.enable_team_chat: false`.

---

## 8. Placeholders (`%le3_*%`)

Expansion PlaceholderAPI d'identifiant `le3`, enregistrée uniquement si PlaceholderAPI est présent.

| Placeholder | Renvoie |
| :--- | :--- |
| `%le3_team_name%` · `_id%` · `_points%` · `_members%` · `_achievements%` | Données de l'équipe du joueur |
| `%le3_team_name_<slot>%` · `_points_<slot>%` · `_achievements_<slot>%` · `_teamid_<slot>%` | Données d'une équipe précise |
| `%le3_player_completed%` | Nombre de succès crédités au joueur |
| `%le3_player_completed_<pseudo>%` | Idem pour un autre joueur en ligne |
| `%le3_leaderboard_<n>%` | n-ième équipe du classement, formatée par `messages.leaderboard_entry` |
| `%le3_player_leaderboard_team_<n>%` | n-ième joueur de son équipe |
| `%le3_player_leaderboard_global_<n>%` | n-ième joueur toutes équipes confondues |
| `%le3_pinned_name%` · `_progress%` · `_goal%` · `_status%` | Succès épinglé par le joueur |
| `%le3_total_achievements%` · `%le3_total_points%` | Totaux possibles |
| `%le3_current_day%` | Jour d'événement courant |

:::info[Les compteurs sont lus en RAM, jamais en base]
PlaceholderAPI résout les placeholders **sur le thread principal**. Les compteurs de succès par
joueur sont donc maintenus en mémoire par `AchievementManager` et rafraîchis en une requête
groupée par équipe à chaque synchronisation du roster. Une résolution de placeholder ne déclenche
aucune requête MySQL.
:::

Quand le **mode glitch** est actif (`/le3core hidescores`), tous les scores et les noms des
classements sont préfixés de `&k` (texte brouillé). Le drapeau est persisté dans `data.yml`, dans
`core_settings` en MySQL, et diffusé sur le bus en `plugin.settings.updated`.

---

## 9. Persistance

`DatabaseManager` (HikariCP, pool `LE3Core-Pool`, 10 connexions max, timeout 5 s) crée quatre
tables au démarrage : `teams`, `team_achievements`, `player_achievements`, `core_settings`.
Détail : [Schéma des données](../architecture/database-schema).

Deux règles absolues :

* **Toute écriture passe par `Bukkit.getScheduler().runTaskAsynchronously()`.** Aucune requête SQL
  ne s'exécute sur le thread principal. Si l'ordonnanceur refuse la tâche (plugin en cours de
  désactivation), l'écriture est rejouée en ligne plutôt que perdue silencieusement.
* Les méthodes de lecture synchrones (`getAllProgressForTeam()`,
  `getPlayerAchievementCountsForTeam()`) sont documentées comme devant être appelées depuis un
  thread annexe. Aucune n'est appelée depuis le thread principal.

**MySQL est le seul backend.** Le repli SQLite a été retiré le 2026-08-02 : le pilote
`org.sqlite.JDBC` n'était pas embarqué dans le JAR, donc le repli échouait de toute façon, et un
plugin qui écrit dans une base que ni le Panel ni les sites ne lisent perd chaque score en ayant
l'air de fonctionner. Identifiants absents = refus de démarrer, avec un message explicite.

---

## 10. Redis : cache partagé et bus d'événements

Ajouté le **2026-08-02**. Les deux usages sont **optionnels** : avec `redis.enabled: false`, ou
pendant une panne Redis, le plugin continue de tourner sur MySQL seul. Seule la vue temps réel du
Panel et du Live est perdue.

### Configuration

```yaml
redis:
  enabled: false
  uri: ""                # redis://:password@le3-redis:6379/0  (rediss:// pour TLS)

  # Utilisés seulement si `uri` est vide.
  host: "127.0.0.1"
  port: 6379
  username: ""
  password: ""
  database: 0
  ssl: false

  timeout_ms: 2000
  pool:
    max_size: 8
    min_idle: 1
  cache:
    key_prefix: "le3:core:"
    ttl_seconds: 300       # 0 = pas d'expiration
  pubsub:
    channel: "le3:eventbus"
```

`uri` l'emporte quand elle est renseignée, ce qui permet de coller **exactement** la même valeur
que le `REDIS_URL` des trois applications web. Le schéma `rediss://` force TLS. La forme
`redis://:motdepasse@hote` (sans nom d'utilisateur) est reconnue comme le `requirepass` habituel.

:::danger[Cette valeur doit être identique sur les quatre services]
Une divergence entre le `redis.uri` du plugin et le `REDIS_URL` des applications web ne produit
**aucune erreur au démarrage**. Elle se manifeste par un panel vide en temps réel et un classement
Live figé, des heures plus tard.
:::

:::warning[La section `redis` n'est pas relue par `/le3core reload`]
Rebâtir le pool et le thread d'écoute sous trafic est une reconnexion, pas un rechargement. Un
changement dans cette section demande un **redémarrage du serveur**. Tout le reste de `config.yml`
est bien rechargé à chaud.
:::

### Cache (`RedisCache`)

Write-through, en trois couches : RAM (chemin de lecture chaud) → MySQL (source de vérité) → Redis
(couche tiède partagée). À la connexion d'un joueur, la progression de son équipe est lue depuis
Redis ; en cas de *cache miss*, elle est chargée depuis MySQL puis réécrite dans Redis.

| Clé | Type | Contenu |
| :--- | :--- | :--- |
| `<prefix>team:<slot>:progress` | Hash | `achievement_key` → progression |
| `<prefix>team:<slot>:points` | String | Total de points |

Le cache est vidé équipe par équipe à chaque re-synchronisation du roster, pour qu'un instantané
périmé ne survive jamais à un renommage ou à un vidage d'équipe.

:::danger[Toute méthode de `RedisCache` est réseau]
Elles s'appellent **hors du thread principal**, sans exception, exactement comme une requête SQL.
Une panne Redis dégrade en *cache miss*, jamais en exception : un `Optional` vide signifie
« inconnu », une map vide signifie « connu, sans progression ».
:::

### Bus d'événements (`EcosystemEventBus`)

Le plugin **publie** `team.roster.updated`, `plugin.team.points.updated`,
`plugin.achievement.granted` et `plugin.settings.updated`, et **souscrit** à
`plugin.teams.snapshot`.

:::danger[Piège de rebouclage sur `plugin.teams.snapshot`]
Le Core publie ce type chaque fois qu'il répond à `GET /api/plugin/sync-teams`, et le plugin est
le seul appelant de cet endpoint. Se re-synchroniser à chaque snapshot produirait donc une boucle
infinie : sync → snapshot → sync → …

`TeamManager.wasSyncRequestedRecently()` horodate chaque requête sortante et ignore les snapshots
reçus dans les **30 secondes** qui suivent : ce sont ses propres échos. Un snapshot arrivant hors
de cette fenêtre a été déclenché par quelqu'un d'autre (appel manuel, producteur externe) et
provoque bien une re-synchronisation.
:::

La souscription vit dans un thread démon dédié (`LE3Core-Redis-Subscriber`) : une connexion Redis
souscrite n'accepte plus aucune autre commande. Les reconnexions sont automatiques toutes les
10 secondes. Les handlers sont rappelés **sur le thread principal**, ils peuvent donc toucher
l'API Bukkit sans risque.

Un message qui n'est pas du JSON valide, qui ne valide pas l'enveloppe, ou qui provient du plugin
lui-même (`source.service == "minecraft-plugin"`) est écarté avant d'atteindre un handler.

Chaque enveloppe publiée porte `source.instanceId` = `<nom du serveur>-<port>` et
`source.environment` = `general.environment` du `config.yml`. Mettez cette dernière valeur à
`development` sur un serveur de test, pour que le Panel distingue la télémétrie de préproduction.

L'enveloppe JSON est définie par `fr.le3event.core.redis.EcosystemEvent`, jumelle Java de
`ecosystem-event.ts`, avec la même `CONTRACT_REVISION`. Voir
[Protocoles de communication](../architecture/communication-protocol).

---

## 11. Intégration LuckPerms

`LuckPermsManager` applique un motif *load-modify-save* strict, compatible avec les backends de
stockage asynchrones.

À chaque synchronisation, pour chaque équipe :

1. `createAndLoadGroup(lp_group)` ;
2. `group.data().clear()` - purge complète, pour qu'aucune identité d'une édition précédente ne
   survive ;
3. injection des `permissions` du slot ;
4. injection du `prefix` pondéré ;
5. injection du `DisplayNameNode` avec le nom d'équipe **choisi sur le site** ;
6. héritage de `default` et poids `2` ;
7. `saveGroup()`.

Les joueurs sont ajoutés au groupe de leur slot et retirés de leur ancien groupe s'ils ont changé
d'équipe. Les groupes des slots disparus du roster sont supprimés.

Sans LuckPerms, le plugin fonctionne : seuls les préfixes, les permissions cosmétiques et le
préfixe du chat d'équipe disparaissent.

---

## 12. Commandes et permissions

| Commande | Alias | Sous-commandes | Permission de base |
| :--- | :--- | :--- | :--- |
| `/team` | `t`, `teams` | `info` (ou `members`), `list` | `le3core.team.use` (défaut : tous) |
| `/achievement` | `ach`, `success`, `advancements` | `open`, `give`, `add`, `set` | `le3core.achievement.use` (défaut : tous) |
| `/le3core` | `core`, `le3`, `advancementscore`, `acore` | `reload`, `days`, `status`, `sync`, `hidescores` | `le3core.admin.use` (défaut : op) |

Formes complètes :

```text
/team info                                      # membres de son équipe
/team list                                      # toutes les équipes (le3core.team.list)
/achievement                                    # ouvre le menu
/achievement give <equipe> <id> [joueur]        # accorde le succès, crédite un joueur
/achievement add  <equipe> <id> <montant>       # ajoute de la progression
/achievement set  <equipe> <id> <montant>       # fixe la progression (révoque si en dessous du seuil)
/le3core reload                                 # recharge config, succès, data.yml, roster, caches
/le3core days <n>                               # change le jour d'événement courant
/le3core status                                 # jour, succès chargés, état BDD, version
/le3core sync                                   # resynchronise les équipes depuis le site
/le3core hidescores                             # bascule le mode glitch des scores
```

Permissions fines : `le3core.team.info`, `le3core.team.list`, `le3core.achievement.give|add|set|copyid`,
`le3core.achievement.accessday.<jour>`, `le3core.admin.reload|days|status|sync|hidescores`.

Seule `/team` déclare une complétion de tabulation (`info`, `list`, `members`).

:::info[Préfixe de permission aligné le 2026-08-02]
Le code vérifiait `advancementscore.copyid` et `advancementscore.accessday.<jour>`, deux nœuds qui
n'existaient dans aucun `plugin.yml` : les accorder n'avait donc aucun effet. Tout est désormais
sous le préfixe `le3core.`.
:::

:::caution[`/achievement give` refuse un pseudo inconnu]
Un quatrième argument qui ne correspond à aucun joueur en ligne est traité comme une faute de
frappe, pas comme une demande de créditer l'émetteur : la commande échoue avec
`messages.player_not_found` plutôt que d'attribuer le succès au mauvais joueur.
:::

---

## 13. Configuration

`config.yml` couvre bien plus que la base de données :

| Section | Contenu |
| :--- | :--- |
| `general` | `enable_team_chat`, `team_chat_prefix`, `npc_id` du PNJ Citizens, `environment` (tag des événements du bus) |
| `general_rewards` | Récompenses ajoutées à **chaque** complétion, en plus de celles du succès |
| `team_slots` | Les neuf slots (voir §4) |
| `database` | `host`, `port`, `database`, `username`, `password`. Les trois derniers sont obligatoires |
| `api` | `sync_url` et `secret` (partagé avec `LE3_PLUGIN_SECRET` côté Core) |
| `redis` | Cache partagé et bus d'événements (voir §10) |
| `menu` | `slots`, `materials` et `lore_layouts` entièrement paramétrables |
| `messages` | Tous les messages joueurs, en français, avec codes `&` et hexadécimaux `&#RRGGBB` |

Placeholders disponibles dans les `lore_layouts` : `%name%`, `%description%`, `%current%`,
`%threshold%`, `%percent%`, `%points%`, `%id%`, `%rewards%`, `%reward_xp%`, `%reward_money%`,
`%completed%`, `%total%`, `%type%`, `%value%`.

Les zones d'objets s'écrivent en plages (`"10-16,19-25,28-34,37-43"`), et tout emplacement hors de
`0-53` est remplacé par sa valeur par défaut plutôt que de faire échouer l'ouverture du menu.

`data.yml` porte l'état persistant du serveur : `current_day` et `hide_scores`.

---

## 14. Chaîne CI/CD

Cinq workflows sont actifs dans le dépôt :

| Workflow | Déclencheur | Effet |
| :--- | :--- | :--- |
| `build-verify.yml` | push `develop`, PR vers `main`/`develop`/`releases/*`/`hotfix/*`, manuel | Appelle `LE3-Shared-Workflows/java-engine.yml@main` |
| `deploy-dev.yml` | push `develop`, manuel | JAR de dev en artefact GitHub (rétention 7 jours) |
| `publish.yml` | push `main`, manuel | `mvn deploy` vers GitHub Packages, puis resynchronise `develop` sur `main` |
| `release.yml` | tag `v*` | Build de production, checksums SHA-256, Release GitHub |
| `security.yml` | push/PR `main`/`develop`, cron hebdomadaire, manuel | Semgrep OSS + osv-scanner |

Détail : [GitHub Actions](../infrastructure/github-actions).

---

## 15. Standards de développement Java

* **Java 25** : `var`, records et pattern matching sont encouragés ; l'API dépréciée de Paper est à
  éviter.
* **Thread safety** : jamais d'appel à l'API Bukkit depuis un thread asynchrone ; jamais de SQL,
  de HTTP ou de Redis sur le thread principal. Tout état partagé utilise une `ConcurrentHashMap`.
* **États par joueur indexés par UUID**, jamais par `Player` : une clé `Player` retient l'entité
  entière en mémoire pour toute la durée de vie du serveur après la déconnexion.
* **Journalisation** : passer par `StyledLogger` (`info`, `success`, `warn`, `error`) avec des
  messages paramétrés `{0}`, jamais par concaténation.
* **Messages joueurs** : toujours via la section `messages` de `config.yml`, jamais en dur. Une
  correction de texte ne doit pas exiger une recompilation.
* **Nullabilité** : annoter avec `@NotNull` les paramètres des méthodes publiques.

---

### Prochaines étapes

* **[Protocoles de communication](../architecture/communication-protocol)**
* **[Snippets de code](../guidelines/code-snippets)**
* **[Gestion des secrets](../infrastructure/secrets-management)**
