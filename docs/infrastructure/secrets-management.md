---
sidebar_position: 1
---

# Gestion des Secrets

Aucun secret ne doit apparaître en clair dans le code source ni dans un fichier commité.

---

## 1. Principes

* **Zéro persistance en dépôt** : y compris sur une branche privée, y compris dans un commit
  ultérieurement supprimé. L'historique Git conserve tout.
* **Injection au runtime** : les secrets arrivent par variables d'environnement, jamais par
  fichier versionné.
* **Moindre privilège** : une clé par usage, avec la portée minimale (la clé Pterodactyl est une
  clé *client*, pas *application*).
* **Échec explicite** : un secret manquant doit faire échouer le démarrage bruyamment, jamais
  dégrader silencieusement. Pas de valeur de repli codée en dur.

---

## 2. Nomenclature

Les variables suivent `LE3_[SERVICE]_[NOM]`. Trois exceptions subsistent, toutes documentées avec
leur service : `REDIS_URL`, `TWITCH_CLIENT_ID` et `TWITCH_CLIENT_SECRET` (Live),
`DISCORD_ROLE_INSCRIT_ID` et `DISCORD_TEAM_ROLES_IDS` (Core),
`DISCORD_PREDICTION_WEBHOOK_URL` (Live).

---

## 3. Catalogue par service

### `LE3-Web-Main` - Core Web

| Variable | Criticité | Rôle |
| :--- | :--- | :--- |
| `LE3_MONGO_URI` | **bloquant** | MongoDB |
| `LE3_SESSION_SECRET` | **bloquant** | Session - identique au Live |
| `REDIS_URL` | critique | Sessions + bus |
| `LE3_JWT_SECRET` | critique | Vérification JWT dans `protect` |
| `LE3_PLUGIN_SECRET` | **critique** | Secret partagé avec le plugin |
| `LE3_COOKIE_DOMAIN` | config | Domaine du cookie |
| `LE3_MS_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | critique | OAuth Microsoft |
| `LE3_DISCORD_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | critique | OAuth Discord |
| `LE3_DISCORD_BOT_TOKEN`, `LE3_DISCORD_GUILD_ID` | critique | Attribution de rôles |
| `DISCORD_ROLE_INSCRIT_ID`, `DISCORD_TEAM_ROLES_IDS` | config | Identifiants de rôles |
| `LE3_TWITCH_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | critique | OAuth Twitch |

### `LE3-Web-Live` - Live Web

| Variable | Criticité | Rôle |
| :--- | :--- | :--- |
| `LE3_MONGO_URI` | **bloquant** | MongoDB |
| `LE3_SESSION_SECRET` | **bloquant** | Session - **identique au Core** |
| `REDIS_URL` | critique | Sessions, bus, cache du classement |
| `LE3_COOKIE_DOMAIN` | config | Domaine du cookie |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | critique | API Helix |
| `DISCORD_PREDICTION_WEBHOOK_URL` | critique | Webhook des pronostics |

Le Live n'utilise **pas** de JWT : son middleware `protect` est purement basé sur la session
partagée. Aucun `LE3_JWT_SECRET` n'y est lu.

### `LE3-Web-Panel` - Staff Panel

| Variable | Criticité | Rôle |
| :--- | :--- | :--- |
| `LE3_MONGO_URI` | **bloquant** | MongoDB du panel |
| `LE3_SESSION_SECRET` | **bloquant** | Session isolée |
| `REDIS_URL` | critique | Bus **partagé** avec tous les services |
| `LE3_AUTHENTIK_ISSUER` / `_CLIENT_ID` / `_CLIENT_SECRET` / `_REDIRECT_URI` | **critique** | SSO |
| `LE3_BOOTSTRAP_SUPER_ADMIN` | **temporaire** | Amorçage - à vider après usage |
| `LE3_DEV_AUTH_BYPASS` | **danger** | Doit rester `false` en production |
| `LE3_DISCORD_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | critique | Liaison Discord |
| `LE3_PLUGIN_MYSQL_HOST` / `_PORT` / `_DATABASE` / `_USER` / `_PASSWORD` | **critique** | Base du plugin |
| `LE3_PTERODACTYL_URL` / `_API_KEY` / `_SERVER_ID` | critique | Clé **client** `ptlc_…` |
| `LE3_ACHIEVEMENTS_CONFIG_PATH`, `LE3_PANEL_URL`, `LE3_PANEL_ALLOWED_ORIGIN` | config | |

:::warning Onze de ces clés sont modifiables depuis le CMS du panel
`PATCH /api/cms/env` écrit `LE3_DISCORD_*`, `LE3_PLUGIN_MYSQL_*` et `LE3_PTERODACTYL_*`. Les clés
`LE3_AUTHENTIK_*` en sont volontairement exclues : une faute de frappe sur l'issuer verrouillerait
tout le monde hors du panel, sans possibilité de correction par l'interface.
:::

### `LE3-Plugin-Core`

`config.yml` porte trois groupes de valeurs sensibles :

| Clé | Criticité | Rôle |
| :--- | :--- | :--- |
| `database.host` / `port` / `database` / `username` / `password` | **critique** | MySQL du plugin, la même base que l'éditeur du Panel |
| `api.secret` | **critique** | Doit valoir exactement `LE3_PLUGIN_SECRET` côté Core |
| `redis.uri` (ou `redis.password`) | **critique** | Doit valoir exactement `REDIS_URL` des trois applications web |

:::danger `config.yml` est versionné et embarqué dans chaque JAR publié
Les valeurs livrées dans le dépôt sont vides, et **doivent le rester**. Un identifiant commité ici
se retrouve dans un paquet GitHub, où le supprimer ne le révoque pas. Voir `ROTATION.md`, entrée
R-10.
:::

Le plugin refuse de démarrer si `database.database`, `database.username` ou `database.password`
sont absents : il n'existe aucun repli silencieux.

---

## 4. Trois secrets à ne jamais désynchroniser

| Secret | Doit être identique entre |
| :--- | :--- |
| `LE3_SESSION_SECRET` | `LE3-Web-Main` et `LE3-Web-Live` |
| `LE3_PLUGIN_SECRET` ↔ `api.secret` | Core et plugin |
| `REDIS_URL` ↔ `redis.uri` | les quatre services (bus et cache communs) |

:::danger Une divergence ne provoque aucune erreur au démarrage
Elle se manifeste plus tard, et ailleurs : des joueurs déconnectés en changeant de sous-domaine,
une synchronisation d'équipes en `401`, ou un panel qui n'affiche plus rien en temps réel. C'est
précisément pour cette raison que ces trois valeurs vivent dans un projet Infisical dédié,
`le3-shared`.
:::

---

## 5. Infisical

Les secrets applicatifs vivent dans **Infisical** (`vault.3levent.fr`) : un projet par
application, plus `le3-shared` pour les trois valeurs ci-dessus.

Les conteneurs les récupèrent au démarrage par le réseau Docker interne : aucun identifiant
Infisical ne transite par GitHub.

Runbook complet de mise en place et procédure de bascule des conteneurs : documents
`docs/infisical-setup.md` et `docs/deploy-infisical.md` du workspace.

:::danger Les clés maîtresses d'Infisical restent à rotationner
`ROTATION.md` liste les secrets à révoquer par ordre de criticité. Plusieurs entrées sont encore
ouvertes, dont les clés maîtresses du coffre lui-même. Elles doivent être traitées **avant** toute
migration réelle des secrets de production vers Infisical, sans quoi le coffre hérite du problème
qu'il est censé résoudre.
:::

---

## 6. Développement local

1. Copier `.env.example` en `.env`. Les trois applications web en fournissent un, à jour et
   commenté.
2. Renseigner des valeurs de **test**, jamais celles de production.
3. Vérifier que `.env` est bien ignoré par Git avant tout commit.

Toute nouvelle variable est ajoutée au `.env.example` avec une **valeur vide**.

---

## 7. Implémentation

### Node.js

```ts
const MONGO_URI = process.env.LE3_MONGO_URI;
if (!MONGO_URI) {
    throw new Error('[CRITICAL] Missing LE3_MONGO_URI in environment variables.');
}
```

Le chargement se fait via `dotenv` en développement et via `node --env-file=.env` en production
(`npm start`).

### Java

Le plugin lit ses identifiants depuis `config.yml`, fichier **versionné**. C'est précisément ce
qui a produit l'entrée R-10 de `ROTATION.md`. La valeur livrée dans le dépôt est vide, et
`DatabaseManager` lève une `IllegalStateException` si elle le reste au démarrage :

```java
if (isBlank(dbName) || isBlank(username) || isBlank(password)) {
    throw new IllegalStateException(
        "database.database, database.username and database.password must all be set in config.yml.");
}
```

---

## 8. GitHub Secrets

**Aucun secret d'organisation, aucun secret de dépôt.** Vérifié le 2026-08-01.

Sept secrets d'organisation existaient, en `visibility: all` donc lisibles par les seize dépôts de
l'époque, et référencés par aucun workflow. Ils dataient de mars 2026 et n'avaient jamais été
modifiés. Ils ont été supprimés, ainsi que `LE3_SYNC_TOKEN` et le workflow qui le consommait.

| Secret | Usage |
| :--- | :--- |
| `GITHUB_TOKEN` | Fourni automatiquement, publication sur GitHub Packages |

Les workflows s'exécutent avec des permissions restreintes, élargies explicitement au cas par
cas (`contents: write`, `packages: write`).

---

## 9. Ne jamais coder un secret en dur

Deux applications signaient les sessions avec une valeur de repli littérale :

```ts
secret: SESSION_SECRET || 'une_constante_committee'
```

Sans la variable, l'application démarrait quand même et signait tous les cookies avec une
constante lisible dans le dépôt. Quiconque avait accès au code pouvait forger une session
pour n'importe quel compte, y compris `super-admin` sur le panel, ce qui contourne
entièrement Authentik.

Corrigé le 2026-08-01 : les deux applications refusent maintenant de démarrer sans
`LE3_SESSION_SECRET`, conformément au principe d'**échec explicite** du §1.

---

## 10. Procédure en cas de fuite

1. **Révoquer immédiatement** : régénérer le jeton, le mot de passe ou la clé. C'est la seule
   étape qui compte vraiment : purger l'historique Git ne fait rien si la valeur reste valide.
2. **Mettre à jour** la valeur dans Infisical et dans les `.env` de production, puis redémarrer
   les conteneurs concernés.
3. **Auditer** les accès sur la période d'exposition (logs MongoDB, MySQL, Discord, Twitch).
4. **Nettoyer l'historique** si nécessaire, avec `git filter-repo` ou `bfg-repo-cleaner`, après
   avoir prévenu tous les contributeurs, car cela réécrit les hachages.
5. **Documenter** l'incident et la date de rotation dans `ROTATION.md`.

---

### Prochaines étapes

* **[CI/CD (GitHub Actions)](./github-actions)**
* **[Authentification et sessions](../architecture/authentication)**
