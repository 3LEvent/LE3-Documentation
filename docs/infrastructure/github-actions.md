---
sidebar_position: 2
---

# CI/CD (GitHub Actions)

L'automatisation est centralisée dans le dépôt **`LE3-Shared-Workflows`** : chaque projet appelle
un moteur de build partagé plutôt que de redéfinir sa logique.

:::note Couverture complète
Les cinq dépôts de code ont une CI. Les trois applications web appellent le moteur partagé
`node-engine.yml` (lint, tests, build, rapport de vulnérabilités) et disposent d'un workflow de
déploiement continu, inerte tant que la variable `DEPLOY_ENABLED` n'est pas positionnée.
`LE3-Documentation` a son propre `deploy.yml` vers GitHub Pages.
:::

| Dépôt | Workflows |
| :--- | :--- |
| `LE3-Web-Main`, `LE3-Web-Live`, `LE3-Web-Panel` | `build-verify.yml`, `deploy.yml` |
| `LE3-Plugin-Core` | `build-verify.yml`, `deploy-dev.yml`, `publish.yml`, `release.yml`, `security.yml` |
| `LE3-Documentation` | `deploy.yml` |
| `LE3-Shared-Workflows` | `java-engine.yml`, `node-engine.yml` (moteurs, jamais déclenchés seuls) |
| `.github` | aucun |

---

## 1. Partage des moteurs réutilisables

`LE3-Shared-Workflows` est un dépôt **privé**. Ses moteurs ne sont appelables par les autres dépôts
que parce que son réglage d'accès Actions vaut `organization` :

```bash
gh api repos/3LEvent/LE3-Shared-Workflows/actions/permissions/access
# {"access_level":"organization"}
```

:::danger C'est le dépôt partagé qui autorise, pas les appelants qui demandent
Rien n'est configuré côté appelant. Repasser ce réglage à `none` **casserait la CI des quatre
dépôts consommateurs d'un coup**, avec une erreur qui ressemble à un fichier manquant plutôt qu'à
un refus de permission.
:::

:::caution Les appelants pointent sur `@main`, une branche mobile
Un commit sur `LE3-Shared-Workflows` s'applique immédiatement partout, sans revue côté
consommateur. Toute modification d'un moteur doit être traitée comme un changement en production
sur cinq dépôts.
:::

---

## 2. Workflows du plugin Minecraft

Cinq workflows sont actifs dans `LE3-Plugin-Core`.

| Fichier | Nom | Déclencheur | Effet |
| :--- | :--- | :--- | :--- |
| `build-verify.yml` | LE3-Plugin-Verify | push `develop`, PR vers `main`/`develop`/`releases/*`/`hotfix/*`, manuel | Appelle `LE3-Shared-Workflows/.github/workflows/java-engine.yml@main` |
| `deploy-dev.yml` | LE3-Plugin-Dev-Build | push `develop`, manuel | `mvn -B package`, JAR en artefact (rétention **7 jours**) |
| `publish.yml` | LE3-Plugin-Publish | push `main`, manuel | `mvn -B deploy` vers GitHub Packages, puis resynchronise `develop` |
| `release.yml` | LE3-Plugin-Release | tag `v*` | `mvn -B clean package`, checksums SHA-256, Release GitHub |
| `security.yml` | LE3-Security-Scan | push/PR `main`+`develop`, cron `25 4 * * 5`, manuel | Semgrep OSS + osv-scanner |

Tous utilisent **JDK 21 Temurin** (`actions/setup-java`, épinglée par SHA) et un groupe de
concurrence `${{ github.workflow }}-${{ github.ref }}` avec `cancel-in-progress: true`, pour ne pas
empiler les builds sur des push successifs.

### Appel du moteur partagé

```yaml
jobs:
  call-java-engine:
    uses: 3LEvent/LE3-Shared-Workflows/.github/workflows/java-engine.yml@main
    permissions:
      contents: read
    secrets: inherit
```

`secrets: inherit` transmet les secrets disponibles sans les redéclarer localement.

### Build de développement à la demande

`deploy-dev.yml` ne déploie rien malgré son nom : il **prépare un artefact téléchargeable**
que le staff récupère depuis l'onglet Actions pour l'installer manuellement sur le serveur. Le
`workflow_dispatch` permet de le lancer sans push.

### Release

`release.yml` se déclenche uniquement sur un tag `v*`. Il génère un `checksums.txt` (SHA-256) à
côté du JAR et laisse `generate_release_notes: true` composer les notes par comparaison avec la
version précédente.

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 3. Synchronisation `main` → `develop`

Un seul mécanisme : l'étape « Sync Develop with Main » de `publish.yml`, qui ne s'exécute
qu'**après** une publication réussie.

`sync-develop.yml` a été supprimé le 2026-08-01. Il faisait exactement la même chose, sur le
même déclencheur : deux `git push --force` concurrents sur la même branche.

:::danger `develop` est écrasée à chaque publication
`publish.yml` exécute `git reset --hard origin/main` puis `git push --force` sur `develop`.
Toute modification présente sur `develop` mais absente de `main` est **définitivement
perdue**. Ne laissez jamais de travail non fusionné vivre sur `develop` : créez une branche
`feat/`.
:::

Le secret `LE3_SYNC_TOKEN` a été supprimé en même temps : il n'avait plus de consommateur, et il
n'avait jamais fonctionné comme documenté. Il n'existait que sur `LE3-Plugin-Template`, alors que
`LE3-Plugin-Core` le référençait aussi ; le push réussissait grâce au jeton laissé par
`actions/checkout`, pas grâce au PAT.

---

## 4. Analyse de sécurité

`security.yml` exécute **Semgrep OSS** (jeux de règles `p/java` et `p/secrets`) et
**osv-scanner** sur l'arbre de dépendances Maven résolu, donc transitives comprises.

CodeQL a été retiré le 2026-08-01 : le *code scanning* exige GitHub Advanced Security,
indisponible sur un dépôt privé en plan Free. Le workflow échouait à chaque exécution depuis
des mois, y compris le cron hebdomadaire.

Aucune action tierce n'est utilisée : Semgrep est installé via `pipx`, osv-scanner depuis son
binaire de release. Les résultats vont dans le résumé de job et dans un artefact conservé 30 jours.

:::warning Les résultats n'apparaissent pas dans l'onglet Security
L'onglet Security exige lui aussi Advanced Security. Les rapports SARIF et JSON ne sont lisibles
que dans le résumé du run et dans les artefacts. Personne ne sera notifié à votre place : il faut
ouvrir le run.
:::

Le scan hebdomadaire (`cron: '25 4 * * 5'`, vendredi 04h25 UTC) détecte les vulnérabilités
publiées après la fusion du code. Ni Semgrep ni osv-scanner ne font échouer le job (`|| true`) :
ils posent un `::warning::` quand ils trouvent quelque chose.

---

## 5. Modèle de branches et CI

| Branche | Ce que déclenche un push |
| :--- | :--- |
| `feat/*`, `fix/*` | rien (la CI part de la PR) |
| PR vers `develop`/`main` | `build-verify` + `security` |
| `develop` | `build-verify`, `deploy-dev` (artefact), `security` |
| `main` | `publish` (GitHub Packages, puis resync de `develop`), `security`, `deploy` si activé |
| tag `v*` | `release` (Release GitHub + checksums) |

:::danger La CI ne bloque rien sur les dépôts privés
Le plan GitHub Free ne permet **aucune protection de branche ni aucun ruleset** sur un dépôt
privé. Rien n'empêche techniquement de pousser sur `main`, de fusionner une PR rouge ou de forcer
un `push --force`. La CI affiche un état ; c'est la discipline qui l'applique. Seul
`LE3-Documentation`, public, dispose d'un ruleset.
:::

---

## 6. CI des applications web

Les trois applications appellent `node-engine.yml` depuis `LE3-Shared-Workflows` :

```yaml
jobs:
  verify:
    uses: 3LEvent/LE3-Shared-Workflows/.github/workflows/node-engine.yml@main
    permissions:
      contents: read
    secrets: inherit
```

Le moteur enchaîne `npm ci`, `npm run lint`, `npm test`, `npm run build`, puis publie un
rapport `npm audit`. Ses entrées : `node-version` (défaut `22`), `run-lint`, `run-tests`,
`run-audit`.

:::note `npm audit` ne fait pas échouer le build
Une alerte publiée pendant la nuit sur une dépendance transitive rendrait rouge une PR sans
rapport avec elle. C'est Dependabot qui ouvre le correctif ; cette étape rend l'état visible dans
le résumé et pose un `::warning::` s'il existe des alertes critiques ou hautes. Le lint et les
tests, eux, sont bloquants.
:::

Chaque application exécute une suite **Vitest de 17 tests** couvrant le contrat du bus
d'événements.

### Déploiement continu

Chaque application dispose d'un `deploy.yml` qui, sur push vers `main`, se connecte au
serveur en SSH, met à jour le code, reconstruit l'image et redémarre le conteneur, puis
vérifie qu'il tourne toujours 15 secondes plus tard.

Le job est **inerte** tant que la variable de dépôt `DEPLOY_ENABLED` ne vaut pas `true`.

---

## 7. Conventions applicables à tout workflow

1. **Actions épinglées par SHA de commit**, jamais par tag. Un tag est repointable à volonté par
   son propriétaire : `@v4` n'est pas une version, c'est une promesse. Le tag reste en commentaire
   pour la lisibilité.
2. **Bloc `permissions:` explicite et minimal.** Sans lui, le workflow hérite des permissions par
   défaut du dépôt.
3. **`concurrency` déclaré dans le workflow appelant**, pas dans le moteur : il doit porter sur la
   branche du dépôt appelant.
4. **Aucune action tierce**, aucun secret en dur.
5. **Cache de dépendances activé** (`cache: 'npm'`, `cache: maven`).
6. **Résumé de job systématique**, pour qu'un run se lise sans ouvrir les logs.

---

## 8. En cas d'échec

1. **Logs** : onglet **Actions** du dépôt, job concerné.
2. **Moteur introuvable** : si `build-verify` échoue en disant que le workflow réutilisable
   n'existe pas, vérifiez d'abord le réglage d'accès de `LE3-Shared-Workflows` (§1). L'erreur
   ressemble à un fichier manquant, pas à un refus de permission.
3. **Formatage Java** : `fmt-maven-plugin` reformate en phase `validate`. Un échec de build sur le
   style est presque toujours résolu par `mvn clean package` en local suivi d'un commit.
4. **Publication** : `publish.yml` requiert `packages: write`. Un `401` sur GitHub Packages est
   généralement un problème de `settings.xml` ou de permissions de workflow.
5. **Sync** : la resynchronisation de `develop` fait partie de `publish.yml`. Si elle échoue,
   la publication a réussi mais `develop` est restée en arrière : relancer le workflow.

---

### Prochaines étapes

* **[Gestion des secrets](./secrets-management)**
* **[Processus de Pull Request](../workflow/pull-request-process)**
* **[Déploiement et hébergement](./cloudflare-setup)**
