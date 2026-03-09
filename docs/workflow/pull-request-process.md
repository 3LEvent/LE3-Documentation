---
sidebar_position: 2
---

# Processus de Pull Request

Toute modification du code source, de la configuration ou de la documentation doit passer par une Pull Request (PR). Ce processus garantit la qualité du code, la sécurité de l'infrastructure et le partage de connaissances au sein de l'équipe 3LEvent.

---

## 1. Prérequis avant l'ouverture

Avant de soumettre une Pull Request, le contributeur doit s'assurer que les points suivants sont validés localement :

1.  **Build** : Le projet compile sans erreur (`npm run build` ou `gradle build`).
2.  **Linting** : Le code respecte les standards de formatage (`npm run lint` ou `checkstyle`).
3.  **Tests** : Tous les tests unitaires existants passent avec succès.
4.  **Documentation** : Si une fonctionnalité est ajoutée ou modifiée, la documentation correspondante a été mise à jour.

---

## 2. Ouverture de la Pull Request

### Titre de la PR
Le titre doit suivre la convention des commits définie dans les [Conventions Git](./git-conventions.md).
*Exemple : `feat(web): implémentation du système de notification temps réel`*

### Description
Utilisez le template par défaut (s'il existe) ou fournissez les informations suivantes :
* **Quoi** : Résumé des changements.
* **Pourquoi** : Contexte ou lien vers un ticket/issue.
* **Comment tester** : Étapes pour vérifier le bon fonctionnement.

---

## 3. Le Cycle de Revue

Une fois la PR ouverte, le workflow suivant s'enclenche :

### Analyse Automatique (CI)
Le pipeline **GitHub Actions** lance automatiquement un build de vérification.
> Une PR ne peut pas être fusionnée si le build CI est en échec (rouge).

### Revue par les Pairs
Chaque PR nécessite au moins une approbation d'un autre développeur (ou d'un lead développeur selon la criticité).

| Statut de la Revue | Signification | Action requise |
| :--- | :--- | :--- |
| **Approved** | Le code est validé. | La PR peut être fusionnée. |
| **Changes Requested** | Des corrections sont nécessaires. | Le contributeur doit appliquer les retours et redemander une revue. |
| **Comment** | Questions ou suggestions mineures. | Discussion ouverte entre le contributeur et le reviewer. |

---

## 4. Application des Retours

Si des changements sont demandés :
1.  Appliquez les corrections directement sur votre branche de fonctionnalité.
2.  Push les nouveaux commits (ils apparaîtront automatiquement dans la PR).
3.  Utilisez le bouton "Resolve conversation" sur GitHub une fois le point traité.
4.  Une fois tous les retours appliqués, prévenez le reviewer pour une validation finale.

---

## 5. Fusion (Merge)

Une fois la PR approuvée et le build CI au vert :

* **Méthode de fusion** : Nous utilisons le **Squash and Merge**. Tous les commits de la PR seront condensés en un seul commit propre sur la branche `main`.
* **Nettoyage** : La branche de fonctionnalité doit être supprimée immédiatement après la fusion pour maintenir le dépôt propre.

---

## 6. Post-Fusion

Après la fusion dans `main` :
1.  Le déploiement continu vers l'environnement de staging ou de production est déclenché automatiquement.
2.  Vérifiez que vos changements sont correctement reflétés sur le site ou le serveur.
3.  En cas de bug critique détecté après fusion, une procédure de *Revert* sera lancée.

---

### Prochaines étapes

* **[Consulter les Conventions Git](./git-conventions.md)**
* **[Standards de programmation](../guidelines/coding-standards.md)**