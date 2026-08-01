---
sidebar_position: 2
---

# CI/CD (GitHub Actions)

L'automatisation est centralisée dans le dépôt **`LE3-Shared-Workflows`** : chaque projet appelle
un moteur de build partagé plutôt que de redéfinir sa logique.

:::note Couverture complète depuis le 2026-08-01
Les six dépôts de code ont désormais une CI. Les trois applications web appellent le moteur
partagé `node-engine.yml` (lint, tests, build, rapport de vulnérabilités) et disposent d'un
workflow de déploiement continu, inerte tant que la variable `DEPLOY_ENABLED` n'est pas
positionnée.
:::

---

## 1. Workflows du plugin Minecraft

Six workflows sont actifs dans `LE3-Plugin-Core`.

| Fichier | Nom | Déclencheur | Effet |
| :--- | :--- | :--- | :--- |
| `build-verify.yml` | LE3-Plugin-Verify | push `develop`, PR vers `main`/`develop`/`releases/*`/`hotfix/*`, manuel | Appelle `LE3-Shared-Workflows/.github/workflows/java-engine.yml@main` |
| `deploy-dev.yml` | LE3-Plugin-Dev-Build | push `develop`, manuel | `mvn -B package`, JAR en artefact (rétention **7 jours**) |
| `publish.yml` | LE3-Plugin-Publish | push `main`, manuel | `mvn -B deploy` vers GitHub Packages, puis resynchronise `develop` |
| `release.yml` | LE3-Plugin-Release | tag `v*` | `mvn -B clean package`, checksums SHA-256, Release GitHub |
| `security.yml` | LE3-Security-Scan | push/PR `main`+`develop`, cron `25 4 * * 5`, manuel | Semgrep OSS + osv-scanner |

Tous utilisent JDK 21 Temurin (`actions/setup-java@v4`) et un groupe de concurrence
`${{ github.workflow }}-${{ github.ref }}` avec `cancel-in-progress: true`, pour ne pas empiler
les builds sur des push successifs.

### Appel du moteur partagé

```yaml
jobs:
  call-java-engine:
    uses: 3LEvent/LE3-Shared-Workflows/.github/workflows/java-engine.yml@main
    secrets: inherit
```

`secrets: inherit` transmet les secrets de l'organisation sans les redéclarer localement.

### Build de développement à la demande

`deploy-dev.yml` ne déploie rien malgré son nom : il **prépare un artefact téléchargeable**
(`LE3-DEV-<repo>-b<run_number>`) que le staff récupère depuis l'onglet Actions pour l'installer
manuellement sur le serveur. Le `workflow_dispatch` permet de le lancer sans push.

### Release

`release.yml` se déclenche uniquement sur un tag `v*`. Il génère un `checksums.txt` (SHA-256) à
côté du JAR et laisse `generate_release_notes: true` composer les notes par comparaison avec la
version précédente.

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 2. Synchronisation `main` → `develop`

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

Le secret `LE3_SYNC_TOKEN` a été supprimé en même temps : il n'avait plus de consommateur.
À noter qu'il n'a jamais fonctionné comme documenté, il n'existait que sur
`LE3-Plugin-Template` alors que `LE3-Plugin-Core` le référençait aussi. Le push réussissait
grâce au jeton laissé par `actions/checkout`, pas grâce au PAT.

## 3. Analyse de sécurité

`security.yml` exécute **Semgrep OSS** (jeux de règles `p/java` et `p/secrets`) et
**osv-scanner** sur l'arbre de dépendances Maven résolu, donc transitives comprises.

CodeQL a été retiré le 2026-08-01 : le *code scanning* exige GitHub Advanced Security,
indisponible sur un dépôt privé en plan Free. Le workflow échouait à chaque exécution depuis
des mois, y compris le cron hebdomadaire.

Aucune action tierce n'est utilisée : Semgrep est installé via `pipx`, osv-scanner depuis son
binaire de release. Les résultats vont dans le résumé de job et dans un artefact conservé 30
jours. Ils n'apparaissent **pas** dans l'onglet Security, qui exige lui aussi Advanced
Security.

Le scan hebdomadaire (`cron: '25 4 * * 5'`, vendredi 04h25 UTC) détecte les vulnérabilités
publiées après la fusion du code.

## 4. Modèle de branches et CI

| Branche | Ce que déclenche un push |
| :--- | :--- |
| `feat/*`, `fix/*` | rien (la CI part de la PR) |
| PR vers `develop`/`main` | `build-verify` + `security` - bloquants |
| `develop` | `build-verify`, `deploy-dev` (artefact), `security` |
| `main` | `publish` (GitHub Packages, puis resync de `develop`), `security`, `deploy` si activé |
| tag `v*` | `release` (Release GitHub + checksums) |

---

## 5. CI des applications web

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
rapport `npm audit`.

`npm audit` **ne fait pas échouer le build** : une alerte publiée pendant la nuit sur une
dépendance transitive rendrait rouge une PR sans rapport avec elle. C'est Dependabot qui
ouvre le correctif. Le lint et les tests, eux, sont bloquants.

:::note `npm test` fonctionne désormais
Il renvoyait `exit 1` sur les trois dépôts. Chacun exécute maintenant une vraie suite Vitest
de 18 tests couvrant le contrat du bus d'événements.
:::

### Déploiement continu

Chaque application dispose d'un `deploy.yml` qui, sur push vers `main`, se connecte au
serveur en SSH, met à jour le code, reconstruit l'image et redémarre le conteneur, puis
vérifie qu'il tourne toujours 15 secondes plus tard.

Le job est **inerte** tant que la variable de dépôt `DEPLOY_ENABLED` ne vaut pas `true`.

## 6. En cas d'échec

1. **Logs** : onglet **Actions** du dépôt, job concerné.
2. **Formatage Java** : `fmt-maven-plugin` reformate en phase `validate`. Un échec de build sur le
   style est presque toujours résolu par `mvn clean package` en local suivi d'un commit.
3. **Publication** : `publish.yml` requiert `packages: write`. Un `401` sur GitHub Packages est
   généralement un problème de `settings.xml` ou de permissions de workflow.
4. **Sync** : la resynchronisation de `develop` fait partie de `publish.yml`. Si elle échoue,
   la publication a réussi mais `develop` est restée en arrière : relancer le workflow.

---

### Prochaines étapes

* **[Gestion des secrets](./secrets-management)**
* **[Processus de Pull Request](../workflow/pull-request-process)**
* **[Déploiement et hébergement](./cloudflare-setup)**
