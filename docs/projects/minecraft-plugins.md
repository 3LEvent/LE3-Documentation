---
sidebar_position: 7
---

# Développement de Plugins Minecraft

Cette section régit la création et la maintenance des plugins Java au sein de l'écosystème **3LEvent**. Tous les plugins doivent être conçus pour fonctionner sur une architecture basée sur Paper et suivre les standards de performance requis pour un événement compétitif.

---

## 1. Stack Technique et Environnement

Tous les plugins de l'organisation doivent respecter les versions logicielles suivantes :

| Composant | Spécification |
| :--- | :--- |
| **Langage** | Java 21 (LTS) |
| **API Serveur** | Paper API (dernière version stable) |
| **Gestionnaire de dépendances** | Maven (prioritaire) ou Gradle |
| **Version du jeu** | 1.21.x (référence actuelle) |

---

## 2. Architecture et Nomenclature

### Nommage des Projets
Chaque dépôt de plugin doit être préfixé par `LE3-Plugin-` suivi du nom fonctionnel en CamelCase.
* **Exemple** : `LE3-Plugin-FlagWars`, `LE3-Plugin-Core`.

### Structure du Code
Le code doit être organisé de manière modulaire :
* `fr.le3event.[nom].core` : Classe principale et initialisation.
* `fr.le3event.[nom].commands` : Logique des commandes (utilisation de l'API de commandes recommandée).
* `fr.le3event.[nom].listeners` : Gestionnaires d'événements.
* `fr.le3event.[nom].tasks` : Tâches planifiées et boucles de jeu.
* `fr.le3event.[nom].api` : Interfaces et classes accessibles par d'autres plugins.

---

## 3. Standards de Développement

### Performance et Optimisation
* **Asynchronisme** : Toutes les opérations d'entrée/sortie (IO), les requêtes de base de données et les accès API Web doivent impérativement être effectués de manière asynchrone pour ne pas bloquer le thread principal (Tick).
* **Gestion des Événements** : Désactivez les écouteurs d'événements (Listeners) lorsqu'ils ne sont pas nécessaires à la phase actuelle de l'événement.
* **Entités et NBT** : Privilégiez l'utilisation des `PersistentDataContainer` pour stocker des données sur les entités ou les objets plutôt que des fichiers de configuration externes massifs.

### Normalisation du Code
* **Logging** : Utilisez le Logger de l'instance du plugin. Les messages de debug doivent être désactivables via la configuration.
* **Internationalisation** : Tous les messages envoyés aux joueurs doivent passer par un système de fichiers de langue (`messages_fr.yml`) pour faciliter les modifications sans recompilation.

---

## 4. Intégration à l'Écosystème (LE3-Core)

Le plugin `LE3-Plugin-Core` est la dépendance centrale. Aucun plugin satellite ne doit redéfinir les concepts suivants :
* **Gestion des Équipes** : Utilisez l'API du Core pour récupérer les membres et les scores.
* **Système de Points** : Les points doivent être injectés via le Core pour assurer la synchronisation avec le site web et la base de données.
* **Achievements** : Le déclenchement des succès doit être notifié au module Core.

---

## 5. Build et Déploiement

### Utilisation des Templates
Pour tout nouveau plugin, l'utilisation du dépôt `LE3-Plugin-Template` est obligatoire. Ce template inclut :
* La configuration Maven pré-paramétrée.
* Le workflow GitHub Actions pour le build automatique.
* Les dépendances vers les APIs communes du projet.

### Secrets GitHub
Les informations sensibles (identifiants de base de données, clés API de services tiers) ne doivent jamais être présentes dans le fichier `config.yml` par défaut du dépôt.
* Les secrets sont injectés lors du déploiement via les variables d'environnement.
* Le plugin doit être capable de lire ces variables au démarrage.

---

## 6. Guidelines de Design (In-game)

Pour garantir une immersion cohérente, les plugins doivent suivre la charte graphique définie dans le **Design System** :
* **Composants de Texte** : Utilisez l'API MiniMessage (Kyori) pour le formatage des textes.
* **Couleurs** : Respectez la palette officielle (voir `guidelines/design-system.md`) pour les noms d'équipes et les grades.
* **Interfaces (GUI)** : Les inventaires personnalisés doivent être uniformisés (utilisation de bordures en verre teinté, titres clairs).

---

### Prochaines étapes

* **[Accéder à la bibliothèque de Snippets Java](./guidelines/code-snippets)**
* **[Consulter le protocole de communication Inter-Plugins](./architecture/communication-protocol)**