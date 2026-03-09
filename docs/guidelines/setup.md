---
sidebar_position: 4
---

# Configuration de l'Environnement

Ce guide détaille la procédure de configuration d'un poste de travail pour contribuer aux différents projets de l'organisation 3LEvent. Le respect de cette stack technique est impératif pour garantir la compatibilité avec nos pipelines de déploiement continu.

---

## 1. Prérequis Système

Tous les contributeurs doivent disposer des outils de base suivants, quel que soit le module ciblé (Web, Game-Server ou Infrastructure) :

* **Git** : Version 2.40 ou supérieure.
* **Node.js** : Version 20.x (LTS recommandée).
* **Gestionnaire de paquets** : npm (inclus avec Node.js).
* **Terminal** : PowerShell 7, Zsh ou Bash (évitez l'invite de commande Windows standard).

---

## 2. Stack Minecraft (Plugins & Core)

Le développement des serveurs de jeu repose sur les technologies Java les plus récentes.

### Runtime et SDK
* **Java Development Kit (JDK)** : Version 21 (Temurin ou Oracle). L'utilisation de versions antérieures empêchera la compilation des plugins Paper.
* **Variable d'environnement** : Assurez-vous que `JAVA_HOME` pointe correctement vers l'installation du JDK 21.

### Outils de Build
* **Gradle** : Version 8.5+. Nous utilisons le Gradle Wrapper (`gradlew`) inclus dans chaque dépôt pour garantir l'homogénéité des builds.

---

## 3. Stack Web (Portails & APIs)

Les interfaces web de l'écosystème utilisent des frameworks modernes nécessitant une configuration spécifique.

* **Angular CLI** : Version 17+. Installation via `npm install -g @angular/cli`.
* **Tailwind CSS** : Utilisé pour la majorité de nos styles. L'extension officielle pour IDE est recommandée pour l'autocomplétion.

---

## 4. IDE et Extensions

Pour maintenir une cohérence dans la qualité du code (Normalisation), nous recommandons l'utilisation des outils suivants :

### IntelliJ IDEA (Recommandé pour le Java)
* **Plugin Minecraft Development** : Pour la gestion des événements et des dépendances Paper/Spigot.
* **CheckStyle** : Pour vérifier le respect des normes de codage en temps réel.

### Visual Studio Code (Recommandé pour le Web et la Doc)
Extensions obligatoires :
* **Prettier** : Pour le formatage automatique.
* **ESLint** : Pour l'analyse statique du code TypeScript/Angular.
* **Mermaid Chart** : Pour la prévisualisation des schémas d'architecture.

---

## 5. Accès et Identifiants

Certains projets nécessitent des accès à notre infrastructure de développement :

1. **GitHub** : Demandez l'ajout de votre compte à l'organisation 3LEvent.
2. **Cloudflare** : Pour les développeurs Infrastructure, un accès au dashboard via SSO est requis.
3. **Vault / Secrets** : Les clés API et identifiants de base de données de test ne sont jamais stockés en clair. Référez-vous au [guide de gestion des secrets](../infrastructure/secrets-management.md).

---

## 6. Vérification de la Configuration

Exécutez cette commande dans votre terminal pour valider les versions critiques :

```bash
# Vérification Java
java -version # Doit afficher "21"

# Vérification Node
node -v # Doit afficher "v20.x.x"

# Vérification Git
git --version

```

---

### Prochaines étapes

Une fois votre environnement prêt, vous pouvez passer à la rédaction ou à la consultation des standards :

* **[Standards de programmation](./coding-standards)**
* **[Conventions de nommage Git](../workflow/git-conventions.md)**