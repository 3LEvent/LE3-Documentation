---
sidebar_position: 11
---

# Configuration et Infrastructure Cloudflare

Cloudflare constitue la porte d'entrée unique de l'écosystème **3LEvent**. Il assure la protection contre les attaques par déni de service (DDoS), la gestion du trafic DNS et l'hébergement des services front-end.

---

## 1. Cloudflare Pages (Frontend)

Toutes les applications Angular (ex: `LE3-Web-Main`) sont hébergées via Cloudflare Pages.

### Processus de déploiement
* **Automatisation** : Le déploiement est déclenché par les GitHub Actions définies dans `LE3-Shared-Workflows`.
* **Environnements** :
    * Chaque branche `feat/*` génère une **Preview URL** unique.
    * La branche `main` déploie directement sur le domaine de production.
* **Optimisation** : Les assets sont automatiquement minifiés et distribués via le réseau Edge de Cloudflare pour garantir un temps de chargement minimal durant l'événement.

---

## 2. Cloudflare Tunnels (Connexion Sécurisée)

Pour exposer les services internes (Bases de données, APIs privées ou serveurs de monitoring) sans ouvrir de ports sur les pare-feu locaux, nous utilisons **Cloudflare Tunnel (cloudflared)**.

### Architecture
* **Sécurité** : Le tunnel établit une connexion sortante vers Cloudflare. Le serveur n'est jamais exposé directement sur l'internet public.
* **Usage** : Utilisé pour relier les serveurs de jeu Minecraft aux outils d'administration web et aux bases de données Redis/SQL.



---

## 3. Cloudflare Workers (Micro-services)

Les fonctions "Serverless" sont utilisées pour les tâches légères ne nécessitant pas un serveur dédié :
* **Redirection dynamique** : Gestion des URLs courtes pour l'événement.
* **Gateway API** : Validation des jetons d'authentification avant de transmettre la requête aux serveurs principaux.
* **Webhooks** : Traitement intermédiaire des alertes provenant de GitHub ou de Stripe vers Discord.

---

## 4. Sécurité et Pare-feu (WAF)

La protection de l'infrastructure est segmentée en plusieurs couches :

| Fonctionnalité | Application |
| :--- | :--- |
| **WAF Rules** | Blocage des injections SQL et des scans de vulnérabilités sur les API Web. |
| **DDoS Protection** | Protection automatique de niveau 3, 4 et 7 (activée par défaut). |
| **Bot Management** | Limitation du scraping des données de classement en temps réel. |
| **Zero Trust / Access** | Authentification obligatoire via Discord/GitHub pour accéder aux panels d'administration. |

---

## 5. Gestion DNS et Certificats

* **Enregistrements DNS** : Tous les sous-domaines (`api.`, `play.`, `dev.`) doivent être configurés en mode "Proxy" (nuage orange) pour bénéficier de la protection Cloudflare, sauf exception technique (ex: certains flux Minecraft spécifiques).
* **SSL/TLS** : Le mode **Full (Strict)** est obligatoire. Cloudflare gère le renouvellement automatique des certificats Edge.

---

## 6. Procédure de Configuration d'un nouveau Service

Pour intégrer un nouveau service satellite dans Cloudflare :
1.  **Création du projet** sur le dashboard Cloudflare (Pages ou Workers).
2.  **Liaison GitHub** : Connecter le dépôt `LE3-*` correspondant.
3.  **Secrets** : Récupérer le `CLOUDFLARE_API_TOKEN` et l'ajouter aux secrets du dépôt GitHub.
4.  **DNS** : Configurer le CNAME ou le sous-domaine souhaité dans la section DNS.

---

### Prochaines étapes

* **[Consulter les Workflows de déploiement](./infrastructure/github-actions)**
* **[Guide de gestion des Secrets](./infrastructure/secrets-management)**