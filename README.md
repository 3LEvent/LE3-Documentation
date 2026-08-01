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
# Lancement du serveur
# Note : BROWSER=none évite les erreurs d'ouverture automatique sur certains navigateurs (Arc/macOS)
BROWSER=none npm start

```

Le site sera accessible à l'adresse : `http://localhost:3000/`.

---

## 4. Structure du Projet

Le contenu est organisé de manière modulaire dans le répertoire `/docs` :

* `docs/architecture/` : Schémas de données, ERD et protocoles de communication.
* `docs/guidelines/` : Standards de code, snippets et design system.
* `docs/workflow/` : Conventions Git et processus de Pull Request.
* `docs/infrastructure/` : Documentation CI/CD, Secrets et Cloudflare.
* `docs/projects/` : Spécifications propres aux plugins Minecraft, apps Web et Bots.

Les éléments de style et composants sont situés dans `/src` :

* `src/components/` : Composants React (ex: HomepageFeatures).
* `src/css/custom.css` : Design System global.

---

## 5. Build et Production

### Génération du site statique

```bash
npm run build

```

Les fichiers générés se trouvent dans le répertoire `/build`.

### Déploiement

Le déploiement est automatisé via **GitHub Actions** à chaque push sur la branche `main`. Le workflow compile le projet et publie le contenu sur **GitHub Pages** (configuré sur le domaine `doc.3levent.fr`).

---

## 6. Contributions

Toute modification de la documentation doit respecter les principes suivants :

1. **Zéro Emoji** : Les titres, labels et menus doivent rester sobres et professionnels.
2. **Standardisation** : Se référer aux [Coding Standards](./docs/guidelines/coding-standards.md) pour les exemples de code.
3. **Validation** : Vérifier que `npm run build` passe sans erreur avant de push. L'option `onBrokenLinks: 'throw'` bloque le déploiement en cas de liens morts.

---

© 2026 3LEvent Organization. Tous droits réservés.