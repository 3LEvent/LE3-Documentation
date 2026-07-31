---
sidebar_position: 2
---

# CI/CD (GitHub Actions)

L'automatisation est centralisée dans le dépôt **`LE3-Shared-Workflows`** : chaque projet appelle
un moteur de build partagé plutôt que de redéfinir sa logique.

:::caution État réel de la couverture
Seul **`LE3-Plugin-Core`** possède aujourd'hui des workflows. Les trois applications web
(`3levent`, `3levent-live`, `3levent-panel`) n'ont **aucun** `.github/workflows/` : elles sont
construites et déployées manuellement. Les combler est un chantier ouvert (§5).
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
| `security.yml` | LE3-Security-Scan | push/PR `main`+`develop`, cron `25 4 * * 5`, manuel | CodeQL `java-kotlin`, requêtes `security-extended` |
| `sync-develop.yml` | Sync Develop | push `main`, manuel | Reset dur de `develop` sur `main` |

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

Deux workflows font **la même chose** : `sync-develop.yml`, et l'étape « Sync Develop with Main »
de `publish.yml`. Tous deux réalisent un `git reset --hard origin/main` sur `develop` suivi d'un
`push --force`.

:::danger `develop` est écrasée à chaque publication
Toute modification présente sur `develop` mais absente de `main` est **définitivement perdue** au
prochain push sur `main`. Ne laissez jamais de travail non fusionné vivre sur `develop` : créez
une branche `feat/`.
:::

`sync-develop.yml` utilise un PAT d'organisation (`LE3_SYNC_TOKEN`) injecté dans l'URL du push
pour contourner les *rulesets* de branche protégée — le `GITHUB_TOKEN` standard n'y suffit pas.
Ces deux workflows font double emploi : en conserver un seul éviterait les *race conditions*.

---

## 3. Analyse de sécurité

`security.yml` exécute CodeQL en mode `build-mode: manual` : le workflow lance lui-même
`mvn -B clean install -DskipTests` pour que CodeQL cartographie l'ensemble du projet avant
l'analyse. Résultats dans l'onglet **Security → Code scanning** du dépôt.

Le scan hebdomadaire (`cron: '25 4 * * 5'`, vendredi 04h25 UTC) détecte les vulnérabilités
publiées après la fusion du code.

---

## 4. Modèle de branches et CI

| Branche | Ce que déclenche un push |
| :--- | :--- |
| `feat/*`, `fix/*` | rien (la CI part de la PR) |
| PR vers `develop`/`main` | `build-verify` + `security` — bloquants |
| `develop` | `build-verify`, `deploy-dev` (artefact), `security` |
| `main` | `publish` (GitHub Packages), `sync-develop`, `security` |
| tag `v*` | `release` (Release GitHub + checksums) |

---

## 5. À faire : CI des applications web

Les trois applications sont prêtes pour une CI (scripts `build` et `lint` normalisés), il ne
manque que les workflows. Un moteur partagé `node-engine.yml` devrait, au minimum :

1. `npm ci`
2. `npm run lint`
3. `npm run build` (backend + frontend + CSS + assets)
4. construire et publier l'image Docker

:::note `npm test` n'est pas utilisable
Il renvoie `exit 1` sur les trois dépôts. Ne l'ajoutez pas au pipeline avant d'avoir des tests
réels, sinon la CI sera rouge en permanence — ou pire, quelqu'un ajoutera `|| true`.
:::

---

## 6. En cas d'échec

1. **Logs** : onglet **Actions** du dépôt, job concerné.
2. **Formatage Java** : `fmt-maven-plugin` reformate en phase `validate`. Un échec de build sur le
   style est presque toujours résolu par `mvn clean package` en local suivi d'un commit.
3. **Publication** : `publish.yml` requiert `packages: write`. Un `401` sur GitHub Packages est
   généralement un problème de `settings.xml` ou de permissions de workflow.
4. **Sync** : si `sync-develop` échoue, vérifier la validité de `LE3_SYNC_TOKEN` (les PAT
   expirent).

---

### Prochaines étapes

* **[Gestion des secrets](./secrets-management)**
* **[Processus de Pull Request](../workflow/pull-request-process)**
* **[Déploiement et hébergement](./cloudflare-setup)**
