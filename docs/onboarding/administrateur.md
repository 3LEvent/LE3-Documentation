---
sidebar_position: 4
---

# Arrivée Administrateur

Ce parcours **complète** ceux de [l'arrivée Staff](./staff) et, si tu touches au code, de
[l'arrivée Développeur](./developpeur). Fais-les d'abord.

Être administrateur n'est pas un rôle de plus dans une liste : c'est la capacité de donner et
de retirer les accès de tout le monde. Cette page décrit ce que ça implique. Les procédures
détaillées vivent dans le dépôt d'organisation, en accès restreint.

---

## Ce que le rôle te donne réellement

| Capacité | Portée |
| :--- | :--- |
| Attribuer et retirer les rôles du staff | Tout le monde, panel et Discord |
| Ouvrir et fermer les inscriptions | Le site public |
| Basculer les sites en maintenance | Les visiteurs |
| Consulter et modifier des données | La base de production |
| Selon ton rôle exact, déclencher un déploiement | La production |

Ces capacités ne sont pas réparties par ancienneté mais **par conséquence**. Redémarrer le
serveur de jeu et inviter au staff restent réservés aux rôles les plus élevés, même quand
d'autres actions sont ouvertes plus largement.

## Le principe qui gouverne tout le reste

**Le panel fait autorité.** Il est la source unique des accès, et tout le reste en découle.

Concrètement : tu ne donnes jamais un rôle Discord à la main. Tu attribues un rôle dans le
panel, et Discord suit. Un rôle posé directement sur Discord sera retiré au passage suivant de
la synchronisation, sans prévenir et sans que ce soit un bug.

La conséquence est celle qui compte : **fermer un accès se fait à un seul endroit.** Désactiver
un compte dans le panel ferme aussi Discord et coupe les commandes du bot d'administration.
Retirer un rôle Discord à la main ne ferme rien du tout.

## Les trois choses à ne jamais faire

**Ne crée pas de compte à la place de quelqu'un.** Chaque arrivée passe par une invitation
nominative, à usage unique. Un compte créé pour autrui puis transmis casse la seule chose qui
permet de savoir qui a fait quoi.

**Ne prête jamais un accès existant.** Y compris « juste pour dépanner ». Une invitation coûte
trente secondes.

**Ne contourne pas le panel pour aller plus vite.** Modifier directement la base pour attribuer
un rôle produit un état que la synchronisation ne comprend pas, et le problème se manifeste
plus tard, ailleurs, sans lien apparent.

## Les accès supplémentaires

Selon ton périmètre, tu recevras l'accès au coffre à secrets et aux outils d'exploitation. Ils
ne sont **pas** attribués automatiquement avec le rôle : ils se demandent, et ils se justifient.

Le raccourci vers chacun d'eux apparaît sur la page d'accueil du panel, filtré selon ton rôle.
Tu n'as aucune adresse à retenir.

:::danger[Ce que ces accès exposent vraiment]
Certains outils d'exploitation touchent au magasin de sessions de l'écosystème. Un accès en
lecture y suffit à rejouer la session de n'importe quel membre du staff.

Ce ne sont pas des consoles de consultation. Traite-les comme des accès de production : depuis
une machine de confiance, jamais sur un réseau partagé, jamais avec une session laissée ouverte.
:::

## Les procédures détaillées

Les modes opératoires pour faire entrer quelqu'un, changer son rôle ou fermer ses accès sont
volontairement **hors de cette documentation publique**. Ils décrivent l'intérieur du système et
n'ont pas à être lisibles par n'importe qui.

Ils vivent dans le dépôt d'organisation `.github`, dossier `onboarding/`, accessible à tout
membre de l'organisation GitHub. Le panel en propose le raccourci sur sa page d'accueil.

Si tu viens d'être nommé administrateur et que tu n'y as pas accès, c'est une étape oubliée de
ton arrivée : signale-le, ne cherche pas à improviser la procédure.

## Vérifier que tu es opérationnel

1. Tu accèdes à la section de gestion des accès du panel.
2. Tu ouvres le dossier `onboarding/` du dépôt d'organisation.
3. Tu sais nommer la personne à prévenir avant une action irréversible.

Le point 3 n'est pas rhétorique. Une bascule en maintenance, une fermeture d'inscriptions ou un
déploiement se voient immédiatement par les joueurs. Aucune de ces actions ne se fait seul un
soir d'événement.
