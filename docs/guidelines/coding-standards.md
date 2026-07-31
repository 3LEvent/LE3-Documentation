---
sidebar_position: 2
---

# Standards de Programmation

Ces règles sont dérivées du code réellement déployé. Elles sont ce qu'un reviewer vérifiera.

---

## 1. Principes

* **Clarté avant brièveté.** Le code est lu bien plus souvent qu'il n'est écrit.
* **Anglais technique dans le code** — identifiants, commentaires, logs. Les messages destinés aux
  joueurs et au staff sont en **français**.
* **Fail fast.** Valider les prérequis au démarrage et lever immédiatement. Les trois serveurs
  `throw` si une variable critique manque, et `process.exit(1)` si la base est injoignable.
* **Commenter le pourquoi, pas le quoi.** Les meilleurs commentaires de la base expliquent un
  choix : pourquoi le contrat d'événements est dupliqué, pourquoi la session du panel dure 8 h,
  pourquoi les pages privées sont déclarées avant `express.static`.

---

## 2. Nommage

| Élément | Convention | Exemple |
| :--- | :--- | :--- |
| Fichiers TypeScript | kebab-case, suffixe par rôle | `plugin-api-controller.ts`, `team-cache-model.ts`, `auth-routes.ts` |
| Classes, interfaces, types | PascalCase | `RedisEventBus`, `EcosystemEventEnvelope` |
| Variables, fonctions | camelCase | `getTeamsForPlugin`, `isPluginAuthenticated` |
| Constantes | UPPER_SNAKE_CASE | `EVENT_CHANNEL`, `PANEL_PERMISSIONS`, `TEAM_SLOT_MAP` |
| Champs Mongoose | snake_case | `team_id`, `authentik_sub`, `mc_uuid` |
| Types d'événements | `<domaine>.<entité>.<action>.v<n>` | `plugin.team.points.updated.v1` |
| Paquetages Java | lower.case | `fr.le3event.core.managers` |
| Dépôts | `LE3-<Type>-<Nom>` | `LE3-Plugin-Core`, `LE3-App-DiscordBot` |

Suffixes obligatoires côté backend : `-controller`, `-routes`, `-model`, `-service`, `-consumer`.
Côté frontend : `-handler` pour un script de page, `utils.ts` pour le partagé.

---

## 3. TypeScript

### Modules ESM

Les paquets déclarent `"type": "module"` et compilent en `NodeNext`. **Tout import relatif se
termine par `.js`**, y compris depuis un fichier `.ts` :

```ts
import connectDB from './config/db-config.js';
import { createEcosystemEvent } from '../events/ecosystem-event.js';
import type { Request, Response, NextFunction } from 'express';
```

Oublier le `.js` compile mais casse à l'exécution : `ERR_MODULE_NOT_FOUND`.

Le `top-level await` est autorisé et utilisé (connexion Redis, connexion Mongo).

### Typage

* `any` **interdit**. Utiliser `unknown` puis restreindre.
* Importer les types avec `import type` (`verbatimModuleSyntax` est à `false`, mais la séparation
  reste la règle).
* Écrire un *type guard* plutôt que de caster : `isEcosystemEventEnvelope()` est le modèle à
  suivre pour toute donnée entrant dans le système.
* Le mode strict complet est actif (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noUnusedLocals`…). Un accès indexé renvoie `T | undefined` : traitez le cas.

### Structure d'un contrôleur

```ts
export const doSomething = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // 1. Sécurité / validation
        // 2. Accès aux données
        // 3. Réponse via le helper standard
        sendResponse(res, 200, data);
    } catch (error) {
        console.error('[LE3-API] Contexte de l\'erreur:', error);
        next(error);   // délègue au gestionnaire global
    }
};
```

Chaque contrôleur définit son helper `sendResponse` local produisant l'enveloppe standard
(`success`, `timestamp`, `data`, `error`). C'est une duplication assumée : le format est un
contrat public, pas un détail d'implémentation.

### Journalisation

Préfixe entre crochets identifiant le sous-système : `[LE3-API]`, `[LE3-BUS]`, `[LE3-AUTH]`,
`[LE3-PANEL]`, `[LE3-REDIS]`, `[SYSTEM ERROR]`, `[CRITICAL]`. Ce préfixe est ce qui rend les logs
filtrables dans la console du panel.

---

## 4. Java (plugins)

### Version et style

* **Java 21** : `var`, records et pattern matching encouragés.
* Formatage imposé par `fmt-maven-plugin` (Google Java Style) en phase `validate`. Le style n'est
  pas un sujet de revue.
* `@NotNull` sur les paramètres des méthodes publiques.

### Thread safety — la règle qui casse un serveur

:::danger Ne jamais appeler l'API Bukkit depuis un thread asynchrone
Et symétriquement : **jamais** de requête SQL ou d'appel HTTP sur le thread principal. Toute
écriture passe par `Bukkit.getScheduler().runTaskAsynchronously(plugin, ...)`, toute lecture
bloquante renvoie un `CompletableFuture`.
:::

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

Tout état partagé entre threads utilise une structure concurrente (`ConcurrentHashMap`).

### Journalisation

Passer par `StyledLogger` (`info`, `success`, `warn`, `error`) avec des messages paramétrés
`{0}`, `{1}` — jamais de concaténation.

### Messages joueurs

Toujours dans la section `messages` de `config.yml`, jamais en dur. Une correction de texte ne
doit jamais exiger une recompilation.

---

## 5. Sécurité

* **Aucun secret dans le code ni dans un fichier commité.** Lecture via `process.env` (Node) ou
  variable d'environnement (Java), avec échec explicite si absent.
* **Comparer les secrets en temps constant** : `secureCompare()` côté Node. Un `===` sur un jeton
  ouvre une attaque temporelle.
* **Valider avant d'utiliser un identifiant SQL** : l'éditeur du panel valide le nom de table
  *et* de colonne contre une liste blanche avant d'interpoler. Les valeurs restent en requête
  préparée.
* **Re-vérifier les autorisations côté serveur** sur chaque route. Ce que masque l'interface
  n'est jamais une garantie.
* **Mettre à jour la CSP** en même temps qu'on ajoute une ressource externe.

---

## 6. Gestion des erreurs

* Rattraper, journaliser avec contexte, puis `next(error)` : le gestionnaire global uniformise la
  réponse (JSON sous `/api/`, HTML sinon).
* Traiter explicitement les erreurs attendues plutôt que de les avaler. Modèle :
  `isDuplicateKeyError()` du consumer d'événements, qui distingue une course entre instances d'une
  vraie panne.
* Un consommateur d'événements ne doit **jamais** planter sur un type inconnu : `default: break`.

---

## 7. Documentation dans le code

Chaque fichier commence par un en-tête indiquant le service, le rôle et les standards :

```ts
/**
 * LE3-Panel-Server - Telemetry Consumer
 * Subscribes to the shared Redis event bus and reacts to ecosystem events:
 * persists metrics/logs, updates progress caches, and broadcasts to the
 * realtime hub (SSE). Also triggers Discord webhook alerts on critical logs.
 * Standards: TypeScript 5.x, ESM
 */
```

Les méthodes publiques et les endpoints sont documentés en JSDoc/Javadoc (`@param`, `@return`,
`@throws`), et les routeurs Express annotent chaque route avec son niveau d'accès.

---

## 8. Avant d'ouvrir une Pull Request

1. `npm run build` (ou `mvn clean package`) passe.
2. `npm run lint` passe.
3. Le contrat d'événements est **synchronisé dans les trois copies** s'il a été touché.
4. La documentation est mise à jour si un comportement, une variable d'environnement ou un
   endpoint a changé.
5. Aucun secret, aucun `console.log` de debug, aucun code mort.

:::caution Pas de filet de tests
`npm test` n'est pas implémenté sur les applications web. Un build vert ne prouve **rien** sur le
comportement : testez manuellement le chemin que vous modifiez, et décrivez comment le rejouer
dans la description de la PR.
:::

---

### Prochaines étapes

* **[Bibliothèque de snippets](./code-snippets)**
* **[Processus de Pull Request](../workflow/pull-request-process)**
