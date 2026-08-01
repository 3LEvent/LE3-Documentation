---
sidebar_position: 3
---

# Déploiement et Hébergement

L'écosystème est **auto-hébergé** : des conteneurs Docker derrière un reverse proxy, avec
Cloudflare en frontal pour le DNS, le proxy HTTP et la protection.

:::warning Portée de cette page
Ce que le code prouve est marqué **vérifié**. Le reste décrit la topologie telle qu'elle est
opérée et **n'est pas versionné** : il n'existe aujourd'hui aucun manifeste de déploiement dans
les dépôts (pas de `docker-compose.yml` de production, pas de configuration de reverse proxy, pas
de manifeste Cloudflare). Documenter - puis versionner - cette configuration est le chantier
d'infrastructure prioritaire.
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
   └── doc.3levent.fr    → cette documentation
                │
   Réseau interne (non exposé)
   ├── MongoDB   (une base par application)
   ├── Redis     (hôte `le3-redis` par défaut)
   ├── MySQL     (base du plugin)
   └── Pterodactyl → serveur Minecraft
```

Faits vérifiés dans le code :

* Les trois applications déclarent `app.set('trust proxy', 1)` : exactement **un** proxy en amont.
  Une couche supplémentaire fausserait l'IP client et le drapeau `secure` du cookie.
* Les cookies sont posés sur `.3levent.fr` en production - le partage de session Core ↔ Live
  dépend de ce domaine parent commun.
* CORS est en liste blanche : `['https://3levent.fr', 'https://live.3levent.fr']`.
* La CSP du Core autorise `https://static.cloudflareinsights.com` : Cloudflare Web Analytics est
  actif sur le site public.
* `REDIS_URL` vaut par défaut `redis://le3-redis:6379` - un nom d'hôte de réseau Docker.

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
| Rate limiting | À calibrer sur `/api/live/leaderboard` (le plus sollicité pendant l'événement) |
| Bot management | Limitation du scraping du classement |

:::note Le cache Redis absorbe déjà les pics
`GET /api/live/leaderboard` est mis en cache 5 secondes côté application. Une règle de cache
Cloudflare sur cette route doit rester **inférieure ou égale** à cette durée, sous peine
d'afficher un classement figé pendant l'événement.
:::

### Ce que Cloudflare ne fait PAS ici

Pas de **Pages**, pas de **Workers**, pas de **Tunnels** dans l'écosystème actuel. Aucun
`wrangler.toml`, aucune dépendance `wrangler`, aucun script de déploiement Cloudflare n'existe
dans les dépôts. Cloudflare est utilisé comme frontal réseau, pas comme plateforme d'exécution.

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
* Les conteneurs doivent partager le **même réseau Docker** que Redis : le bus d'événements et les
  drapeaux de maintenance en dépendent.
* L'arrêt propre est géré (`SIGINT`/`SIGTERM`) : utilisez `docker stop`, jamais `kill -9`, pour
  laisser les connexions Redis et le pool MySQL se fermer.

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
[LE3-PANEL] Maintenance synchronisée → 3levent: OFF, 3levent-live: OFF
```

Si cette ligne manque ou affiche une erreur, le panel et les sites publics ne parlent pas au même
Redis.

---

## 4. Déploiement du plugin

1. Récupérer le JAR : artefact `deploy-dev.yml` (dev) ou Release GitHub (production).
2. Vérifier le checksum SHA-256 fourni avec la release.
3. Déposer dans `plugins/` du serveur Paper via Pterodactyl.
4. Redémarrer le serveur.

Le plugin contacte le Core au démarrage : le site doit être joignable, sinon le démarrage est
retardé de 10 secondes et les équipes ne sont pas chargées.

---

## 5. Documentation (`LE3-Documentation`)

Docusaurus 3, publié sur `doc.3levent.fr` avec `deploymentBranch: 'gh-pages'` - donc GitHub Pages,
et non Cloudflare Pages.

```bash
npm run build     # échoue sur tout lien interne cassé (onBrokenLinks: 'throw')
npm run serve     # prévisualisation du build
```

---

## 6. Chantiers ouverts

1. **Versionner l'infrastructure** : `docker-compose.prod.yml`, configuration du reverse proxy,
   règles Cloudflare. Aujourd'hui, cette connaissance n'existe que dans la tête des opérateurs.
2. **Automatiser le déploiement web** : voir [CI/CD](./github-actions) §5.
3. **Sauvegardes** : aucune procédure automatisée n'existe pour MongoDB et MySQL. À définir, à
   tester par une restauration réelle, et à documenter ici.
4. **Supervision** : le panel surveille le serveur Minecraft, mais rien ne surveille les trois
   applications web ni Redis.

---

### Prochaines étapes

* **[CI/CD (GitHub Actions)](./github-actions)**
* **[Gestion des secrets](./secrets-management)**
* **[Vue d'ensemble](../architecture/overview)**
