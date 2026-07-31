---
sidebar_position: 1
---

# Conventions Git

L'organisation 3LEvent utilise une stratégie de gestion de version rigoureuse pour garantir la stabilité du code et la clarté de l'historique. Tous les contributeurs doivent respecter ces conventions avant de soumettre une modification.

---

## 1. Stratégie de Branches

Deux branches permanentes, plus des branches de travail éphémères.

* **`main`** : code stable en production. Aucun commit direct. Un push déclenche la publication
  (GitHub Packages pour le plugin) et la resynchronisation de `develop`.
* **`develop`** : branche d'intégration. Un push y déclenche un build de vérification et un
  artefact de développement téléchargeable.
* **Branches de travail** : créées à partir de `develop` (ou de `main` pour un correctif urgent),
  fusionnées par Pull Request.
* **`releases/*`, `hotfix/*`** : reconnues comme cibles de PR par la CI du plugin.

:::danger `develop` est écrasée à chaque push sur `main`
Les workflows `sync-develop.yml` et `publish.yml` exécutent
`git reset --hard origin/main` puis `git push --force` sur `develop`. **Tout travail présent sur
`develop` et absent de `main` est définitivement perdu.** Ne travaillez jamais directement sur
`develop` : créez toujours une branche `feat/`, `fix/`, etc.
:::

### Nommage des branches
Les branches doivent être nommées selon le format : `type/description-breve` (en minuscules, mots séparés par des tirets).

* `feat/` : Nouvelle fonctionnalité (ex: `feat/systeme-classement`).
* `fix/` : Correction de bug (ex: `fix/latence-calcul-points`).
* `docs/` : Documentation uniquement (ex: `docs/maj-api-java`).
* `refactor/` : Modification du code qui ne change pas le comportement (ex: `refactor/optimisation-queries`).
* `chore/` : Maintenance technique ou mise à jour de dépendances (ex: `chore/npm-update`).

---

## 2. Format des Messages de Commit

Nous suivons la spécification **Conventional Commits**. Un message de commit doit être structuré de la manière suivante :

```text
type(périmètre): description courte en minuscules

```

### Les Types de commit

* **feat** : Ajout d'une fonctionnalité.
* **fix** : Correction d'un bug.
* **docs** : Changement dans la documentation.
* **style** : Mise en forme du code (espaces, virgules, etc. - sans changement logique).
* **refactor** : Amélioration du code existant.
* **perf** : Amélioration des performances.
* **test** : Ajout ou modification de tests.

### Le Périmètre (Scope)

Le périmètre est optionnel mais recommandé. Périmètres usuels de l'écosystème : `core`, `live`,
`panel`, `plugin`, `bus`, `auth`, `db`, `ui`, `infra`, `docs`.

### Exemples de bons commits

* `feat(plugin): ajout du multiplicateur de points de fin de partie`
* `fix(core): correction de l'affichage du profil sur mobile`
* `feat(bus): nouvel événement plugin.quest.completed.v1`
* `docs(readme): mise à jour des instructions d'installation`

---

## 3. Workflow de Contribution

Pour contribuer au projet, suivez scrupuleusement ces étapes :

1. **Synchronisation** : Récupérez les dernières modifications de `develop`.
```bash
git checkout develop
git pull origin develop

```


2. **Création** : Créez votre branche de travail.
```bash
git checkout -b feat/ma-fonctionnalite

```


3. **Commit** : Effectuez des commits fréquents et atomiques (un commit par petite modification logique).
4. **Push** : Envoyez votre branche sur le dépôt distant.
```bash
git push origin feat/ma-fonctionnalite

```


5. **Pull Request** : Ouvrez une Pull Request (PR) sur GitHub pour déclencher la revue de code.

---

## 4. Règles de Fusion (Merging)

* **Squash and Merge** : Nous privilégions le "Squash" lors de la fusion d'une PR. Cela permet de condenser tous les commits de travail en un seul commit propre sur la branche `main`.
* **Revue obligatoire** : Au moins une approbation d'un lead développeur est requise pour fusionner vers `main`.
* **Tests CI** : Le build GitHub Actions doit être au vert (Success) avant toute fusion.

---

## 5. Bonnes Pratiques

* **Ne jamais push de secrets** : clés d'API, mots de passe et identifiants ne doivent jamais être
  commités. Vérifiez que `.env` est bien ignoré **avant** votre premier commit dans un dépôt — ce
  n'est pas le cas partout aujourd'hui, voir
  [Gestion des secrets](../infrastructure/secrets-management).
* **Rebase plutôt que merge** : `git rebase develop` sur votre branche de travail pour rester à
  jour sans commits de fusion parasites.
* **Contrat d'événements** : s'il est modifié, les **trois copies** de `ecosystem-event.ts`
  doivent l'être dans la même PR.
* **Langue** : les messages de commit peuvent être en français ou en anglais, mais la cohérence
  est de mise au sein d'un même dépôt. Le code, lui, est toujours en anglais.

---

### Prochaines étapes

* **[Processus de Pull Request](./pull-request-process.md)**
* **[Standards de programmation](../guidelines/coding-standards.md)**