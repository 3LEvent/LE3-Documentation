---
sidebar_position: 2
---

# Processus de Pull Request

Toute modification du code source, de la configuration ou de la documentation passe par une Pull
Request. Ce processus garantit la qualité du code, la sécurité de l'infrastructure et le partage
de connaissances au sein de l'équipe.

:::warning Aucune règle de ce document n'est appliquée par GitHub
Le plan Free ne permet pas de protection de branche sur un dépôt privé : ni revue obligatoire, ni
CI bloquante, ni interdiction de push direct. Tout ce qui suit repose sur la discipline. Voir
[Conventions Git](./git-conventions).
:::

---

## 1. Prérequis avant l'ouverture

Avant de soumettre une Pull Request, le contributeur valide localement :

1. **Build** : `npm run build` (web, documentation) ou `mvn clean package` (plugin), sans erreur.
2. **Lint** : `npm run lint`. Pour le plugin, `fmt-maven-plugin` reformate automatiquement au
   build ; commitez le résultat.
3. **Tests** : `npm test`. Les trois applications web ont une suite Vitest de 17 tests.
4. **Vérification manuelle** : rejouez le chemin que vous avez modifié et décrivez la procédure
   dans la PR.
5. **Documentation** : mise à jour si un comportement, une variable d'environnement, un endpoint
   ou un type d'événement a changé.
6. **Contrat du bus** : si `ecosystem-event.ts` est touché, les **quatre copies TypeScript et la
   copie Java** sont synchronisées dans la même PR, avec `CONTRACT_REVISION` incrémenté.

Pour la documentation, `npm run build` est indispensable : `onBrokenLinks: 'throw'` fait échouer
le build sur le moindre lien interne cassé.

---

## 2. Ouverture de la Pull Request

### Titre

Le titre suit la convention des commits définie dans les [Conventions Git](./git-conventions).

*Exemple : `feat(panel): add per-role filtering on resource links`*

### Description

Le dépôt `.github` de l'organisation fournit un modèle de PR appliqué automatiquement aux dépôts
privés. À défaut, fournissez :

* **Quoi** : résumé des changements.
* **Pourquoi** : contexte ou lien vers un ticket.
* **Comment tester** : étapes pour vérifier le bon fonctionnement.

:::note Le modèle de PR ne s'applique pas à `LE3-Documentation`
Le dépôt `.github` est **privé**. Les modèles d'issue et de PR d'un dépôt `.github` privé ne
s'appliquent qu'aux dépôts privés de l'organisation. `LE3-Documentation` étant public, il n'en
hérite pas.
:::

---

## 3. Le cycle de revue

### Analyse automatique (CI)

Le pipeline GitHub Actions lance un build de vérification sur chaque PR. Une PR rouge ne doit pas
être fusionnée, même si rien ne l'empêche techniquement.

### Revue par les pairs

Chaque PR nécessite au moins une approbation d'un autre développeur.

| Statut de la revue | Signification | Action requise |
| :--- | :--- | :--- |
| **Approved** | Le code est validé | La PR peut être fusionnée |
| **Changes Requested** | Des corrections sont nécessaires | Appliquer les retours et redemander une revue |
| **Comment** | Questions ou suggestions mineures | Discussion ouverte |

---

## 4. Application des retours

1. Appliquez les corrections directement sur votre branche.
2. Poussez les nouveaux commits ; ils apparaissent automatiquement dans la PR.
3. Utilisez « Resolve conversation » une fois le point traité.
4. Prévenez le reviewer pour une validation finale.

---

## 5. Fusion

* **Méthode** : **Squash and Merge**. Tous les commits de la PR sont condensés en un seul commit
  propre.
* **Nettoyage** : supprimez la branche immédiatement après la fusion.

:::danger Une PR fusionnée vers `main` détruit `develop` sur le plugin
`publish.yml` resynchronise `develop` sur `main` par `git reset --hard` puis `git push --force`.
Assurez-vous qu'aucun travail non fusionné ne vit sur `develop` avant de fusionner vers `main`.
:::

---

## 6. Post-fusion

1. Sur `main`, la publication se déclenche : GitHub Packages pour le plugin, `deploy.yml` pour les
   applications web si `DEPLOY_ENABLED` vaut `true`, GitHub Pages pour la documentation.
2. Vérifiez que vos changements sont reflétés sur le site ou le serveur.
3. En cas de bug critique détecté après fusion, ouvrez une PR de *revert* plutôt qu'un correctif
   dans l'urgence.

---

### Prochaines étapes

* **[Conventions Git](./git-conventions)**
* **[Standards de programmation](../guidelines/coding-standards)**
* **[CI/CD (GitHub Actions)](../infrastructure/github-actions)**
