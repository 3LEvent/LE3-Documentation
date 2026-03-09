---
sidebar_position: 2
---

# Standards de Programmation

Cette page définit les normes de codage obligatoires pour l'écosystème **3LEvent**. Le respect de ces standards est vérifié lors de chaque Pull Request via nos outils d'analyse statique.

---

## 1. Principes Généraux

* **Clarté avant brièveté** : Le code doit être écrit pour être lu par d'autres humains. Évitez les "astuces" de programmation trop complexes.
* **DRY (Don't Repeat Yourself)** : Toute logique répétée plus de deux fois doit être extraite dans une fonction ou une classe utilitaire.
* **KISS (Keep It Simple, Stupid)** : Privilégiez la solution la plus simple et la plus directe.
* **Anglais technique** : Le code (variables, fonctions, classes, commentaires) doit être écrit exclusivement en anglais pour rester cohérent avec les APIs utilisées.

---

## 2. Conventions de Nommage

| Élément | Convention | Exemple |
| :--- | :--- | :--- |
| **Classes / Interfaces** | PascalCase | `TeamManager`, `PlayerService` |
| **Variables / Fonctions** | camelCase | `getPlayerScore()`, `isPlayerOnline` |
| **Constantes** | UPPER_SNAKE_CASE | `MAX_TEAM_SIZE`, `DEFAULT_COOLDOWN` |
| **Fichiers (Web/TS)** | kebab-case | `user-profile.component.ts` |
| **Paquetages (Java)** | lower.case | `fr.le3event.core.utils` |

---

## 3. Standards Java (Plugins Minecraft)

### Gestion de la Version
* Utilisation systématique des fonctionnalités de **Java 21** (ex: Records, Switch Pattern Matching).
* Aucun usage de fonctions "Deprecated" de l'API Paper sauf justification majeure.

### Performance
* **Thread Safety** : Ne jamais accéder à l'API Bukkit/Paper depuis un thread asynchrone (sauf mention explicite dans la doc Paper).
* **IO Operations** : Toutes les écritures/lectures de fichiers ou requêtes SQL doivent être effectuées asynchronement via le `BukkitScheduler` ou un `CompletableFuture`.

---

## 4. Standards TypeScript (Angular / Node.js)

### Typage Strict
* Le type `any` est formellement **interdit**. Si un type est inconnu, utilisez `unknown`.
* Activez le mode `strict` dans le `tsconfig.json`.

### Angular Style Guide
* **Composants** : Logique d'affichage uniquement. La logique métier doit résider dans des **Services**.
* **Observables** : Gérez systématiquement la désinscription (Unsubscribe) pour éviter les fuites de mémoire (utilisez l'opérateur `takeUntil` ou le pipe `async`).

---

## 5. Documentation et Commentaires

### Javadoc / JSDoc
Chaque méthode publique ou interface doit être documentée via les balises standards :
* `@param` : Description de l'argument.
* `@return` : Description de la valeur de retour.
* `@throws` : Conditions de levée d'exception.

### Commentaires de Logique
* Ne commentez pas ce que fait le code (le code doit être explicite), mais **pourquoi** il le fait.
* Supprimez systématiquement le code mort ou commenté avant de soumettre une Pull Request.

---

## 6. Formatage Automatique

Pour éviter les débats sur le style (espaces, accolades, etc.), nous imposons l'utilisation de formateurs automatiques configurés dans nos templates :

1. **Java** : Utilisation du **Google Java Style**. Le plugin Maven `fmt-maven-plugin` vérifie le formatage au build.
2. **TypeScript/Web** : Utilisation de **Prettier** et **ESLint**. Toute erreur de linting bloque la CI.

---

## 7. Gestion des Erreurs

* **Fail Fast** : Validez les entrées au début de vos fonctions et levez des exceptions immédiatement si les conditions ne sont pas remplies.
* **Exceptions Typées** : Évitez de lever des `Exception` ou `Error` génériques. Créez des classes d'exceptions spécifiques (ex: `TeamNotFoundException`).
* **Logs** : Utilisez des niveaux de log appropriés :
    * `INFO` : Événements normaux du cycle de vie.
    * `WARN` : Anomalie récupérable.
    * `ERROR` : Dysfonctionnement nécessitant une intervention.

---

### Prochaines étapes

* **[Consulter les Snippets de Code](../guidelines/code-snippets)**
* **[Guide de contribution et Pull Requests](../workflow/pull-request-process)**