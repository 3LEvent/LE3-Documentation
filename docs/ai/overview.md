---
sidebar_position: 1
---

# Utilisation de l'IA : outils et périmètre

L'assistance par IA fait partie du flux de travail 3LEvent. Cette section décrit **comment
l'utiliser sans dégrader la qualité du code ni la sécurité de l'infrastructure**, et ce qu'elle
n'a pas le droit de décider à ta place.

Le principe qui gouverne tout le reste : **l'IA propose, un humain valide, et c'est l'humain qui
signe la PR.** Un agent qui se trompe le fait vite, à grande échelle, et avec assurance.

---

## 1. Quel outil pour quel travail

Ces outils ne sont pas interchangeables. Les confondre est la première cause de résultat
décevant.

| Besoin | Outil | Pourquoi |
| :--- | :--- | :--- |
| Architecture, arbitrage technique, revue de conception | **Claude Opus**, en conversation | Le raisonnement long est ce qui coûte cher à produire et ce qui rapporte le plus. Aucun fichier n'est modifié, donc aucun risque |
| Développement, refactor, correction de bug, exploitation | **Claude Code**, en CLI ou dans l'IDE | L'agent lit le dépôt, exécute les tests, voit ses erreurs et se corrige. C'est la boucle de rétroaction qui fait la différence |
| Cadrage produit, découpage en epics et stories | **BMAD-METHOD** via Claude Code | Voir la page dédiée. Utile quand le besoin est flou, contre-productif quand il ne l'est pas |
| Question factuelle sur une API ou une version | N'importe quel modèle, **avec vérification** | Un modèle affirme sur des données d'entraînement datées. Toujours confronter à la doc officielle |

**Le réflexe à prendre** : si la question est « qu'est-ce qu'on fait et pourquoi », c'est une
conversation avec Opus. Si la question est « fais-le », c'est Claude Code dans le dépôt.

## 2. Pourquoi le CLI plutôt que le copier-coller

Coller du code dans une fenêtre de chat prive l'agent de tout ce qui compte : les fichiers
voisins, les conventions du dépôt, le résultat des tests, l'historique Git. Le modèle produit
alors du code plausible et générique, qui ne ressemble pas au reste de la base.

Un agent qui travaille directement dans le dépôt peut :

- lire les fichiers réellement concernés au lieu de deviner leur contenu ;
- exécuter `npm test` et `npm run lint`, constater un échec et le corriger avant de te répondre ;
- vérifier une affirmation par `git log` ou `grep` plutôt que de l'inférer ;
- respecter les conventions locales parce qu'il les a sous les yeux.

Le gain n'est pas la vitesse de frappe, c'est **la vérifiabilité**.

## 3. Ce que l'IA n'a pas le droit de faire seule

Ces limites ne sont pas des précautions de principe. Chacune correspond à un incident réel ou à
une propriété de l'écosystème qui rend l'erreur coûteuse et silencieuse.

| Interdiction | Raison |
| :--- | :--- |
| Commiter sur `main` ou `develop` | Le processus de PR est le seul garde-fou : le plan GitHub Free ne permet aucune protection de branche sur les dépôts privés |
| Supprimer du code jugé « inutilisé » sans preuve | Une lecture par déstructuration de `process.env` ou une référence dans un autre dépôt n'apparaît pas dans un grep naïf |
| Modifier le contrat du bus d'événements dans un seul dépôt | `ecosystem-event.ts` existe en quatre copies identiques, plus une copie Java. Les désynchroniser ne produit **aucune erreur** au démarrage |
| Toucher aux secrets, les afficher, les déplacer | Voir la page Gestion des secrets. Une valeur affichée une fois est une valeur à rotationner |
| Exécuter une suppression en base de production | Sauvegarde préalable et validation humaine, sans exception |
| Affirmer qu'une branche est fusionnée sans comparer les arbres | Les fusions se font en squash : comparer les intitulés de commits ne prouve rien |

## 4. Ce sur quoi l'IA est réellement rentable

L'inverse mérite d'être dit, parce que la méfiance excessive coûte aussi cher que la confiance
aveugle.

L'IA est nettement meilleure que nous sur **la recherche exhaustive de références** dans un
écosystème multi-dépôts, sur **la détection d'incohérences** entre une documentation et le code
qu'elle décrit, sur **la rédaction de tests de cas limites**, et sur **la production de code
répétitif mais rigoureux** : migrations, scripts d'exploitation, mise en conformité d'un fichier
avec un standard existant.

Elle est également très efficace pour **expliquer du code que personne n'a écrit récemment**, ce
qui est le cas de la majorité d'une base après quelques mois.

## 5. Les fichiers d'instructions

Les guides destinés aux agents ne vivent pas dans cette documentation : ils sont versionnés dans
le dépôt d'organisation `.github`, sous `ai/`. Ils sont écrits pour être lus par une IA, pas par
un humain.

| Fichier | Usage |
| :--- | :--- |
| `ai/contexte-organisation.md` | Socle commun : l'écosystème, ses pièges, ses invariants |
| `ai/projet-existant.md` | Intervenir sur un dépôt qui existe déjà |
| `ai/nouveau-projet.md` | Démarrer un projet conforme aux standards de l'organisation |
| `ai/bmad.md` | Quand mobiliser BMAD, et quand s'en passer |

Chaque dépôt porte par ailleurs un `CLAUDE.md` à sa racine, chargé automatiquement par Claude
Code. Il décrit le dépôt lui-même et renvoie aux guides communs.
