---
sidebar_position: 6
---
# Gestion des Secrets et Sécurité

La sécurité de l'infrastructure du **3LEvent** repose sur une gestion rigoureuse des accès et des données sensibles. Aucun secret (clé d'API, mot de passe, token) ne doit circuler en clair dans le code source ou les fichiers de configuration commités.

---

## 1. Principes Fondamentaux

* **Zéro Persistance** : Aucun secret ne doit être stocké dans le dépôt (même dans des branches privées).
* **Injection au Runtime** : Les secrets sont injectés dynamiquement dans l'environnement lors de l'exécution ou du build via GitHub Actions.
* **Principe du Moindre Privilège** : Chaque service ou développeur ne possède que les accès strictement nécessaires à ses fonctions.

---

## 2. GitHub Secrets (Source de Vérité)

Tous les secrets sont centralisés au niveau de l'organisation GitHub. Ils sont hérités par les dépôts via les **Shared Workflows**.

### Nomenclature des Secrets
Pour garantir la cohérence entre les projets Java, TypeScript et Angular, les noms de secrets suivent la norme `LE3_[SERVICE]_[NOM]` :

| Nom du Secret | Description | Portée |
| :--- | :--- | :--- |
| `LE3_CLOUDFLARE_API_TOKEN` | Token de déploiement pour Cloudflare Pages/Workers. | Infrastructure |
| `LE3_DISCORD_BOT_TOKEN` | Jeton d'authentification du bot Discord central. | App-DiscordBot |
| `LE3_DATABASE_URL` | Chaîne de connexion à la base de données de production. | Core / API |
| `LE3_MAVEN_REPO_USER` | Identifiant pour le dépôt de bibliothèques privé. | Java / CI |
| `LE3_MAVEN_REPO_PASS` | Mot de passe pour le dépôt de bibliothèques privé. | Java / CI |

---

## 3. Utilisation par Environnement

### En Développement Local
Pour le développement local, utilisez des fichiers d'environnement non suivis par Git.
1.  Copiez le fichier `.env.example` présent dans les templates.
2.  Renommez-le en `.env`.
3.  Remplissez les valeurs avec vos accès de test.
*Note : Le fichier `.gitignore` de chaque projet bloque systématiquement les fichiers `.env`.*

### En Production (CI/CD)
Les secrets sont injectés via GitHub Actions. Exemple d'utilisation dans un workflow :

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Cloudflare
        run: npx wrangler pages deploy ./dist
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.LE3_CLOUDFLARE_API_TOKEN }}

```

---

## 4. Implémentation selon la Stack

### Java (Plugins Minecraft)

Les plugins ne doivent pas coder en dur les accès SQL. Utilisez le système de configuration pour lire les variables d'environnement injectées dans le conteneur ou le serveur :

```java
String dbPassword = System.getenv("LE3_DATABASE_PASSWORD");
if (dbPassword == null) {
    dbPassword = getConfig().getString("database.password");
}

```

### TypeScript / Node.js

Utilisez systématiquement un validateur de variables d'environnement (type `dotenv` ou `zod`) pour garantir que les secrets sont présents au démarrage :

```typescript
import 'dotenv/config';

const botToken = process.env.LE3_DISCORD_BOT_TOKEN;
if (!botToken) {
  throw new Error("Missing LE3_DISCORD_BOT_TOKEN in environment");
}

```

---

## 5. Sécurité Cloudflare

L'accès aux services satellites est protégé par **Cloudflare Access** et les **Tunnels**.

* **Tokens de service** : Utilisés pour la communication directe de serveur à serveur.
* **WAF (Web Application Firewall)** : Bloque les tentatives d'injection et les requêtes non autorisées sur les API Web.

---

## 6. Procédure en cas de Fuite

Si un secret est accidentellement poussé sur un dépôt (même si le commit est supprimé) :

1. **Révocation immédiate** : Régénérez le token ou le mot de passe concerné.
2. **Mise à jour** : Modifiez la valeur dans les GitHub Secrets de l'organisation.
3. **Audit** : Vérifiez les logs d'accès pour s'assurer qu'aucune utilisation malveillante n'a eu lieu.
4. **Nettoyage** : Utilisez l'outil `bfg-repo-cleaner` ou `git filter-repo` pour purger l'historique du dépôt si nécessaire.

---

### Prochaines étapes

* **[Consulter la configuration de l'Infrastructure](./cloudflare-setup)**
* **[Guide du Workflow CI/CD](../workflow/pull-request-process)**