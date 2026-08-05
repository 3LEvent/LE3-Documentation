---
sidebar_position: 1
---

# Conventions Git

L'organisation 3LEvent applique une stratégie de gestion de version stricte pour garantir la
stabilité du code et la clarté de l'historique.

:::danger[Aucune protection de branche n'est active sur les dépôts privés]
Ce n'est pas un oubli : sur le plan GitHub Free, les *rulesets* et la protection de branche ne
sont pas disponibles pour un dépôt privé. Rien n'empêche techniquement de pousser sur `main`, de
fusionner une PR rouge ou de forcer un `push --force`. La CI affiche un état, elle ne bloque rien.

**Tout ce qui suit n'est appliqué que par la discipline de celui qui contribue.** C'est la seule
protection qui existe. Seul `LE3-Documentation`, public, dispose d'un ruleset.
:::

---

## 1. Stratégie de branches

Deux branches permanentes, plus des branches de travail éphémères.

```text
develop  ──┬─→  feat/ma-fonctionnalite  ──PR──→  develop  ──PR──→  main
           │
           └─→  fix/correctif-urgent    ──PR──→  main
```

* **`main`** : code stable en production. Aucun commit direct. Un push y déclenche la publication
  (GitHub Packages pour le plugin) et la resynchronisation de `develop`.
* **`develop`** : branche d'intégration. Un push y déclenche un build de vérification et un
  artefact de développement téléchargeable.
* **Branches de travail** : créées à partir de `develop`, ou de `main` pour un correctif urgent,
  fusionnées par Pull Request.
* **`releases/*`, `hotfix/*`** : reconnues comme cibles de PR par la CI du plugin.

`LE3-Shared-Workflows` et `.github` n'ont que `main`.

:::danger[`develop` est écrasée à chaque publication du plugin]
Le workflow `publish.yml` exécute `git reset --hard origin/main` puis `git push --force`
sur `develop` après chaque publication. **Tout travail présent sur `develop` et absent de `main`
est définitivement perdu.** Ne travaillez jamais directement sur `develop` : créez toujours une
branche `feat/`, `fix/`, etc.
:::

### Nommage des branches

Format `type/description-breve`, en minuscules, mots séparés par des tirets.

| Préfixe | Usage | Exemple |
| :--- | :--- | :--- |
| `feat/` | Nouvelle fonctionnalité | `feat/systeme-classement` |
| `fix/` | Correction de bug | `fix/latence-calcul-points` |
| `docs/` | Documentation uniquement | `docs/maj-api-java` |
| `refactor/` | Modification sans changement de comportement | `refactor/optimisation-queries` |
| `chore/` | Maintenance technique, dépendances | `chore/npm-update` |
| `perf/` | Performance | `perf/cache-leaderboard` |
| `test/` | Tests | `test/contrat-bus` |

---

## 2. Format des messages de commit

**Conventional Commits**, obligatoire.

```text
type(périmètre): description courte en minuscules
```

### Types

`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.

### Périmètres usuels

`core`, `live`, `panel`, `plugin`, `bus`, `auth`, `db`, `ui`, `infra`, `docs`, `deps`.

Le corps du commit explique le **pourquoi**, pas le **quoi** : le diff dit déjà quoi.

### Exemples

* `feat(plugin): add end-game points multiplier`
* `fix(core): correct profile rendering on mobile`
* `feat(bus): add plugin.quest.completed event type`
* `docs(readme): update installation instructions`

:::info[Le code est en anglais, la documentation d'équipe en français]
Identifiants, commentaires **et messages de commit** sont rédigés en anglais technique. Seules la
documentation destinée à l'équipe et les chaînes affichées aux joueurs ou au staff sont en
français.
:::

---

## 3. Workflow de contribution

1. **Synchronisation** : récupérez les dernières modifications de `develop`.

```bash
git checkout develop
git pull origin develop
```

2. **Création** : créez votre branche de travail.

```bash
git checkout -b feat/ma-fonctionnalite
```

3. **Commit** : commits fréquents et atomiques, un par modification logique.
4. **Push** : envoyez votre branche.

```bash
git push origin feat/ma-fonctionnalite
```

5. **Pull Request** : ouvrez la PR sur GitHub pour déclencher la revue.

---

## 4. Règles de fusion

* **Squash and Merge** : les commits de travail sont condensés en un seul commit propre.
* **Revue** : au moins une approbation avant fusion vers `main`.
* **CI verte** : le build GitHub Actions doit être au vert. Rien ne l'impose techniquement, voir
  l'avertissement en tête de page.
* **Nettoyage** : supprimez la branche immédiatement après la fusion.

---

## 5. Les trois règles qui coûtent cher quand elles sont oubliées

### Le contrat du bus d'événements

`backend/events/ecosystem-event.ts` existe en **quatre copies identiques**, dans `LE3-Web-Main`,
`LE3-Web-Live`, `LE3-Web-Panel` et `LE3-Discord-Admin`, plus une copie Java dans le plugin
(`fr.le3event.core.redis.EcosystemEvent`).

Si vous le modifiez, vous modifiez **les cinq**, copie Java comprise, dans la même PR, et vous
incrémentez `CONTRACT_REVISION`.

Ces copies ont déjà divergé une fois. La divergence n'a cassé aucun build : elle a simplement fait
que les événements émis par le Panel étaient typés `unknown` par les deux autres services. Un test
de contrat existe désormais dans chaque dépôt pour rendre l'écart visible.

```bash
md5 repos/LE3-Web-*/backend/events/ecosystem-event.ts   # une seule empreinte attendue
```

### Trois secrets à ne jamais désynchroniser

| Secret | Doit être identique entre |
| :--- | :--- |
| `LE3_SESSION_SECRET` | `LE3-Web-Main` et `LE3-Web-Live` |
| `LE3_PLUGIN_SECRET` ↔ `api.secret` | `LE3-Web-Main` et le plugin |
| `REDIS_URL` ↔ `redis.uri` | les quatre services |

Une divergence **ne provoque aucune erreur au démarrage**. Elle se manifeste par des joueurs
déconnectés en changeant de sous-domaine, une synchronisation d'équipes en `401`, ou un panel qui
n'affiche plus rien en temps réel.

### Ne jamais supprimer du code « qui a l'air inutilisé »

Avant toute suppression, vérifiez :

1. les références dans **tous** les dépôts de l'organisation, pas seulement le courant ;
2. que ce n'est pas une API publique, un point d'entrée, ou du code appelé par réflexion, par
   configuration ou par la CI ;
3. que ce n'est pas lu par déstructuration : `const { MA_VARIABLE } = process.env` n'apparaît pas
   dans une recherche de `process.env.MA_VARIABLE`.

En cas de doute : vous ne supprimez pas, vous listez dans la PR.

---

## 6. Bonnes pratiques

* **Ne jamais pousser de secret** : clés d'API, mots de passe et identifiants ne doivent jamais
  être commités. Vérifiez que `.env` est bien ignoré **avant** votre premier commit dans un dépôt.
  Voir [Gestion des secrets](../infrastructure/secrets-management).
* **Rebase plutôt que merge** : `git rebase develop` sur votre branche de travail pour rester à
  jour sans commits de fusion parasites.

---

### Prochaines étapes

* **[Processus de Pull Request](./pull-request-process)**
* **[Standards de programmation](../guidelines/coding-standards)**
