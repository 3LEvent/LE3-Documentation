---
sidebar_position: 3
---

# Applications Web et Portails

Les applications web de l'écosystème **3LEvent** constituent l'interface principale entre les participants, les spectateurs et l'infrastructure technique. Cette section documente la stack technique, les standards de développement et les processus de déploiement des portails web.

---

## 1. Stack Technique de Référence

Toutes les applications web modernes de l'organisation doivent s'aligner sur la stack suivante pour garantir une maintenance homogène :

| Composant | Technologie | Détails |
| :--- | :--- | :--- |
| **Framework** | Angular 17+ | Utilisation des *Standalone Components* et des *Signals*. |
| **Langage** | TypeScript | Mode strict activé obligatoirement. |
| **Styling** | Tailwind CSS | Design System basé sur la charte Slate & Emerald. |
| **State Management** | TanStack Query | Pour la gestion du cache serveur et des requêtes asynchrones. |
| **Hosting** | Cloudflare Pages | Déploiement à l'Edge pour une latence minimale. |

---

## 2. Architecture des Applications

Nos applications sont structurées pour séparer strictement la logique métier de la présentation.

### Structure des dossiers
* `src/app/core/` : Services globaux, intercepteurs HTTP et authentification.
* `src/app/shared/` : Composants UI réutilisables, pipes et directives.
* `src/app/features/` : Modules fonctionnels (ex: dashboard, classement, profil).
* `src/assets/` : Ressources statiques, icônes et configurations environnementales.

### Gestion du State
L'utilisation des **Signals** d'Angular est privilégiée pour la réactivité locale. Pour les données partagées de manière complexe, l'utilisation d'un Store léger (RxJS) est autorisée.

---

## 3. Standards de Développement

Pour assurer la qualité du code, les règles suivantes s'appliquent :

1.  **Composants Standalone** : Aucun module `NgModule` ne doit être utilisé pour les nouveaux composants.
2.  **Hydratation et SSR** : Le Server-Side Rendering (SSR) doit être activé pour les pages publiques afin d'optimiser le SEO et le temps de chargement initial.
3.  **Normalisation UI** : Les composants doivent utiliser les variables CSS définies dans le [Design System](../guidelines/design-system.md).
4.  **Tests** : Chaque service critique doit être couvert par des tests unitaires (Jasmine/Karma ou Vitest).

---

## 4. Sécurité et Performance

### Sécurité périmétrique
* **Cloudflare WAF** : Protection contre les attaques DDoS et filtrage des requêtes malveillantes.
* **Content Security Policy (CSP)** : Politique stricte définie via les headers Cloudflare pour prévenir les injections XSS.
* **JWT (JSON Web Tokens)** : Stockage sécurisé des tokens de session dans des cookies `HttpOnly` et `Secure`.

### Optimisation des performances
* **Lazy Loading** : Chargement différé de toutes les routes de fonctionnalités.
* **Image Optimization** : Utilisation de formats modernes (WebP/AVIF) et chargement différé (*lazy loading* natif).
* **Brotli Compression** : Activée par défaut via l'infrastructure Cloudflare.

---

## 5. Pipeline de Déploiement (CI/CD)

Le cycle de vie d'une application web suit ce workflow automatisé :

1.  **Push** sur une branche de fonctionnalité : Déclenchement d'un *Preview Deployment* Cloudflare.
2.  **Pull Request** : Exécution des tests unitaires et du linting via GitHub Actions.
3.  **Merge sur main** : Build de production et déploiement immédiat sur le domaine principal (ex: `app.3levent.fr`).

Pour plus de détails sur les workflows, consultez le guide [GitHub Actions](../infrastructure/github-actions.md).

---

## 6. Maintenance

Les dépendances doivent être mises à jour trimestriellement à l'aide de `npm outdated`. Une attention particulière est portée aux mises à jour majeures d'Angular pour ne jamais avoir plus d'une version de retard sur la branche stable.

---

### Prochaines étapes

* **[Consulter les Standards de Code](../guidelines/coding-standards.md)**
* **[Guide de déploiement Cloudflare](../infrastructure/cloudflare-setup.md)**