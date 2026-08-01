---
sidebar_position: 1
---

# Gestion des Secrets

Aucun secret ne doit apparaître en clair dans le code source ni dans un fichier commité.

---

## 1. Principes

* **Zéro persistance en dépôt** — y compris sur une branche privée, y compris dans un commit
  ultérieurement supprimé : l'historique Git conserve tout.
* **Injection au runtime** — les secrets arrivent par variables d'environnement, jamais par
  fichier versionné.
* **Moindre privilège** — une clé par usage, avec la portée minimale (la clé Pterodactyl est une
  clé *client*, pas *application*).
* **Échec explicite** — un secret manquant doit faire échouer le démarrage bruyamment, jamais
  dégrader silencieusement.

---

## 2. Nomenclature

Les variables suivent `LE3_[SERVICE]_[NOM]`.

---

## 3. Catalogue par service

### `3levent` — Core Web

| Variable | Criticité | Rôle |
| :--- | :--- | :--- |
| `LE3_DATABASE_URL` | **bloquant** | MongoDB |
| `LE3_SESSION_SECRET` | **critique** | Session — identique au Live |
| `LE3_JWT_SECRET` | critique | Vérification JWT dans `protect` |
| `LE3_PLUGIN_SECRET` | **critique** | Secret partagé avec le plugin |
| `REDIS_URL` | critique | Sessions + bus |
| `LE3_COOKIE_DOMAIN` | config | Domaine du cookie |
| `LE3_MS_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | critique | OAuth Microsoft |
| `LE3_DISCORD_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | critique | OAuth Discord |
| `LE3_DISCORD_BOT_TOKEN`, `LE3_DISCORD_GUILD_ID` | critique | Attribution de rôles |
| `DISCORD_ROLE_INSCRIT_ID`, `DISCORD_TEAM_ROLES_IDS` | config | Identifiants de rôles |
| `LE3_TWITCH_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | critique | OAuth Twitch |

### `3levent-live` — Live Web

| Variable | Criticité | Rôle |
| :--- | :--- | :--- |
| `LE3_DATABASE_URL` | **bloquant** | MongoDB |
| `LE3_SESSION_SECRET` | **bloquant** | Session — **identique au Core** |
| `REDIS_URL` | critique | Sessions, bus, cache |
| `LE3_COOKIE_DOMAIN`, `LE3_JWT_SECRET` | config / critique | |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | critique | API Helix |
| `DISCORD_PREDICTION_WEBHOOK_URL` | critique | Webhook des pronostics |

### `3levent-panel` — Staff Panel

| Variable | Criticité | Rôle |
| :--- | :--- | :--- |
| `LE3_MONGO_URI` | **bloquant** | MongoDB du panel |
| `LE3_SESSION_SECRET` | critique | Session isolée |
| `REDIS_URL` | critique | Bus **partagé** avec tous les services |
| `LE3_AUTHENTIK_ISSUER` / `_CLIENT_ID` / `_CLIENT_SECRET` / `_REDIRECT_URI` | **critique** | SSO |
| `LE3_BOOTSTRAP_SUPER_ADMIN` | **temporaire** | Amorçage — à vider après usage |
| `LE3_DEV_AUTH_BYPASS` | **danger** | Doit rester `false` en production |
| `LE3_DISCORD_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | critique | Liaison Discord |
| `LE3_DISCORD_ALERT_WEBHOOK_URL` | critique | Alertes critiques |
| `LE3_PLUGIN_MYSQL_HOST` / `_PORT` / `_DATABASE` / `_USER` / `_PASSWORD` | **critique** | Base du plugin |
| `LE3_PTERODACTYL_URL` / `_API_KEY` / `_SERVER_ID` | critique | Clé **client** `ptlc_…` |
| `LE3_ACHIEVEMENTS_CONFIG_PATH`, `LE3_PANEL_URL`, `LE3_PANEL_ALLOWED_ORIGIN` | config | |

### `LE3-Plugin-Core`

`config.yml` porte `database.*` (host, port, database, username, password) et `api.secret`, qui
doit valoir exactement `LE3_PLUGIN_SECRET` côté Core.

---

## 4. Trois secrets à ne jamais désynchroniser

| Secret | Doit être identique entre |
| :--- | :--- |
| `LE3_SESSION_SECRET` | `3levent` et `3levent-live` |
| `LE3_PLUGIN_SECRET` ↔ `api.secret` | Core et plugin |
| `REDIS_URL` | les quatre services (bus commun) |

Une divergence ne provoque pas d'erreur au démarrage : elle se manifeste par des joueurs
déconnectés en changeant de sous-domaine, une synchronisation d'équipes en `401`, ou un panel qui
n'affiche plus rien en temps réel.

---

## 5. Développement local

1. Copier `.env.example` en `.env` (seul `3levent-panel` en fournit un ; demander le modèle à un
   lead pour les autres).
2. Renseigner des valeurs de **test**, jamais celles de production.
3. Vérifier que `.env` est bien ignoré par Git avant tout commit.

---

## 6. Implémentation

### Node.js

```ts
const DATABASE_URL = process.env.LE3_DATABASE_URL;
if (!DATABASE_URL) {
    throw new Error('[CRITICAL] Missing LE3_DATABASE_URL in environment variables.');
}
```

Le chargement se fait via `dotenv` en développement et via `node --env-file=.env` en production
(`npm start`).

### Java

Le plugin lit aujourd'hui ses identifiants depuis `config.yml`. Le motif recommandé consiste à
donner la priorité à l'environnement :

```java
String dbPassword = System.getenv("LE3_DATABASE_PASSWORD");
if (dbPassword == null || dbPassword.isBlank()) {
    dbPassword = getConfig().getString("database.password");
}
```

---

## 8. Procédure en cas de fuite

1. **Révoquer immédiatement** — régénérer le jeton, le mot de passe ou la clé. C'est la seule
   étape qui compte vraiment : purger l'historique Git ne fait rien si la valeur reste valide.
2. **Mettre à jour** la valeur dans les GitHub Secrets de l'organisation et dans les `.env` de
   production.
3. **Auditer** les accès sur la période d'exposition (logs MongoDB, MySQL, Discord, Twitch).
4. **Nettoyer l'historique** si nécessaire, avec `git filter-repo` ou `bfg-repo-cleaner` — après
   avoir prévenu tous les contributeurs, car cela réécrit les hachages.
5. **Documenter** l'incident et la date de rotation.

---

## 9. GitHub Secrets

**Aucun secret d'organisation, aucun secret de dépôt.** Vérifié le 2026-08-01.

Sept secrets d'organisation existaient, en `visibility: all` donc lisibles par les 16 dépôts,
et référencés par aucun workflow. Ils dataient de mars 2026 et n'avaient jamais été
modifiés. Ils ont été supprimés. `LE3_SYNC_TOKEN` aussi, avec le workflow qui le consommait.

| Secret | Usage |
|---|---|
| `GITHUB_TOKEN` | Fourni automatiquement, publication sur GitHub Packages |

Les workflows s'exécutent avec des permissions restreintes, élargies explicitement au cas par
cas (`contents: write`, `packages: write`).

Les secrets applicatifs vivent désormais dans **Infisical** (`vault.3levent.fr`), un projet
par application plus un projet partagé pour les trois valeurs qui ne doivent jamais
diverger. Les conteneurs les récupèrent au démarrage par le réseau Docker interne : aucun
identifiant Infisical ne transite par GitHub.

## 10. Ne jamais coder un secret en dur

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

### Prochaines étapes

* **[CI/CD (GitHub Actions)](./github-actions)**
* **[Authentification et sessions](../architecture/authentication)**
