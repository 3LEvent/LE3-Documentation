---
sidebar_position: 1
---

# Vue d'ensemble de l'écosystème

L'écosystème **3LEvent** est une suite logicielle intégrée conçue pour propulser un événement Minecraft compétitif de grande envergure. Cette plateforme ne se limite pas au serveur de jeu ; elle englobe une infrastructure web temps réel, des outils d'automatisation communautaire et une chaîne de déploiement sécurisée.

---

## 1. Architecture Globale

L'architecture est de type **modulaire et distribuée**. Elle repose sur une communication bidirectionnelle entre le moteur de jeu (Java) et les services satellites (Node.js/Angular).



### Flux de données principaux :
1.  **Gameplay ↔ Database** : Les statistiques des joueurs (points, succès, kills) sont enregistrées en temps réel depuis les serveurs Minecraft.
2.  **Database ↔ API/Web** : Le site internet (`LE3-Web-Main`) interroge ces données pour afficher les classements en direct et les profils d'équipes.
3.  **Minecraft ↔ Discord** : Le bot (`LE3-App-DiscordBot`) transmet les logs de modération et les alertes de sécurité pour une surveillance staff déportée.

---

## 2. Composants Clés

L'écosystème est structuré autour de quatre piliers technologiques :

| Composant | Rôle | Stack Technique |
| :--- | :--- | :--- |
| **Moteur de Jeu** | Gestion du gameplay, des épreuves et du monde. | Java 21, Paper API |
| **Interface Web** | Dashboard public, inscriptions et statistiques. | Angular, Tailwind CSS |
| **Automates** | Bot Discord, synchronisation des comptes et logs. | Node.js, TypeScript |
| **Infrastructure** | Réseau, sécurité, tunnels et CI/CD. | Cloudflare, GitHub Actions |

---

## 3. Répartition des Dépôts (Repositories)

L'organisation GitHub est segmentée pour assurer une séparation nette des responsabilités :

* **Templates (`LE3-*-Template`)** : Dépôts de référence pour garantir que chaque nouveau module hérite des standards de l'organisation.
* **Core (`LE3-Plugin-Core`)** : Le noyau central dont dépendent tous les autres plugins de l'événement.
* **Infrastructure (`LE3-Shared-Workflows`)** : Le moteur centralisant l'automatisation du build et du déploiement.
* **Satellites (`LE3-Plugin-*`)** : Les modules spécifiques à chaque mini-jeu (FlagWars, DeadHands, etc.).

---

## 4. Philosophie de Développement

Pour maintenir une cohérence maximale sur un projet de cette envergure, chaque contributeur doit suivre trois principes fondamentaux :

### Normalisation
Tout code produit doit être identique dans sa structure, qu'il s'agisse d'un plugin Java ou d'une application Angular. Cela passe par l'utilisation stricte de nos [Coding Standards](../guidelines/coding-standards).

### Sécurité par Design
Aucune donnée sensible ne transite en clair. L'utilisation des [GitHub Secrets](../infrastructure/secrets-management) et des tunnels Cloudflare est obligatoire pour toute communication inter-services.

### Automatisation
"If it’s not automated, it’s broken." Aucun déploiement ne se fait manuellement. Tout passage en production est validé par une suite de tests et un build automatisé via [GitHub Actions](../infrastructure/github-actions).

---

## 5. Roadmap Technique

L'écosystème est conçu pour être extensible. Les développements futurs incluent :
* L'intégration d'applications mobiles satellites.
* La mise en place d'un système de replay web 2D basé sur les logs de position.
* L'automatisation complète de la gestion des serveurs via Kubernetes ou des conteneurs isolés.

---

### Prochaines étapes

Pour une immersion technique immédiate, consultez :
* **[Les standards de programmation](../guidelines/coding-standards)**
* **[Le guide de configuration de l'environnement](../guidelines/setup)**