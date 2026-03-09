---
sidebar_position: 1
---

# Conventions Git

L'organisation 3LEvent utilise une stratégie de gestion de version rigoureuse pour garantir la stabilité du code et la clarté de l'historique. Tous les contributeurs doivent respecter ces conventions avant de soumettre une modification.

---

## 1. Stratégie de Branches

Nous utilisons une variante simplifiée du **GitHub Flow**.

* **Branche main** : Contient le code stable en production. Aucun commit direct n'est autorisé.
* **Branches de fonctionnalités** : Toute modification doit être effectuée dans une branche isolée créée à partir de `main`.

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

Le périmètre est optionnel mais recommandé pour cibler la partie du projet impactée (ex: `web`, `plugin`, `db`, `ui`).

### Exemples de bons commits

* `feat(plugin): ajout du multiplicateur de points de fin de partie`
* `fix(web): correction de l'affichage du profil sur mobile`
* `docs(readme): mise à jour des instructions d'installation`

---

## 3. Workflow de Contribution

Pour contribuer au projet, suivez scrupuleusement ces étapes :

1. **Synchronisation** : Récupérez les dernières modifications de `main`.
```bash
git checkout main
git pull origin main

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

* **Ne jamais push de secrets** : Clés d'API, mots de passe et identifiants de base de données ne doivent jamais être commit. Utilisez les fichiers `.env` ou les GitHub Secrets.
* **Rebase vs Merge** : Privilégiez `git rebase main` sur votre branche de fonctionnalité pour rester à jour et éviter les commits de fusion inutiles.
* **Langue** : Les messages de commit peuvent être rédigés en français ou en anglais, mais la cohérence est de mise au sein d'un même dépôt.

---

### Prochaines étapes

* **[Processus de Pull Request](./pull-request-process.md)**
* **[Standards de programmation](../guidelines/coding-standards.md)**