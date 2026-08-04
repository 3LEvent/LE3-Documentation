# LE3-Documentation

Documentation technique publique de l'écosystème 3LEvent. Docusaurus 3, déployé sur
`doc.3levent.fr` via GitHub Pages.

## Avant toute intervention

Lire dans le dépôt d'organisation [`.github`](https://github.com/3LEvent/.github) :

- **`ai/contexte-organisation.md`** : invariants et pièges valables partout. Obligatoire.
- `ai/projet-existant.md` : méthode d'intervention.

## Ce dépôt est public

Le seul de l'organisation. **Rien de ce qui est écrit ici n'est privé** : ni adresse IP interne,
ni nom d'hôte d'exploitation, ni chemin de serveur, ni valeur ressemblant à un secret, ni
identifiant de projet dans un coffre.

C'est aussi le seul dépôt qui porte un ruleset réellement appliqué par GitHub, `LE3-Standard-Main`
sur la branche par défaut : PR obligatoire, fusion en squash uniquement, historique linéaire,
suppression et `push --force` interdits. Un push direct sur `main` est rejeté.

## La règle qui prime sur toutes les autres

**Cette documentation décrit ce qui est déployé, pas une cible idéale.** Chaque affirmation
technique doit être vérifiable dans le code des dépôts référencés.

Ne jamais documenter une intention, un projet ou un comportement supposé. Quand le code et la
documentation divergent, c'est la documentation qui a tort : la corriger, et signaler la
divergence.

## Ajouter une page

Deux écritures, la seconde est systématiquement oubliée.

1. Créer le fichier sous `docs/<categorie>/<nom>.md` avec un front-matter `sidebar_position`.
2. **Ajouter l'entrée dans `sidebars.ts`.** Une page absente du sidebar est invisible, sans que
   le build ne signale quoi que ce soit.

Les classes `sidebar-icon-*` déclarées dans `sidebars.ts` ne sont stylées nulle part : elles sont
inertes, mais la convention est de continuer à les renseigner.

## Commandes

```bash
npm install
npm start              # serveur de développement
npm run build          # échoue sur un lien interne cassé, à lancer avant toute PR
npm run serve          # sert le build de production
```

`npm run build` est la seule vérification qui compte : il détecte les liens internes cassés et
les références de sidebar invalides.

## Conventions de rédaction

Documentation d'équipe en **français**. Les identifiants, noms de fichiers et extraits de code
restent en anglais.

**Jamais de tiret cadratin.** Deux-points quand le tiret introduit une explication, virgule
sinon. Le dépôt en compte zéro, c'est vérifiable :

```bash
git grep -c '—' -- '*.md'
```

## Ce qui exige une question

Publication d'une information d'infrastructure. Suppression d'une page référencée ailleurs.
Modification du ruleset.
