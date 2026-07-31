---
sidebar_position: 6
---

# Bot Discord — à implémenter

:::warning Statut : non implémenté
Il n'existe **aucun dépôt de bot Discord** dans l'écosystème à ce jour. Cette page décrit
l'intégration prévue et les points d'ancrage **déjà présents dans le code** pour l'accueillir.
Tout ce qui suit la section 2 est une spécification, pas une description de l'existant.
:::

---

## 1. Ce qui existe déjà

L'écosystème est prêt à recevoir un bot sans modification des services existants.

| Point d'ancrage | Où | État |
| :--- | :--- | :--- |
| Nom de service `discord-bot` | `EcosystemServiceName` dans les trois contrats | **réservé** |
| Bus d'événements `le3:eventbus` | Redis | opérationnel |
| Tolérance aux types inconnus | `default: break` chez tous les consommateurs | opérationnel |
| OTP de liaison Discord | `verifications` (Core), champ `method` (`DM` ou `SLASH`) | **implémenté côté site** |
| OAuth2 Discord joueurs | `/api/auth/discord/*` (Core) | opérationnel |
| Rôles Discord | `DISCORD_ROLE_INSCRIT_ID`, `DISCORD_TEAM_ROLES_IDS`, `LE3_DISCORD_BOT_TOKEN` | variables déjà déclarées |

Le champ `method` de la collection `verifications` prévoit explicitement une valeur `SLASH` :
le mécanisme d'OTP a été conçu pour être validé par une commande slash du futur bot.

### Webhooks Discord déjà en production

Deux intégrations Discord fonctionnent déjà, **sans bot** — de simples webhooks sortants :

* **Panel** : alertes sur les logs `ERROR` / `CRITICAL` (`LE3_DISCORD_ALERT_WEBHOOK_URL`).
* **Live** : notification des pronostics (`DISCORD_PREDICTION_WEBHOOK_URL`).

Un webhook suffit pour notifier. Un bot n'est nécessaire que pour **agir** : commandes,
attribution de rôles, gestion de salons.

---

## 2. Périmètre visé

1. **Liaison des comptes** — commande slash de validation d'OTP, complétant le flux du portail.
2. **Attribution des rôles** — rôle « inscrit » et rôles d'équipe, à partir des événements du bus.
3. **Annonces** — calendrier des épreuves, résultats, changements de classement.
4. **Consultation** — commandes slash pour les scores et l'état du serveur.
5. **Relais de logs** — remplacer à terme les webhooks bruts par des embeds enrichis.

---

## 3. Contraintes d'implémentation

### Stack imposée

Identique aux autres applications Node : TypeScript strict, ESM natif, Node `>=20`,
`discord.js` v14+, ESLint. Dépôt nommé `LE3-App-DiscordBot`.

### Intégration au bus, pas à la base

:::danger Règle non négociable
Le bot **ne doit ouvrir aucune base de données** d'un autre service : ni la MongoDB du Core, ni
celle du Live ou du Panel, ni la MySQL du plugin. Il s'abonne à `le3:eventbus` et, s'il a besoin
d'agir, il publie un événement de commande. C'est ce qui permet d'ajouter le bot sans toucher aux
services existants — et de le retirer sans rien casser.
:::

Il doit utiliser une **copie locale** de `ecosystem-event.ts`, comme les trois autres services, et
publier avec `source.service: 'discord-bot'`.

Événements à consommer en priorité : `plugin.teams.snapshot.v1` (rôles d'équipe),
`plugin.achievement.granted.v1` (annonces), `plugin.team.points.updated.v1` (classement).

### Sécurité

* `DISCORD_TOKEN` / `LE3_DISCORD_BOT_TOKEN` exclusivement via `process.env`, validé au démarrage
  avec échec immédiat si absent.
* Toute commande administrative doit re-vérifier une permission Discord côté serveur
  (`PermissionsBitField`), jamais se fier au masquage de l'interface.
* Bot de test et serveur Discord dédiés en développement ; le jeton de production n'est accessible
  qu'aux workflows GitHub.

### Cohérence visuelle

Les embeds doivent utiliser la palette de marque (voir [Design System](../guidelines/design-system)) :
`#0094FF` pour l'information, `#E73344` pour les alertes, `#1A2238` en fond. Pied de page
systématique : « 3LEvent — Système Automatisé ».

---

## 4. Structure de dépôt proposée

```text
LE3-App-DiscordBot/
├── src/
│   ├── commands/            # une commande slash par fichier
│   ├── events/
│   │   ├── discord/         # ready, interactionCreate…
│   │   └── ecosystem-event.ts   # copie du contrat du bus
│   ├── services/            # bus Redis, appels API, formatage des embeds
│   ├── utils/
│   └── index.ts
├── Dockerfile
└── package.json
```

---

### Prochaines étapes

* **[Protocoles de communication](../architecture/communication-protocol)** — le contrat à respecter
* **[Applications Web](./web-applications)** — les conventions Node de l'organisation
