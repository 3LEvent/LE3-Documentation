# LE3-Documentation

Code source de la documentation technique officielle de l'écosystème **3LEvent**, publiée sur
**[doc.3levent.fr](https://doc.3levent.fr)**.

Ce portail fait autorité sur l'architecture, les conventions, la gestion des secrets et la CI/CD.
Il décrit **ce qui est déployé**, pas une cible idéale : chaque affirmation technique doit être
vérifiable dans le code des dépôts référencés.

---

## Stack

| Composant | Choix |
|---|---|
| Framework | Docusaurus 3 |
| Langue | Français (`i18n` sur `fr`) |
| Diagrammes | Mermaid, rendu nativement |
| Déploiement | GitHub Pages, branche `gh-pages`, domaine `doc.3levent.fr` |

C'est le seul dépôt **public** de l'organisation.

---

## Installation

Node.js 20 ou supérieur.

```bash
npm install
```

---

## Développement local

```bash
npm start
```

> ⚠️ Docusaurus occupe le port **3000** par défaut, exactement comme `LE3-Web-Main`. Si le Core
> tourne déjà, lancez `npm start -- --port 3100`.

Sur macOS avec certains navigateurs (Arc notamment), `BROWSER=none npm start` évite les erreurs
d'ouverture automatique.

---

## Build et prévisualisation

```bash
npm run build   # génère /build
npm run serve   # sert le build localement
```

> ⚠️ **Toujours lancer `npm run build` avant d'ouvrir une PR.** `onBrokenLinks: 'throw'` fait
> échouer le build sur le moindre lien interne cassé, et c'est le même build qui publie le site.

---

## Structure

```text
docs/
├── intro.md                    # Point d'entrée : services, stack, standards
├── architecture/
│   ├── overview.md             # Vue d'ensemble, découplage, bus partagé
│   ├── database-schema.md      # Cinq espaces de stockage, collections, tables
│   ├── communication-protocol.md # Tous les canaux inter-services
│   └── authentication.md       # Sessions joueurs et staff, RBAC du panel
├── projects/
│   ├── web-applications.md     # Stack commune aux trois apps web
│   ├── web-core.md             # LE3-Web-Main
│   ├── web-live.md             # LE3-Web-Live
│   ├── staff-panel.md          # LE3-Web-Panel
│   └── minecraft-plugins.md    # LE3-Plugin-Core
├── guidelines/
│   ├── setup.md                # Montage d'un poste de travail
│   ├── coding-standards.md     # Règles vérifiées en revue
│   ├── code-snippets.md        # Modèles extraits du code déployé
│   └── design-system.md        # Tokens Tailwind, composants, in-game
├── infrastructure/
│   ├── secrets-management.md   # Catalogue, Infisical, procédure de fuite
│   ├── github-actions.md       # CI/CD, moteurs partagés
│   └── cloudflare-setup.md     # Déploiement et hébergement
└── workflow/
    ├── git-conventions.md      # Branches, commits, règles coûteuses
    └── pull-request-process.md # Prérequis, revue, fusion
```

Les composants React et le design system global vivent dans `src/` :
`src/components/` et `src/css/custom.css`.

---

## Règles de rédaction

1. **Décrire l'état déployé.** Pas de fonctionnalité prévue, pas de « ce qu'il reste à faire ».
   Le suivi des tâches vit dans GitHub Projects, pas dans la documentation.
2. **Zéro emoji** dans les titres, les libellés et les menus.
3. **Admonitions Docusaurus** pour tout avertissement : `:::danger`, `:::warning`, `:::caution`,
   `:::note`, `:::info`. Chaque bloc porte un **type et un titre**, et se ferme par un `:::` seul
   sur sa ligne. Réservez `:::danger` aux pièges qui cassent quelque chose en silence.
4. **Toujours donner la conséquence.** Un avertissement utile dit ce qui casse, pas seulement ce
   qu'il ne faut pas faire.
5. **Pas de tiret cadratin** dans le texte.
6. **Français** pour la documentation, **anglais** pour les identifiants, le code et les extraits.
7. `npm run build` doit passer avant tout push.

---

## Publication

Le workflow `deploy.yml` compile et publie sur GitHub Pages à chaque push sur `main`.

---

## Licence

Logiciel propriétaire. Voir [LICENSE](LICENSE).

© 2026 3LEvent Organization. Tous droits réservés.
