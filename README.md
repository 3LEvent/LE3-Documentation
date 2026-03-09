# 3LEvent Developer Portal

Ce dépôt contient le code source de la documentation technique officielle de l'écosystème **3LEvent**. Ce portail centralise les spécifications, les standards de code et les guides d'infrastructure pour les modules Minecraft, Web et Discord.

---

## 1. Stack Technique

* **Framework** : Docusaurus 3.x (Static Site Generator)
* **Langage** : TypeScript / React
* **Design System** : Slate & Emerald (Basé sur Tailwind/Inter)
* **Diagrammes** : Mermaid.js intégré

---

## 2. Installation

Assurez-vous d'avoir [Node.js](https://nodejs.org/) (v20+) installé sur votre machine.

```bash
# Installation des dépendances
npm install

```

---

## 3. Développement Local

Pour lancer le serveur de développement et prévisualiser vos modifications en temps réel :

```bash
# Lancement du serveur (sans ouverture automatique du navigateur)
npm start

```

Le site sera accessible à l'adresse : `http://localhost:3000/`.

---

## 4. Structure du Projet

* `/docs` : Contenu de la documentation (fichiers Markdown/MDX).
* `/architecture` : Schémas de données et protocoles.
* `/guidelines` : Standards de code et design system.
* `/infrastructure` : Documentation CI/CD et Cloudflare.
* `/projects` : Détails techniques des différents modules.


* `/src/components` : Composants React personnalisés (ex: HomepageFeatures).
* `/src/css` : Fichiers de styles globaux (`custom.css`).

---

## 5. Build et Production

### Génération du site statique

```bash
npm run build

```

Les fichiers générés se trouveront dans le répertoire `/build`.

### Déploiement

Le déploiement est automatisé via **GitHub Actions** lors d'un push sur la branche `main`. Le site est servi via **Cloudflare Pages** à l'adresse [doc.3levent.fr](https://doc.3levent.fr).

---

## 6. Contributions

Toute modification de la documentation doit respecter les principes suivants :

1. **Zéro Emoji** : Les titres et labels doivent rester sobres et professionnels.
2. **Standardisation** : Suivre les [Coding Standards](https://www.google.com/search?q=./docs/guidelines/coding-standards.md) pour les exemples de code.
3. **Validation** : Vérifier l'absence de liens cassés avant chaque Pull Request.

---

© 2026 3LEvent Organization. Tous droits réservés.