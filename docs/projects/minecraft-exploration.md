---
sidebar_position: 7
---

# Exploration - `LE3-Plugin-Exploration`

Le jeu du serveur principal. Il joue les cérémonies de l'édition, active ses modules de mécanique,
fait tourner les épreuves sur lesquelles s'appuient les quêtes, et gère les boss. Il ne possède
aucune donnée : les équipes, les succès et les points appartiennent au Core, la phase et le dossier
de l'édition au plugin d'événement.

| | |
| :--- | :--- |
| **Dépôt** | `LE3-Plugin-Exploration` |
| **Dépend de** | `LE3-Plugin-Core`, `LE3-Plugin-Event` et **MythicMobs** |
| **Optionnel** | BeautyQuests, ItemsAdder, Citizens, DecentHolograms |
| **Contenu** | `LE3-Editions`, dossier `v6/exploration/` |
| **Serveur** | Principal uniquement ; sur le serveur mini-jeux le plugin reste inerte |

---

## 1. Paquetages

| Paquetage | Rôle |
| :--- | :--- |
| `loader` | Lit et valide le dossier de l'édition, d'un bloc : rien de à moitié chargé ne tourne |
| `lifecycle` | Cérémonies d'ouverture, de pause, de reprise et de clôture |
| `modules` | Une mécanique réutilisable par module, activée par l'édition |
| `objectives` | Épreuves réutilisables, contrat par item avec BeautyQuests |
| `bosses` | Seule porte vers MythicMobs, garantie par un test d'architecture |
| `tracking` | L'item qui mène aux boss et aux points de repère |

---

## 2. Qui écrit quoi

Une quête de la V5 se faisait ainsi : le plugin produisait un item custom, BeautyQuests demandait
de le rapporter. Ce partage est bon, il est gardé et rendu explicite.

| Rôle | Qui | Contenu |
| :--- | :--- | :--- |
| Écrire la quête | Le staff, dans BeautyQuests | Étapes, dialogues, PNJ, « rapporte tel item », récompenses |
| Fournir les épreuves | Ce plugin | Les mécaniques qui produisent l'item |
| Fournir les items | ItemsAdder | Les items custom que les épreuves donnent |
| Créditer l'équipe | Le Core, via `/exploration grant` | Le succès, ses points, son affichage |

Le contrat entre les deux plugins est **l'item**, rien d'autre. C'est ce qui permet à une montée de
version de BeautyQuests de ne rien casser.

---

## 3. Les épreuves

Une épreuve est une brique réutilisable configurée en YAML, jamais propre à une quête. Écrire une
nouvelle quête, c'est le plus souvent combiner des épreuves existantes avec de nouveaux réglages.

| Épreuve | Ce qu'elle fait | État |
| :--- | :--- | :--- |
| `activate` | N blocs à activer dans une zone, dans l'ordre ou non | Disponible |
| `survive` | Rester N minutes dans une zone | Disponible |
| `wave` | Des vagues de monstres à vaincre l'une après l'autre, sans quitter la zone | Disponible |
| `search` | Un objet caché dans l'un de N emplacements, avec des indices à l'approche | Disponible |
| `escort` | Un monstre MythicMobs à accompagner d'un bout à l'autre d'un trajet | Disponible |
| `puzzle` | Une séquence à reproduire dans l'ordre | Disponible |

Une épreuve se joue **par équipe** : chaque équipe a sa progression, sauvegardée à chaque palier, et
reprend où elle en était après un redémarrage. Deux équipes qui arrivent en même temps sur une
épreuve à instance unique passent l'une après l'autre, la seconde voyant sa place dans la file. Une
épreuve terminée donne son item une seule fois par équipe.

Les six types ont un exécutant depuis le 2026-09-16. Un type ajouté à l'énumération sans exécutant
resterait **refusé au chargement** : une édition qui l'utilise le sait tout de suite plutôt que de
le voir ne rien faire.

Trois de ces épreuves ont une particularité qui se configure :

- `wave` tient la zone. Si plus personne de l'équipe n'y est pendant le délai de grâce, la tentative
  échoue et les monstres restants disparaissent. Chaque vague nettoyée est un palier, donc un
  redémarrage ne rejoue que la vague en cours.
- `search` tire sa cachette du couple épreuve et équipe, jamais du hasard. La même équipe cherche
  toujours au même endroit, deux équipes cherchent ailleurs, et les indices sont des paliers de
  distance écrits par l'édition, jamais un nombre de blocs.
- `escort` ne déplace pas le monstre : c'est son IA MythicMobs qui suit les joueurs. Un monstre qui
  cesse de suivre se corrige dans son fichier MythicMobs, pas dans une version du plugin.

---

## 4. Les boss

MythicMobs décrit la créature, ce plugin décrit l'événement autour.

* **Un seul exemplaire vivant** par boss, quel que soit ce qui l'a fait apparaître.
* **Un boss par jour, cumulatif.** Le premier jour débloque le premier boss, le deuxième jour le
  deuxième et le premier, jusqu'au quatrième. Le cinquième jour n'en apporte pas de nouveau et les
  quatre restent chassables. C'est le même jour d'événement que celui qui débloque les succès.
* **Disponible toute la journée** : un boss débloqué se tient à son point d'apparition et revient
  cinq minutes après sa mort. Jamais d'aléatoire : un boss que les joueurs peuvent trouver quand ils
  veulent est un boss qu'ils reviennent chercher.
* **Aucune apparition programmée pendant un mini-jeu.** Un boss déjà vivant reste en place.
* **Le crédit va à l'équipe qui a le plus frappé**, dégâts cumulés sur tout le combat. C'est plus
  juste que la cible de l'aggro, qui change au dernier moment. Les dégâts du staff sont ignorés, et
  l'option `CONTRIBUTORS` crédite toutes les équipes au-dessus d'une part des dégâts.
* **Rejouable** : un boss peut être vaincu plusieurs fois par chaque équipe, et son succès progresse
  d'un cran à chaque victoire. C'est son butin qui donne envie d'y revenir.
* ⚠️ **`Despawn: false` est obligatoire** dans le mob MythicMobs : sinon il disparaît quand son
  chunk se décharge, c'est-à-dire en plein combat. Le plugin le vérifie au démarrage.

L'**item de tracking**, obtenu au bout de la quête du boss, est une boussole à deux modes que le
shift-clic fait basculer : le boss tant qu'il est en vie, sinon le point de repère de son repaire.
La distance est annoncée par paliers nommés, jamais en nombre de blocs. La boussole appartient au
joueur qui a fini la quête : chaque joueur qui en veut une joue la quête à son tour, et celui qui
perd la sienne reparle au PNJ pour en récupérer une.

---

## 5. Les modules d'édition

Une mécanique particulière par édition, ou aucune. Le froid appartenait à la V5 ; la V6 aura la
sienne si l'équipe en décide une, et elle arrivera comme un module de plus.

* Un module est **générique** : « température », pas « le froid de la V5 ». L'édition l'active en
  livrant son fichier de réglages et le règle.
* Les modules **ne se connaissent pas** : ils se parlent par des drapeaux posés sur une équipe, que
  les quêtes et les autres modules peuvent lire.
* Les **quêtes changent d'une édition à l'autre** : elles vivent dans BeautyQuests et sont
  versionnées avec le contenu de l'édition. Tant qu'elles s'appuient sur des épreuves existantes,
  réécrire les quêtes d'une édition ne demande aucune ligne de code.
* Tout ce qu'un module enregistre disparaît quand il est désactivé. Un module qui échoue est mis de
  côté pour la soirée au lieu d'emporter le plugin avec lui.

---

## 6. Commandes

| Commande | Effet |
| :--- | :--- |
| `/exploration validate` | Charge le dossier de l'édition sans l'activer et liste toutes les erreurs |
| `/exploration reload` | Recharge le contenu entre deux moments calmes |
| `/exploration status` | Édition, modules actifs, zones, points de repère, boss vivants |
| `/exploration objective start <joueur> <épreuve>` | Démarre une épreuve pour l'équipe du joueur |
| `/exploration objective reset <équipe> <épreuve>` | Remet une épreuve à zéro pour une équipe |
| `/exploration boss spawn\|remove <boss>` | Apparition et retrait manuels |
| `/exploration tracker give <joueur> <boss>` | Récompense BeautyQuests : le traqueur pour ce joueur |
| `/exploration grant <joueur> <succès>` | Récompense BeautyQuests : le succès pour l'équipe |

---

### Prochaines étapes

* **[Mini-jeux](./minecraft-minigames)**
* **[Plugins Minecraft](./minecraft-plugins)**
