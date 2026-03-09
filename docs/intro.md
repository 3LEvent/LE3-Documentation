---
sidebar_position: 1
---

# Introduction au Développement 3LEvent

Bienvenue sur la documentation technique officielle du **3LEvent**. Ce portail centralise l'ensemble des ressources, standards et procédures nécessaires au développement et à la maintenance de l'écosystème (Plugins Minecraft, Applications Web, Bots et Infrastructure).

L'objectif de cette documentation est de garantir une cohérence technique absolue entre les différents collaborateurs et modules du projet.

## Architecture de l'Écosystème

L'écosystème 3LEvent repose sur quatre piliers interconnectés :

1.  **Serveurs de Jeu (Java)** : Plugins propriétaires basés sur l'API Paper pour la gestion du gameplay, des épreuves et du noyau central.
2.  **Interface Web (Angular)** : Dashboard, classements en temps réel et portail d'inscription.
3.  **Automates (Node.js/TypeScript)** : Bot Discord centralisant les logs, la modération et les alertes de sécurité.
4.  **Infrastructure (Cloudflare/GitHub)** : Gestion du réseau, des tunnels de sécurité et de l'intégration continue (CI/CD).

## Environnement Technique

Tous les développeurs doivent s'aligner sur la stack technologique suivante pour assurer la compatibilité des modules :

| Composant | Technologie | Version Requise (2026) |
| :--- | :--- | :--- |
| **Backend Minecraft** | Java | 21+ |
| **Scripts / Bots** | Node.js / TypeScript | 20.x+ / 5.x+ |
| **Frontend Web** | Angular | 17+ |
| **Gestionnaire de Paquets** | npm / Maven / Gradle | Dernières versions stables |
| **Infrastructure** | Cloudflare | Tunnels & WAF |

## Standards de Développement

### 1. Normalisation du Code
Le code doit être autodocumenté et suivre les conventions de nommage strictes :
* **Java** : Respect des [Google Java Style Guide].
* **TypeScript** : Linting obligatoire via les fichiers de configuration présents dans les templates.
* **Dépôts** : Tous les noms de dépôts doivent être préfixés par `LE3-`.

### 2. Utilisation des Templates
Pour garantir la conformité du design et de la structure, aucun projet ne doit être démarré de zéro. Utilisez les dépôts de référence (Template Repository) :
* `LE3-Plugin-Template` : Pour tout nouveau module Minecraft.
* `LE3-Web-Template` : Pour toute application ou page satellite.
* `LE3-App-Template` : Pour les services TypeScript/Node.js.

### 3. Workflow Git
L'organisation utilise une stratégie de branchement stricte :
* **main** : Branche de production, protégée.
* **develop** : Branche d'intégration pour les tests.
* **feature/** : Branche isolée pour le développement de nouvelles fonctionnalités.

Chaque modification doit impérativement faire l'objet d'une **Pull Request** validée par le système de CI/CD (`LE3-Shared-Workflows`).

## Sécurité et Secrets

Aucune clé d'API, jeton de bot ou identifiant de base de données ne doit apparaître en clair dans le code source.
* **GitHub Secrets** : Tous les secrets sont centralisés au niveau de l'organisation 3LEvent sur GitHub.
* **Environnement** : Utilisez les variables d'environnement injectées dynamiquement lors du déploiement via les Workflows.

---

### Prochaines étapes

Pour commencer à contribuer, veuillez consulter les sections suivantes :

* **[Configuration de l'environnement de développement](./guidelines/setup)**
* **[Guide d'utilisation de Git et GitHub](./workflow/git-conventions)**
* **[Bibliothèque de Snippets et Design System](./guidelines/code-snippets)**