---
sidebar_position: 10
---

# Automatisation et CI/CD (GitHub Actions)

L'automatisation des cycles de build, de test et de déploiement est gérée par GitHub Actions. Pour garantir la cohérence de l'écosystème et faciliter la maintenance, **3LEvent** utilise des workflows réutilisables (Reusable Workflows).

---

## 1. Architecture Centralisée

Plutôt que de définir la logique de build dans chaque dépôt, toute l'intelligence CI/CD est centralisée dans le dépôt :
👉 `LE3-Shared-Workflows`

Chaque projet satellite (Plugin, Web, App) fait appel à ces moteurs de build standardisés. Cela permet de mettre à jour la stratégie de déploiement de 20 dépôts en modifiant un seul fichier.

---

## 2. Workflows Standards Disponibles

L'organisation propose trois types de moteurs de build principaux :

| Workflow | Usage | Actions effectuées |
| :--- | :--- | :--- |
| `java-plugin-build.yml` | Plugins Minecraft | Checkstyle, Build Maven/Gradle, Archivage de l'Artifact. |
| `angular-deploy.yml` | Applications Web | Linting, Build Angular, Déploiement sur Cloudflare Pages. |
| `nodejs-app-check.yml` | Bots et API | Tests unitaires, Linting TypeScript, Build de production. |

---

## 3. Mise en Œuvre dans un Nouveau Dépôt

Pour activer la CI/CD sur un nouveau projet, créez un fichier `.github/workflows/main.yml` et appelez le workflow partagé correspondant.

### Exemple pour un Plugin Minecraft :
```yaml
name: Build Plugin
on: [push, pull_request]

jobs:
  call-shared-workflow:
    uses: 3LEvent/LE3-Shared-Workflows/.github/workflows/java-plugin-build.yml@main
    with:
      java-version: '21'
    secrets: inherit

```

### Exemple pour une Application Web (Angular) :

```yaml
name: Deploy Web App
on:
  push:
    branches: [main, develop]

jobs:
  call-shared-workflow:
    uses: 3LEvent/LE3-Shared-Workflows/.github/workflows/angular-deploy.yml@main
    with:
      project-name: 'le3-web-main'
    secrets: inherit

```

---

## 4. Déclencheurs (Triggers) et Environnements

Le comportement de la CI/CD s'adapte en fonction de la branche cible :

1. **Pull Request vers `develop**` :
* Déclenche uniquement les tests et le build de vérification.
* Empêche la fusion si une erreur est détectée.


2. **Push sur `develop` (Staging)** :
* Déploie automatiquement sur l'environnement de test.
* Génère une version "Snaphot" pour les plugins Java.


3. **Push sur `main` (Production)** :
* Déploie sur l'infrastructure de production (Cloudflare).
* Génère une Release GitHub officielle.



---

## 5. Gestion des Échecs et Monitoring

En cas d'échec d'un Workflow :

* **Notification** : Une alerte est envoyée automatiquement sur le canal Discord `#staff-logs-dev`.
* **Logs** : Les détails de l'erreur sont consultables dans l'onglet **Actions** du dépôt concerné.
* **Blocage** : Pour les dépôts critiques, la fusion de code est bloquée tant que le workflow n'est pas "Success".

---

## 6. Sécurité des Workflows

* **secrets: inherit** : Cette commande permet aux workflows partagés d'accéder aux secrets de l'organisation (Tokens Cloudflare, Maven, etc.) sans les redéfinir localement.
* **Permissions** : Les workflows sont exécutés avec des permissions `read-only` par défaut. Seuls les workflows de déploiement ont l'autorisation `write` pour les artifacts et les releases.

---

### Prochaines étapes

* **[Consulter la liste des Secrets disponibles](./secrets-management)**
* **[Comprendre le Processus de Pull Request](../workflow/pull-request-process)**