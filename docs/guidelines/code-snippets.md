---
sidebar_position: 3
---

# Bibliothèque de Snippets

Modèles extraits du code réellement déployé. Copiez ces structures plutôt que d'inventer les
vôtres : elles portent des décisions déjà prises (format de réponse, sécurité, asynchronisme).

---

## 1. Backend TypeScript

### Réponse API standard

Chaque contrôleur définit ce helper en haut de fichier. La duplication est assumée : le format est
un contrat public.

```ts
const sendResponse = (
    res: Response,
    statusCode: number,
    data: unknown = null,
    error: string | null = null
): void => {
    res.status(statusCode).json({
        success: statusCode < 400,
        timestamp: new Date().toISOString(),
        data,
        error: error ? { message: error, code: statusCode } : null
    });
};
```

### Squelette de contrôleur

```ts
/**
 * Endpoint: GET /api/<domaine>/<ressource>
 * Description: ...
 * Security: ...
 */
export const getResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // 1. Sécurité / validation des entrées
        // 2. Accès aux données (Mongoose, MySQL…)
        const data = await Model.find().lean();

        // 3. Réponse
        sendResponse(res, 200, data);
    } catch (error) {
        console.error('[LE3-API] Critical Error while fetching resource:', error);
        next(error);   // délègue au gestionnaire d'erreurs global
    }
};
```

### Route avec permission (Panel)

```ts
import { requireAuth, requirePermission } from '../middleware/auth.js';

router.get('/tables', requireAuth, requirePermission('MANAGE_DATABASE'), dbEditorCtrl.listTables);

// Protection d'un routeur entier
router.use(requireAuth, requirePermission('MANAGE_IAM'));
```

### Route avec rôle (Core)

```ts
import { requireAuth } from '../utils/helpers.js';
import { authorize } from '../middleware/auth.js';

router.get('/stats', requireAuth, authorize('STAFF', 'ADMIN'), adminCtrl.getDashboardStats);
```


### Authentification par secret partagé

```ts
import { secureCompare } from '../utils/secure-compare.js';

const isPluginAuthenticated = (req: Request): boolean => {
    const pluginSecret = req.headers['x-plugin-secret'];
    const expectedSecret = process.env.LE3_PLUGIN_SECRET;
    return typeof pluginSecret === 'string'
        && typeof expectedSecret === 'string'
        && secureCompare(pluginSecret, expectedSecret);
};
```

`secureCompare` effectue une comparaison à **temps constant**. Un `===` sur un jeton laisse fuiter
sa longueur et son préfixe par mesure du temps de réponse.

---

## 2. Bus d'événements

### Publier

```ts
import { createEcosystemEvent } from '../events/ecosystem-event.js';

const bus = req.app.locals.eventBus;

if (bus) {
    void bus.publish(createEcosystemEvent({
        type: 'plugin.teams.snapshot.v1',
        aggregate: { type: 'plugin-sync', id: 'teams' },
        payload: { teams: payload },
        source: {
            service: 'core-web',
            instanceId: process.env.HOSTNAME || 'core'
        }
    })).catch((error) => {
        console.error('[LE3-BUS] Failed to publish team snapshot event:', error);
    });
}
```

Trois règles visibles dans ce fragment : la publication ne bloque pas la réponse HTTP (`void` +
`.catch`), le bus peut être absent (on teste), et l'enveloppe passe **toujours** par
`createEcosystemEvent`.

### Consommer

```ts
export const startMyConsumer = async (bus: RedisEventBus): Promise<void> => {
    await bus.subscribe(async (event: EcosystemEventEnvelope) => {
        try {
            switch (event.type) {
                case 'plugin.team.points.updated.v1':
                    await handleTeamPointsUpdated(event.payload as PluginTeamPointsPayload);
                    break;
                default:
                    // Type inconnu : ignoré volontairement, pour que d'autres
                    // producteurs puissent être ajoutés sans toucher ce fichier.
                    break;
            }
        } catch (error) {
            console.error(`[LE3-BUS] Failed to handle ${event.type}:`, error);
        }
    });
};
```

### Projection idempotente

```ts
await LiveTeamState.updateOne(
    { slot_key: payload.slotKey.toLowerCase() },
    {
        $set: { points: payload.points },
        $setOnInsert: { name: payload.slotKey }
    },
    { upsert: true }
);
```

Un événement rejoué doit produire le même état. `$set` pour ce que l'événement fait autorité,
`$setOnInsert` pour les valeurs de création uniquement.

---

## 3. Modèle Mongoose

```ts
import { Schema, model } from 'mongoose';
import type { Types, HydratedDocument, InferSchemaType } from 'mongoose';

const TeamCacheSchema = new Schema({
    slot_key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    points: { type: Number, default: 0 },
    member_count: { type: Number, default: 0 }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

TeamCacheSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

export type ITeamCache = InferSchemaType<typeof TeamCacheSchema> & { _id: Types.ObjectId };
export type TeamCacheDocument = HydratedDocument<ITeamCache>;

export const TeamCache = model<ITeamCache>('TeamCache', TeamCacheSchema);
```

Le type est **dérivé** du schéma avec `InferSchemaType` : une interface écrite à la main finit
toujours par diverger.

### Journal borné (capped)

```ts
}, {
    capped: { size: 25 * 1024 * 1024, max: 50_000 },
    timestamps: { createdAt: true, updatedAt: false }
});
```

Empreinte disque bornée, sans tâche de purge.

---

## 4. Frontend TypeScript

### Appel API avec session

```ts
export const apiFetch = async <T>(url: string, options: RequestInit = {}): Promise<StandardResponse<T>> => {
    const response = await fetch(url, {
        credentials: 'include',        // indispensable : cookie de session
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
    return response.json() as Promise<StandardResponse<T>>;
};
```

### Avatar joueur avec repli

```ts
export const getUserAvatarURL = (user: BaseUser | null): string => {
    if (user && user.mc_uuid) {
        return `https://mc-heads.net/avatar/${user.mc_uuid}/100`;
    }
    return 'https://mc-heads.net/avatar/MHF_Steve/100';
};
```

Le repli est doublé côté HTML par un `onerror` : `mc-heads.net` peut répondre 404 pour un UUID
valide mais inconnu.

---

## 5. Java / Paper

### Écriture SQL asynchrone

```java
public void modifyTeamPointsAsync(@NotNull String teamId, int pointsDelta) {
    Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
        var sql = "UPDATE teams SET points = points + ? WHERE id = ?";
        try (var conn = getConnection(); var stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, pointsDelta);
            stmt.setString(2, teamId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            StyledLogger.error("[Database] Failed to modify points for slot {0}.", teamId);
        }
    });
}
```

### Lecture asynchrone avec `CompletableFuture`

```java
public CompletableFuture<Integer> getTeamProgressAsync(@NotNull String teamId, @NotNull String key) {
    CompletableFuture<Integer> future = new CompletableFuture<>();
    Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
        var sql = "SELECT progress FROM team_achievements WHERE team_id = ? AND achievement_key = ?";
        try (var conn = getConnection(); var stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, teamId);
            stmt.setString(2, key);
            try (var rs = stmt.executeQuery()) {
                if (rs.next()) {
                    future.complete(rs.getInt("progress"));
                    return;
                }
            }
        } catch (SQLException e) {
            StyledLogger.error("[Database] Progress retrieval failed: {0}", e.getMessage());
        }
        future.complete(0);   // valeur de repli : le future se complète toujours
    });
    return future;
}
```

Un `CompletableFuture` qui ne se complète jamais gèle l'appelant : prévoyez systématiquement le
chemin d'échec.

### Upsert compatible MySQL et SQLite

```java
var sql = isMysql
    ? "INSERT INTO core_settings (setting_key, setting_value) VALUES (?, ?) "
      + "ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
    : "INSERT INTO core_settings (setting_key, setting_value) VALUES (?, ?) "
      + "ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value";
```

### Appel HTTP vers l'API du site

```java
public CompletableFuture<Void> syncTeamsFromSite() {
    return CompletableFuture.runAsync(() -> {
        var apiUrl = plugin.getConfig().getString("api.sync_url");
        var apiSecret = plugin.getConfig().getString("api.secret", "CHANGE_ME");

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("x-plugin-secret", apiSecret)
                .timeout(Duration.ofSeconds(10))   // toujours borner un appel réseau
                .GET()
                .build();
        // ... vérifier response.statusCode(), puis le champ "success" de l'enveloppe
    });
}
```

### Texte coloré (Adventure, pas MiniMessage)

Le plugin utilise le `LegacyComponentSerializer` d'Adventure via `ColorTranslator`, avec les codes
`&` et hexadécimaux `&#RRGGBB` - **pas** MiniMessage.

```java
// Message lu depuis config.yml, jamais écrit en dur
var raw = plugin.getConfig().getString("messages.achievement_granted");
player.sendMessage(ColorTranslator.translateColors(player, raw
        .replace("%achievement_name%", achievement.getName())
        .replace("%team_name%", team.getName())));
```

`translateColors` applique aussi les placeholders PlaceholderAPI quand le plugin est présent, et
retire l'italique par défaut des composants. Variantes disponibles : `stripColors`,
`getStripped`, `toPlainText`.

### Journalisation

```java
StyledLogger.success("[Core] Plugin enabled successfully - Version {0}", getPluginMeta().getVersion());
StyledLogger.warn("[Hook] Vault not found. Economy features are disabled.");
StyledLogger.error("[Database] Failed to initialize tables: {0}", e.getMessage());
```

Messages paramétrés `{0}` (`MessageFormat`), jamais de concaténation.

---

## 6. Configuration YAML d'un succès

```yaml
achievement_equip_diamond_helmet:
  name: "Diamond Helmet Equipped"
  description: "Equip a diamond helmet."
  material: "DIAMOND_HELMET"
  type: "ARMOR_EQUIP"
  arguments: ["DIAMOND_HELMET"]
  threshold: 1
  points: 5
  world: "world"
  day: 1
  rewards:
    xp: 100
    money: 50.0                                  # nécessite Vault
    items: ["GOLD_INGOT:5", "DIAMOND:1:SHARPNESS_1"]
    effects: ["SPEED:30:1"]                      # EFFET:DURÉE_SEC:AMPLIFICATEUR
    commands: ["broadcast %player% has completed a challenge!"]
```

---

### Prochaines étapes

* **[Standards de programmation](./coding-standards)**
* **[Protocoles de communication](../architecture/communication-protocol)**
