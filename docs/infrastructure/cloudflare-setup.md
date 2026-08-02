---
sidebar_position: 3
---

# Déploiement et Hébergement

L'écosystème est **auto-hébergé** : des conteneurs Docker derrière un reverse proxy, avec
Cloudflare en frontal pour le DNS, le proxy HTTP et la protection.

:::warning Portée de cette page
Ce que le code prouve est marqué **vérifié**. Le reste décrit la topologie telle qu'elle est
opérée et **n'est pas versionné** : il n'existe aucun manifeste de déploiement dans les dépôts,
pas de `docker-compose.yml` de production, pas de configuration de reverse proxy, pas de manifeste
Cloudflare. Cette page est donc la seule trace écrite de cette partie de l'infrastructure : toute
modification opérée sur le serveur doit y être reportée.
:::

---

## 1. Topologie

```text
Internet
   │
   ▼
Cloudflare (DNS + proxy + WAF + TLS)
   │
   ▼
Reverse proxy  ── app.set('trust proxy', 1)  ← vérifié
   ├── 3levent.fr        → conteneur 3levent        : 3000
   ├── live.3levent.fr   → conteneur 3levent-live   : 3001
   ├── panel.3levent.fr  → conteneur 3levent-panel  : 3200
   ├── sso.3levent.fr    → Authentik
   ├── vault.3levent.fr  → Infisical
   └── doc.3levent.fr    → cette documentation (GitHub Pages)
                │
   Réseau interne (non exposé)
   ├── MongoDB   (une base par application)
   ├── Redis     (hôte `le3-redis` par défaut)
   ├── MySQL     (base du plugin)
   └── Pterodactyl → serveur Minecraft
```

Les noms de conteneurs (`3levent`, `3levent-live`, `3levent-panel`) sont hérités de l'ancien
nommage des dépôts, renommés depuis en `LE3-Web-Main`, `LE3-Web-Live` et `LE3-Web-Panel`. Les logs
de démarrage du panel utilisent toujours les noms de conteneurs.

Faits vérifiés dans le code :

* Les trois applications déclarent `app.set('trust proxy', 1)` : exactement **un** proxy en amont.
  Une couche supplémentaire fausserait l'IP client et le drapeau `secure` du cookie.
* Les cookies sont posés sur `.3levent.fr` en production. Le partage de session Core ↔ Live
  dépend de ce domaine parent commun.
* CORS est en liste blanche : `['https://3levent.fr', 'https://live.3levent.fr']`.
* La CSP du Core autorise `https://static.cloudflareinsights.com` : Cloudflare Web Analytics est
  actif sur le site public.
* `REDIS_URL` vaut par défaut `redis://le3-redis:6379`, un nom d'hôte de réseau Docker.

---

## 2. Cloudflare

### DNS et TLS

* Tous les sous-domaines applicatifs sont en mode **proxy** (nuage orange).
* **SSL/TLS en Full (Strict)** obligatoire : les applications émettent elles-mêmes un en-tête HSTS
  d'un an avec `includeSubDomains` et `preload`. Un mode « Flexible » créerait une boucle de
  redirection avec `upgradeInsecureRequests`.
* Le trafic Minecraft (port de jeu) ne peut pas passer par le proxy HTTP de Cloudflare : il
  emprunte un enregistrement DNS non proxifié ou Cloudflare Spectrum.

### Protection

| Fonction | Usage |
| :--- | :--- |
| WAF | Filtrage des injections et des scans sur `/api/*` |
| Protection DDoS | Niveaux 3, 4 et 7, active par défaut |
| Rate limiting | `/api/live/leaderboard` est la route la plus sollicitée pendant l'événement |
| Bot management | Limitation du scraping du classement |

:::note Le cache applicatif absorbe déjà les pics
`GET /api/live/leaderboard` est mis en cache **5 secondes** dans Redis, côté application. Une
règle de cache Cloudflare sur cette route doit rester **inférieure ou égale** à cette durée, sous
peine d'afficher un classement figé pendant l'événement.
:::

### Ce que Cloudflare ne fait PAS ici

Pas de **Pages**, pas de **Workers**, pas de **Tunnels**. Aucun `wrangler.toml`, aucune dépendance
`wrangler`, aucun script de déploiement Cloudflare n'existe dans les dépôts. Cloudflare est utilisé
comme frontal réseau, pas comme plateforme d'exécution.

---

## 3. Déploiement d'une application web

Le `Dockerfile` (identique dans les trois dépôts) attend que **le contenu de `dist/` soit à la
racine** : la commande est `node backend/server.js`, pas `dist/backend/server.js`.

```bash
npm ci
npm run build          # → dist/backend, dist/public, CSS, assets
# déployer le contenu de dist/ à la racine du contexte de build
docker build -t le3-<app>:<version> .
docker run -d --env-file .env -p <port>:<port> le3-<app>:<version>
```

Points d'attention :

* `NODE_ENV=production` conditionne le domaine du cookie, le drapeau `secure` et `proxy: true`.
  L'oublier casse silencieusement les sessions en production.
* Les conteneurs doivent partager le **même réseau Docker** que Redis : le bus d'événements, le
  cache d'équipes et les drapeaux de maintenance en dépendent.
* L'arrêt propre est géré par le Core et le Panel (`SIGINT`/`SIGTERM`) : utilisez `docker stop`,
  jamais `kill -9`, pour laisser les connexions Redis et le pool MySQL se fermer.

Un workflow `deploy.yml` automatise cette séquence en SSH sur push vers `main`, mais reste inerte
tant que la variable de dépôt `DEPLOY_ENABLED` ne vaut pas `true`. Voir
[CI/CD](./github-actions).

### Vérification post-déploiement

```bash
docker logs <conteneur> | head -30
```

Les journaux de démarrage confirment la configuration effective :

```text
🚀 [3LEVENT] Core Server Active: http://localhost:3000
📁 Resolved Public Path: /app/public
⚙️  Environment: PRODUCTION
[LE3-REDIS] ✅ Connecté avec succès
```

Sur le panel, une ligne supplémentaire prouve que le Redis est bien partagé avec les sites
publics :

```text
[LE3-PANEL] Maintenance synchronised -> 3levent: OFF, 3levent-live: OFF
```

:::danger Si cette ligne manque, le Redis n'est pas partagé
Le panel et les sites publics ne parlent alors pas au même Redis. Conséquence : le mode
maintenance, le bus d'événements et le cache d'équipes ne circulent plus, sans qu'aucune erreur
ne soit levée nulle part.
:::

---

## 4. Déploiement du plugin

1. Récupérer le JAR : artefact `deploy-dev.yml` (dev) ou Release GitHub (production).
2. Vérifier le checksum SHA-256 fourni avec la release.
3. Déposer dans `plugins/` du serveur Paper via Pterodactyl.
4. Vérifier la section `redis` de `plugins/LE3CorePlugin/config.yml` : `redis.uri` doit valoir
   exactement le `REDIS_URL` des applications web.
5. Redémarrer le serveur.

Le plugin contacte le Core au démarrage : le site doit être joignable, sinon le démarrage est
retardé jusqu'au timeout de 10 secondes et aucune équipe n'est chargée.

---

## 5. Documentation (`LE3-Documentation`)

Docusaurus 3, publié sur `doc.3levent.fr` avec `deploymentBranch: 'gh-pages'`, donc GitHub Pages,
et non Cloudflare Pages. Le workflow `deploy.yml` du dépôt compile et publie à chaque push sur
`main`.

```bash
npm run build     # échoue sur tout lien interne cassé (onBrokenLinks: 'throw')
npm run serve     # prévisualisation du build
```

---

### Prochaines étapes

* **[CI/CD (GitHub Actions)](./github-actions)**
* **[Gestion des secrets](./secrets-management)**
* **[Vue d'ensemble](../architecture/overview)**
