---
sidebar_position: 5
---

# Processus de Pull Request

Le processus de Pull Request (PR) est le pilier de la qualité logicielle du **3LEvent**. Il permet de garantir que chaque modification respecte les standards de l'organisation, ne provoque pas de régression et reste cohérente avec les autres modules (Minecraft, Web, Discord).

---

## 1. Prérequis avant l'ouverture

Avant de soumettre une Pull Request, le développeur doit s'assurer que les conditions suivantes sont remplies :

* **Synchronisation** : La branche de travail doit être à jour avec la branche `develop` du dépôt concerné.
* **Normalisation** : Le code doit passer le linting et le formatage automatique (Prettier/ESLint pour le Web/TS, Checkstyle pour Java).
* **Build Local** : Le projet doit compiler sans erreur en local (`mvn clean install` pour Java ou `npm run build` pour Angular/Node.js).
* **Secrets** : Aucun secret ou configuration locale ne doit être inclus. Utilisez exclusivement les variables d'environnement définies dans l'organisation.

---

## 2. Convention de Nommage

Pour faciliter la lecture de l'historique et l'automatisation des changelogs, le titre de la PR doit suivre la convention **Conventional Commits** :

| Préfixe | Description | Exemple |
| :--- | :--- | :--- |
| `feat:` | Ajout d'une nouvelle fonctionnalité | `feat: ajout du système de cosmétiques` |
| `fix:` | Correction d'un bug | `fix: correction du cooldown des perles` |
| `refactor:` | Modification du code sans changement de comportement | `refactor: optimisation du chargement des chunks` |
| `docs:` | Modification de la documentation | `docs: mise à jour du readme de l'api` |
| `ci:` | Modification des workflows GitHub Actions | `ci: ajout d'un secret de déploiement` |

---

## 3. Structure de la Description

Toute Pull Request doit être documentée via le template standard de l'organisation. Une description claire réduit le temps de revue.

> **Contenu attendu :**
> 1. **Description** : Résumé concis des modifications.
> 2. **Impact** : Liste des modules affectés (ex: Impacte le plugin Core et l'API Web).
> 3. **Tests effectués** : Description des tests manuels ou automatisés réalisés.

---

## 4. Cycle de Revue et Validation

### Intégration Continue (CI)
Dès l'ouverture de la PR, le dépôt `LE3-Shared-Workflows` déclenche automatiquement une série de vérifications :
* Vérification de la compilation.
* Analyse statique du code.
* Validation des dépendances.

**Une PR ne peut être fusionnée si l'un de ces checks est en échec.**

### Revue par les pairs
* **Approbation requise** : Au moins une approbation d'un lead développeur ou d'un pair est nécessaire.
* **Commentaires** : Les commentaires doivent être constructifs et porter sur l'optimisation, la sécurité ou la conformité aux guidelines de design.

---

## 5. Fusion (Merge)

Une fois la PR approuvée et les tests validés :

1.  **Méthode** : Utilisez prioritairement le **Squash and Merge**. Cela permet de garder un historique de la branche principale (`main` ou `develop`) propre en regroupant tous les commits de la branche de travail en un seul.
2.  **Nettoyage** : La branche de fonctionnalité doit être supprimée immédiatement après la fusion.
3.  **Déploiement** : La fusion vers `develop` entraîne automatiquement un déploiement sur l'environnement de staging (Cloudflare Pages ou Serveur de test).

---

## 6. Cas particuliers : Corrections urgentes (Hotfix)

Pour les corrections critiques durant l'événement :
* La PR peut être fusionnée directement vers `main` après validation rapide d'un administrateur.
* Une synchronisation inverse vers `develop` doit être effectuée immédiatement après pour éviter toute divergence.