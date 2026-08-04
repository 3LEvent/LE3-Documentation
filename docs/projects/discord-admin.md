---
sidebar_position: 7
---

# Discord Admin

Dépôt `LE3-Discord-Admin`. Bot Discord d'administration : alertes d'infrastructure, exploitation
du serveur de jeu, contrôle des sites publics, gestion des accès du staff et déclenchement des
déploiements.

Node 22, TypeScript strict ESM, discord.js 14, Mongoose 9, Redis. Aucun port exposé.

Il vit sur le **serveur Discord du staff**, pas sur le serveur des joueurs. Le bot public
`LE3-Discord-Bot` fait l'inverse : les deux ne se croisent jamais.

---

## 1. C'est le service le plus dangereux de l'écosystème

Une commande de ce bot redémarre le serveur de jeu, bascule un site public en maintenance ou
déploie n'importe quel service. Trois propriétés le tiennent. Aucune n'est optionnelle, et
aucune ne suffit seule.

### Refus par défaut

`memberHasPermission` refuse une commande dont la clé de permission est **absente** de
`config.json`. Le bot public fait exactement l'inverse : une clé absente y ouvre la commande à
tout le monde, ce qui convient à des commandes de confort.

Ici, ce comportement donnerait le redémarrage du serveur de jeu à n'importe quel membre le jour
où quelqu'un ajoute une commande sans penser à sa permission. Un test verrouille le refus.

### Le panel fait autorité, pas Discord

Un rôle Discord ne suffit pas. `requirePanelStaff` exige en plus un compte staff **actif** dans
le panel, lié à ce compte Discord.

La conséquence est le point de conception principal : **le panel donne les droits, Discord les
reflète**. Un rôle Discord attribué par erreur, ou un compte Discord compromis, ne confère aucun
pouvoir tant que le panel ne connaît pas la personne. Révoquer un accès se fait dans le panel, à
un seul endroit, et non en retirant un rôle sur Discord.

### Tout est audité, y compris les refus

Chaque interaction est écrite dans la collection d'audit, la tentative refusée comprise. Un refus
sans trace empêche de voir qu'on essaie.

## 2. Trois bases de données

| Connexion | Accès | Contenu |
| :--- | :--- | :--- |
| `admin` | lecture / écriture | journal d'audit, état des alertes |
| `panel` | **lecture seule** | comptes staff, rôles, configuration du site |
| `site` | **lecture seule** | inscriptions, équipes |

**Le démarrage échoue si deux de ces URI coïncident.** Même logique que le bot public, et pour la
même raison : la version précédente de ce dernier partageait la base du site et y avait écrit des
champs que les schémas du site ne déclaraient pas, qu'il a fallu nettoyer à la main en production.

Les modèles sous `models/panel/` et `models/site/` sont des **copies conformes**. Ne jamais y
ajouter un champ : un ajout côté panel commence dans `LE3-Web-Panel`.

Une exception assumée : le contrôle de maintenance **écrit** dans la configuration du panel.
C'est la source de vérité, et la contourner produirait une incohérence au prochain démarrage du
panel, qui réécrit les clés Redis depuis sa base.

## 3. Commandes

| Commande | Rôle |
| :--- | :--- |
| `/mc status` | État du serveur de jeu : joueurs, TPS, mémoire |
| `/mc restart` | Redémarrage du serveur de jeu |
| `/site maintenance` | Bascule un site public en maintenance |
| `/site inscriptions` | Ouvre ou ferme les inscriptions |
| `/calendrier` | Consulte le calendrier publié par le panel |
| `/staff invite` | Génère une invitation au panel |
| `/link` | Lie un compte Discord à un compte staff du panel |
| `/deploy status` | Dernier déploiement de chaque service |
| `/deploy run` | Déclenche le déploiement d'un service |

Les permissions sont graduées par conséquence, jamais par ancienneté : lire un statut est ouvert
largement, redémarrer le serveur et inviter au staff restent aux deux rôles les plus élevés. Elles
s'expriment en clés de rôles dans `config.json`, jamais en identifiants Discord codés dans le
code.

## 4. Alertes

Le bot surveille le bus d'événements et l'état de l'infrastructure, et publie dans des salons
dédiés.

`transition` **n'émet qu'au changement d'état**. C'est le point qui décide de l'utilité du
système : une alerte republiée à chaque battement manquant noie le salon en quelques minutes, et
un salon noyé n'est plus lu. Une alerte qui se répète ne signale rien de plus que la première.

Un résumé quotidien est publié à heure fixe. Une équipe restée incomplète au-delà d'un délai
configuré déclenche une alerte : c'est le seul signal qui porte sur les données de l'événement
plutôt que sur l'infrastructure.

## 5. Synchronisation des rôles

Le panel pousse vers Discord, jamais l'inverse.

La synchronisation ne touche **que** les rôles déclarés dans la table de correspondance. Un rôle
de couleur, de notification ou de jeu attribué à la main doit survivre au passage du bot : un
mécanisme qui aligne le membre sur la seule vérité du panel supprimerait ces rôles sans que
personne ne comprenne pourquoi.

## 6. Déploiement

Le bot tourne en conteneur, avec sa **propre identité machine** dans le coffre. Il ne réutilise
pas celle qui sert aux applications web : il lit le jeton Discord d'administration et la clé de
déploiement, et une fuite ne doit pas porter au-delà de lui. Le panel suit la même règle, pour la
même raison.

**Aucun fichier d'environnement sur le serveur.** Les secrets sont injectés au démarrage.

N'exposant aucun port, sa sonde de santé ne peut pas être une requête HTTP : le script de
déploiement exige à la place que le conteneur tourne depuis au moins vingt secondes sans avoir
redémarré, ce qu'une boucle de crash ne satisfait jamais.

**La clé de déploiement est contrainte à une commande unique** côté serveur, par une directive
`command="…"` dans les clés autorisées. Le bot ne peut soumettre qu'une action figurant sur une
liste blanche, sur une liste de services fermée. Il n'obtient pas de shell, et une commande hors
liste est refusée par le serveur, pas par le bot.

C'est la propriété qui compte : **le bot n'a pas besoin d'être digne de confiance pour que le
serveur le reste.** Remplacer cette clé par une clé libre annulerait tout le reste.

`npm run register` publie les commandes slash. Il **remplace** l'intégralité du jeu de commandes :
toute commande absente du code disparaît. Le bot ne s'enregistre jamais lui-même au démarrage.

## 7. Le contrat du bus

`backend/events/ecosystem-event.ts` est la **quatrième copie TypeScript** du contrat, après
`LE3-Web-Main`, `LE3-Web-Live` et `LE3-Web-Panel`, auxquelles s'ajoute la copie Java du plugin.

Toute modification touche **les cinq dans la même PR**, et `CONTRACT_REVISION` est incrémenté. Le
test de contrat est présent ici aussi.
