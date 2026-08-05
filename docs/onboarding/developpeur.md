---
sidebar_position: 3
---

# Arrivée Développeur

Ce parcours **complète** celui de [l'arrivée Staff](./staff), il ne le remplace pas. Fais-le
d'abord en entier : sans compte panel ni rôle, la suite ne sert à rien.

Prévois **une heure**, dont la moitié en attente d'installations.

---

## Étape 1 : rejoindre l'organisation GitHub

Un administrateur t'envoie une invitation à l'organisation `3LEvent`, sur l'adresse de ton
compte GitHub. Si tu n'as pas de compte GitHub, crée-le avant de la réclamer.

**Tous les dépôts sont privés**, à une exception près : celui de cette documentation. Tant que
l'invitation n'est pas acceptée, les liens vers le code te renverront une page introuvable, ce
qui ressemble à une erreur d'URL mais n'en est pas une.

Active l'authentification à deux facteurs sur ton compte GitHub. Ce n'est pas une formalité :
ces dépôts contiennent le code qui tourne en production.

## Étape 2 : ce que tu dois lire avant d'écrire une ligne

Dans cet ordre, et vraiment avant de coder.

| À lire | Où | Pourquoi |
| :--- | :--- | :--- |
| `ai/contexte-organisation.md` | Dépôt `.github` | Les pièges valables partout. Non négociable. |
| `CLAUDE.md` du dépôt visé | Racine du dépôt | Ce qui casse en silence, propre à ce projet. |
| [Conventions Git](../workflow/git-conventions) | Ici | Branches, commits, contrat du bus |

Le fichier `contexte-organisation.md` décrit des comportements qui **ne lèvent aucune erreur**
quand on les enfreint. C'est précisément pour ça qu'il faut le lire avant : rien ne te
préviendra.

## Étape 3 : préparer ta machine

| Outil | Version | Remarque |
| :--- | :--- | :--- |
| Node.js | 22 | Les applications web et les deux bots |
| Docker | récent | Dépendances locales du panel |
| Java + Maven | 21 | Uniquement pour le plugin Minecraft |
| Git | récent | |

## Étape 4 : lancer un projet en local

Clone le dépôt, puis dans le dossier :

```bash
npm install
cp .env.example .env
```

Ouvre `.env` et renseigne les valeurs. **Aucun secret de production ne doit y figurer** :
utilise des valeurs de test locales.

:::danger[Un secret manquant doit faire échouer le démarrage]
Si l'application refuse de démarrer en te disant qu'une variable manque, **ne code pas de
valeur de repli** pour contourner le problème. C'est une règle de l'écosystème, pas une gêne
temporaire : une valeur de repli silencieuse a déjà produit une redirection de déconnexion
vide en production, sans la moindre erreur pour le signaler.

Demande la variable, ou mets une valeur de test explicite.
:::

Puis, selon le projet :

```bash
npm run docker:up     # dépendances locales, sur le panel
npm run seed:dev      # jeu de données de développement
npm run dev           # serveur de développement
```

Les trois applications web tournent sur des ports distincts pour pouvoir cohabiter :

| Application | Port |
| :--- | :--- |
| Site principal | 3000 |
| Front live | 3001 |
| Panel staff | 3200 |

## Étape 5 : ta première contribution

Le processus complet est décrit dans les [conventions Git](../workflow/git-conventions) et le
[processus de pull request](../workflow/pull-request-process). L'essentiel :

**Ne commite jamais directement sur `main` ni sur `develop`.** Passe par une branche
`type/description` et une pull request.

Avant d'ouvrir la PR :

```bash
npm run lint
npm test
npm run build
```

Commits en **anglais**, format Conventional Commits. La documentation d'équipe, elle, s'écrit
en français.

:::warning[Trois pièges qui ne produisent aucune erreur]
**Le contrat du bus d'événements** existe en cinq copies, quatre en TypeScript et une en Java.
Si tu en modifies une, tu modifies les cinq dans la même pull request. Une copie oubliée ne
casse aucun build : les messages sont simplement ignorés par les abonnés.

**Sur le plugin Minecraft, `develop` est écrasée à chaque publication.** Du travail présent
uniquement sur cette branche est définitivement perdu.

**Ne supprime jamais du code parce qu'il « a l'air inutilisé ».** Vérifie les références dans
tous les dépôts, y compris les lectures par déstructuration de `process.env`.
:::

## Étape 6 : vérifier que tu es opérationnel

1. Tu clones un dépôt privé sans erreur d'accès.
2. `npm install` puis `npm run dev` démarrent l'application.
3. `npm test` passe sur un dépôt que tu n'as pas modifié.
4. Tu ouvres une pull request de test et la CI se déclenche.

Le point 3 est le plus utile : une suite qui échoue sur du code intact signale un problème
d'environnement, pas de code, et il vaut mieux le découvrir maintenant.

## Ce à quoi tu n'as pas accès, et c'est normal

Le coffre à secrets et les accès de production **ne font pas partie du parcours développeur**.
Ils relèvent du parcours [Administrateur](./administrateur).

Tu n'en as pas besoin pour développer : les valeurs de production ne doivent jamais se
retrouver sur un poste de travail. Si une tâche semble l'exiger, c'est presque toujours que la
tâche est mal découpée. Signale-le plutôt que de contourner.
