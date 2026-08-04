---
sidebar_position: 3
---

# Relire, vérifier, assumer

Une PR produite par un agent engage son auteur humain exactement comme une PR écrite à la main.
Cette page décrit ce qu'il faut vérifier avant de la proposer, et les modes de défaillance
propres au code généré.

---

## 1. Les défaillances typiques du code généré

Elles ne ressemblent pas aux erreurs humaines. Un développeur fatigué oublie un cas ; un modèle
produit du code cohérent, bien nommé, commenté, et faux sur un point précis.

### L'invention plausible

Un appel à une méthode qui n'existe pas, une option de CLI inventée, un champ de configuration
au nom crédible. Le code a l'air juste et échoue à l'exécution, parfois seulement dans une
branche rarement empruntée.

**Parade** : exécuter. Le compilateur TypeScript attrape la majorité, les tests le reste.

### La régression silencieuse

L'agent corrige ce qu'on lui demande et casse un comportement voisin qu'aucun test ne couvre.
Fréquent sur les valeurs de repli, les cas nuls, les codes de retour.

**Parade** : lire le diff en entier, y compris les lignes qui ne semblent pas concernées. Se
demander pour chaque suppression pourquoi ce code existait.

### La sur-ingénierie

Une abstraction pour un seul appelant, une couche de configuration pour une valeur qui ne
changera jamais, une gestion d'erreur pour un cas impossible. Rien n'est faux, tout est en trop.

**Parade** : demander explicitement la version la plus simple, et refuser ce qui n'a pas de
second appelant.

### La conformité de façade

Le code respecte la forme des conventions sans en respecter l'intention : un commentaire qui
paraphrase la ligne suivante, un nom de variable conforme mais vide de sens, un test qui vérifie
que le mock a été appelé.

**Parade** : un test qui passerait aussi avec l'implémentation vide ne teste rien.

## 2. La liste de contrôle avant de proposer une PR

Elle ne remplace pas la relecture, elle en fixe le minimum.

| Point | Vérification |
| :--- | :--- |
| Le diff est-il lisible en entier ? | Si non, la demande était trop large. Découper |
| Les tests passent-ils réellement ? | Avoir vu la sortie, pas une affirmation |
| Le lint passe-t-il ? | `npm run lint`, sans exception ajoutée pour faire taire une règle |
| Chaque suppression est-elle justifiée ? | Y compris les commentaires supprimés |
| Y a-t-il un secret dans le diff ? | Valeur, URL avec jeton, fichier `.env` |
| Le contrat du bus est-il touché ? | Si oui, les quatre copies changent dans la même PR et `CONTRACT_REVISION` est incrémenté |
| Les conventions de commit sont-elles respectées ? | Conventional Commits, message en anglais |
| La description de PR explique-t-elle le pourquoi ? | Le quoi se lit dans le diff, pas le pourquoi |

## 3. Les zones où la vigilance doit doubler

Certaines parties de l'écosystème ont la propriété désagréable de **casser sans erreur**. Une
faute y est invisible jusqu'à ce qu'elle coûte cher.

**Le contrat du bus d'événements.** Trois copies TypeScript identiques et une copie Java. Une
divergence ne lève aucune exception : le message est simplement ignoré par les abonnés, et le
symptôme apparaît ailleurs, plus tard.

**Les valeurs partagées entre services.** `REDIS_URL`, les secrets de session et le secret du
plugin doivent rester identiques partout. Une divergence ne se voit pas au démarrage, elle se
manifeste par un panel vide ou des sessions qui ne se propagent pas.

**Les valeurs de repli.** Un secret manquant doit faire échouer le démarrage bruyamment. Un
agent ajoute spontanément un repli par défaut, ce qui transforme une panne visible en
comportement dégradé silencieux. C'est explicitement interdit.

**Les branches.** `develop` est écrasée à chaque publication du plugin par un `reset --hard`
suivi d'un `push --force`. Tout travail qui n'est que sur `develop` est perdu.

## 4. Les opérations destructives

Suppression en base, suppression de branche, suppression de fichiers, recréation de conteneur.
La règle est uniforme et sans exception.

1. **Sauvegarde vérifiée d'abord.** Pas « je recommande de sauvegarder », une sauvegarde faite,
   dont on a vu la taille et l'emplacement.
2. **Simulation avant exécution.** Le script compte ce qu'il ferait, sans écrire.
3. **Validation humaine explicite** sur la sortie de la simulation.
4. **Vérification après coup**, sur des critères définis avant l'opération.

La moindre ambiguïté sur l'utilité d'une donnée interdit sa suppression. Une donnée détruite à
tort coûte infiniment plus cher qu'une donnée inutile conservée.

## 5. Ce que l'IA ne peut pas porter

Une IA n'a pas de responsabilité. Elle ne sera pas là quand la production tombera, elle ne se
souviendra pas de l'arbitrage rendu il y a trois mois, et elle ne peut pas décider ce qui est
acceptable pour le projet.

Restent humaines, sans délégation possible :

- l'arbitrage entre dette technique et échéance ;
- la décision de rotationner un secret, ou d'accepter le risque de ne pas le faire ;
- l'acceptation d'une régression connue au profit d'une livraison ;
- la responsabilité de ce qui est fusionné sur `main`.

Un agent peut documenter chacune de ces décisions, en exposer les conséquences et rappeler
qu'elles sont ouvertes. Il ne peut pas les prendre.
