---
sidebar_position: 9
---

# Bot Discord Central

Le dépôt `LE3-App-DiscordBot` héberge le bot officiel du **3LEvent**. Il agit comme une passerelle automatisée entre l'infrastructure de jeu, le site web et les serveurs de communication.

---

## 1. Stack Technique et Framework

Le bot doit être développé en respectant la stack technique unifiée de l'organisation :

| Composant | Technologie | Version |
| :--- | :--- | :--- |
| **Runtime** | Node.js | 20.x+ (LTS) |
| **Langage** | TypeScript | 5.x+ |
| **Librairie** | discord.js | v14+ |
| **Gestionnaire** | npm | Dernière version stable |

---

## 2. Rôles et Responsabilités

Le bot centralise plusieurs fonctions critiques :
* **Inscriptions** : Liaison entre les comptes Discord et les pseudos Minecraft via l'API Web.
* **Logs de Sécurité** : Reporting en temps réel des actions de modération et des alertes de sécurité (logs anti-triche).
* **Automates** : Gestion des salons temporaires, attribution des rôles d'équipes et annonces automatiques du calendrier.
* **Interactions API** : Commandes Slash pour consulter les scores et l'état des serveurs sans être en jeu.

---

## 3. Architecture du Code

Le projet doit suivre une structure modulaire pour faciliter la maintenance :

* `src/commands/` : Dossier contenant la logique des commandes Slash (une classe ou un fichier par commande).
* `src/events/` : Gestionnaires d'événements Discord (ready, interactionCreate, messageCreate).
* `src/services/` : Logique métier (connexion à la base de données, appels API 3LEvent).
* `src/utils/` : Fonctions utilitaires, formatage des embeds et gestionnaires d'erreurs.

---

## 4. Standards de Développement

### Typage Strict
L'utilisation du type `any` est proscrite. Chaque interaction, membre ou message doit être correctement typé selon les interfaces fournies par `discord.js`.

### Gestion des Embeds
Pour maintenir la cohérence visuelle avec le site web, les embeds doivent respecter la charte graphique :
* **Couleur** : Utilisation de la couleur primaire de l'évenement (définie dans la config globale).
* **Footer** : Mention systématique du "3LEvent - Système Automatisé".
* **Icons** : Utilisation des icônes de l'organisation pour les titres.

### Commandes Slash
Toutes les nouvelles fonctionnalités doivent être implémentées via des **Slash Commands**. Les commandes textuelles classiques (préfixes) sont réservées exclusivement aux outils de debug interne.

---

## 5. Sécurité et Secrets

La sécurité du bot est primordiale car il possède des permissions administratives :

1.  **Token** : Le jeton du bot (`DISCORD_TOKEN`) ne doit jamais apparaître dans le code. Il doit être récupéré via `process.env`.
2.  **Environnements** :
    * **Développement** : Utilisez un bot de test et un serveur Discord dédié au staff.
    * **Production** : Seuls les Workflows GitHub ont accès au token de production.
3.  **Filtrage** : Toute commande administrative doit être protégée par une vérification de rôle (ex: `PermissionsBitField.Flags.Administrator`).

---

## 6. Déploiement (CI/CD)

Le déploiement est automatisé via `LE3-Shared-Workflows` :
* **Build** : Compilation TypeScript vers JavaScript.
* **Linting** : Vérification de la conformité du code via ESLint.
* **Runtime** : Le bot est exécuté via un gestionnaire de processus (type PM2 ou conteneur Docker) assurant un redémarrage automatique en cas d'erreur.

---

### Prochaines étapes

* **[Consulter les Snippets TypeScript](./guidelines/code-snippets)**
* **[Accéder à la liste des Secrets de l'Organisation](./infrastructure/secrets-management)**