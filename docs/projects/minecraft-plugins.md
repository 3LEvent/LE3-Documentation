---
sidebar_position: 5
---

# Plugins Minecraft — `LE3-Plugin-Core`

Le noyau Java de l'événement. Il gère les équipes (en lecture seule), le système de succès par
équipe et par joueur, les menus in-game et la synchronisation avec le site web.

| | |
| :--- | :--- |
| **Dépôt** | `LE3-Plugin-Core` |
| **Artefact Maven** | `fr.le3event.core:LE3CorePlugin` |
| **Nom du plugin** | `LE3CorePlugin` |
| **Classe principale** | `fr.le3event.core.LE3CorePlugin` |
| **Java / API** | Java 21 · Paper `1.21.11-R0.1-SNAPSHOT` (`api-version: 1.21`) |
| **Auteurs** | KiyOni, FrameLeaf |

---

## 1. Stack et dépendances

| Dépendance | Portée | Rôle |
| :--- | :--- | :--- |
| `paper-api` | `provided` | API serveur |
| `HikariCP` 6.2.1 | `compile` (shadée) | Pool de connexions SQL |
| `mysql-connector-j` 9.1.0 | `compile` (shadée) | Pilote MySQL |
| `PlaceholderAPI`, `LuckPerms`, `VaultAPI`, `Citizens`, `MythicMobs`, `slf4j-api` | `provided` | Intégrations optionnelles |

Toutes les dépendances embarquées sont **relocalisées** par le `maven-shade-plugin` sous
`fr.le3event.core.libs.*` afin d'éviter tout conflit de classes avec les autres plugins du
serveur. Les signatures `META-INF/*.SF|DSA|RSA` sont exclues du JAR final.

Le `fmt-maven-plugin` (phase `validate`) applique le **Google Java Style** automatiquement à
chaque build : le formatage n'est pas un sujet de revue de code.

Toutes les intégrations sont en `softdepend` — le plugin démarre et fonctionne sans elles, en
journalisant un avertissement pour chaque hook absent.

---

## 2. Organisation du code

```text
fr.le3event.core
├── LE3CorePlugin.java          # Cycle de vie, getters des managers
├── commands/                   # TeamCommandHandler, AchievementCommandHandler, LE3CoreCommandHandler
├── data/                       # Achievement, Team (POJO)
├── events/                     # Événements Bukkit personnalisés (CustomTeamJoinEvent, …)
├── lib/                        # ToastNotification, AdvancementFrame
├── listeners/
│   ├── MenuListener, PlayerListener, PlayerChatListener
│   └── advancements/           # ~50 listeners, un par type de succès
├── managers/                   # DatabaseManager, TeamManager, AchievementManager, LuckPermsManager
├── menus/                      # AchievementMenu, NPCMenu
└── utils/                      # EventListenerRegistrar, StyledLogger, ColorTranslator, PlaceholdersAPI
```

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
4. **Managers** : `LuckPermsManager`, `TeamManager`, `AchievementManager`.
5. **Synchronisation des équipes depuis le site**, puis chargement des succès.
6. Menus, enregistrement des listeners et des commandes, placeholders.

À l'arrêt : sauvegarde de `data.yml` et fermeture du pool de connexions.

---

## 4. Équipes : le site est la source de vérité

Le plugin **ne crée pas** d'équipes. `TeamManager.syncTeamsFromSite()` effectue un
`GET` sur `api.sync_url` (par défaut `https://3levent.fr/api/plugin/sync-teams`) avec l'en-tête
`x-plugin-secret`, via le `HttpClient` de Java.

Les huit `slotKey` (`red`, `blue`, `orange`, `pink`, `green`, `purple`, `cyan`, `yellow`) sont
déclarés dans `config.yml` sous `team_slots`, chacun avec :

* `display_color_name` — nom coloré affiché in-game ;
* `lp_group` — groupe LuckPerms correspondant (`team1` … `team8`) ;
* `prefix` — préfixe LuckPerms pondéré ;
* `permissions` — permissions cosmétiques attribuées aux membres.

La synchronisation est rejouée sur `/le3core reload` et `/le3core sync`.

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
    effects: ["SPEED:30:1"]
    commands: ["broadcast %player% has completed a challenge!"]
```

### Types de déclencheurs disponibles

Un listener dédié par type, dans `listeners/advancements/`. Une cinquantaine sont enregistrés :

`ARMOR_EQUIP`, `ARROW_SHOOT`, `BLOCK_BREAK`, `BLOCK_MODIFY`, `BLOCK_PLACE`, `BOAT_DISTANCE`,
`BOOK_SIGN`, `BREED`, `BREW_POTION`, `BUCKET_FILL`, `CAMEL_DISTANCE`, `CRAFT`, `EGG_THROW`,
`ELYTRA_FLY`, `ENCHANT`, `ENDER_PEARL_TELEPORT`, `ENTITY_KILL`, `EXTRACT_FROM_ANIMAL`,
`FERTILIZE_PLANTS`, `FIREWORK_LAUNCH`, `FISHING`, `FOOD_CONSUME`, `GAIN_EFFECT`,
`GHAST_DISTANCE`, `HOE_LAND`, `HORSE_DISTANCE`, `ITEM_DROP`, `ITEM_PICKUP`, `JUMP_HEIGHT`,
`LEVEL_ACHIEVE`, `LLAMA_DISTANCE`, `MINECART_DISTANCE`, `PIG_DISTANCE`, `PLAYER_KILL`,
`PLAY_MUSIC_DISC`, `RAID_WIN`, `REPAIR`, `SLEEP`, `SMELT`, `SNEAK_DISTANCE`, `SNOWBALL_THROW`,
`STRIDER_DISTANCE`, `TAME`, `USE_POTION`, `VANILLA`, `VILLAGER_TRADE`, `WALK_DISTANCE`,
`WINDCHARGE_THROW`, `MANUAL`.

Le listener PNJ (`NpcInteractionListener`) n'est enregistré que si **Citizens** est présent.

### Ajouter un type de succès

1. Créer `listeners/advancements/<Nom>Listener.java`.
2. L'enregistrer dans `EventListenerRegistrar.registerListeners()`.
3. Documenter le `type` et ses `arguments` dans l'en-tête de `achievements.yml`.

---

## 6. Persistance

`DatabaseManager` (HikariCP, pool `LE3Core-Pool`, 10 connexions max, timeout 5 s) crée quatre
tables au démarrage : `teams`, `team_achievements`, `player_achievements`, `core_settings`.
Détail : [Schéma des données](../architecture/database-schema).

Deux règles absolues :

* **Toute écriture passe par `Bukkit.getScheduler().runTaskAsynchronously()`.** Aucune requête SQL
  ne s'exécute sur le thread principal.
* Les lectures bloquantes retournent un `CompletableFuture` (`getTeamProgressAsync`,
  `isAchievementCompletedAsync`…). La seule méthode synchrone, `getAllProgressForTeam()`, est
  documentée comme devant être appelée depuis un thread annexe.

Repli automatique sur **SQLite** (`advancementscore.db`) si `database.type` n'est pas `mysql` ou si
les identifiants manquent — pratique en local, à ne jamais laisser en production.

---

## 7. Commandes et permissions

| Commande | Alias | Sous-commandes | Permission de base |
| :--- | :--- | :--- | :--- |
| `/team` | `t`, `teams` | `info`, `list` | `le3core.team.use` (défaut : tous) |
| `/achievement` | `ach`, `success`, `advancements` | `open`, `give`, `add`, `set` | `le3core.achievement.use` (défaut : tous) |
| `/le3core` | `core`, `le3`, `advancementscore`, `acore` | `reload`, `days`, `status`, `sync`, `hidescores` | `le3core.admin.use` (défaut : op) |

Permissions fines : `le3core.team.info|list`, `le3core.achievement.give|add|set|copyid`,
`le3core.achievement.accessday.*`, `le3core.admin.reload|days|status|sync|hidescores`.


---

## 8. Configuration

`config.yml` couvre bien plus que la base de données :

* `general` — chat d'équipe, préfixe, `npc_id` du PNJ Citizens.
* `team_slots` — les huit équipes (voir §4).
* `database` — `type`, `host`, `port`, `database`, `username`, `password`.
* `api` — `sync_url` et `secret` (partagé avec `LE3_PLUGIN_SECRET` côté Core).
* `menu` — emplacements (`slots`), matériaux et **layouts de lore** entièrement paramétrables,
  avec placeholders `%name%`, `%progress%`, `%threshold%`, `%percent%`, `%points%`, `%rewards%`.
* `messages` — tous les messages joueurs, en français, avec codes couleur `&` et hexadécimaux
  `&#RRGGBB`.

---

## 9. Chaîne CI/CD

Cinq workflows sont actifs dans le dépôt :

| Workflow | Déclencheur | Effet |
| :--- | :--- | :--- |
| `build-verify.yml` | push `develop`, PR vers `main`/`develop`/`releases/*`/`hotfix/*` | Appelle `LE3-Shared-Workflows/java-engine.yml` |
| `deploy-dev.yml` | push `develop`, manuel | JAR de dev en artefact GitHub (rétention 7 jours) |
| `publish.yml` | push `main`, manuel | `mvn deploy` vers GitHub Packages, puis resynchronise `develop` sur `main` |
| `release.yml` | tag `v*` | Build de production, checksums SHA-256, Release GitHub |
| `security.yml` | push/PR `main`/`develop` + hebdomadaire | CodeQL `java-kotlin`, requêtes `security-extended` |
| `sync-develop.yml` | push `main`, manuel | Reset dur de `develop` sur `main` (PAT `LE3_SYNC_TOKEN`) |

Détail : [GitHub Actions](../infrastructure/github-actions).

---

## 10. Standards de développement Java

* **Java 21** : `var`, records et pattern matching sont encouragés ; l'API dépréciée de Paper est à
  éviter.
* **Thread safety** : jamais d'appel à l'API Bukkit depuis un thread asynchrone ; utiliser
  `ConcurrentHashMap` pour tout état partagé (comme `pinnedAchievements`).
* **Journalisation** : passer par `StyledLogger` (`info`, `success`, `warn`, `error`) avec des
  messages paramétrés `{0}`, jamais par concaténation.
* **Messages joueurs** : toujours via la section `messages` de `config.yml`, jamais en dur — une
  correction de texte ne doit pas exiger une recompilation.
* **Nullabilité** : annoter avec `@NotNull` les paramètres des méthodes publiques.

---

### Prochaines étapes

* **[Protocoles de communication](../architecture/communication-protocol)**
* **[Snippets de code](../guidelines/code-snippets)**
* **[Gestion des secrets](../infrastructure/secrets-management)**
