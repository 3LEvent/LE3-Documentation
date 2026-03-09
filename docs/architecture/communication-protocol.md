---
sidebar_position: 3
---

# Protocoles de Communication

L'écosystème **3LEvent** repose sur une architecture distribuée où la cohérence des données est critique. Cette page définit les standards de communication entre les services Java (Plugins), les applications TypeScript (Web/Bot) et l'infrastructure de données.

---

## 1. Vue d'ensemble des Flux

La communication est segmentée en trois couches distinctes selon le besoin de réactivité :

1.  **REST API (HTTPS)** : Pour les requêtes transactionnelles et persistantes (Inscriptions, Profils, Historique).
2.  **WebSockets / Socket.io** : Pour la diffusion temps réel (Live Leaderboard, Alertes in-game).
3.  **Redis Pub/Sub** : Pour la synchronisation interne entre les serveurs Minecraft et le Bot Discord.

---

## 2. API REST (Synchronisation des données)

L'API centrale (Node.js/TypeScript) sert de passerelle entre la base de données et les clients.

### Standards de Requête
* **Format** : JSON (Application/json).
* **Authentification** : Chaque requête doit inclure un Header `Authorization: Bearer <TOKEN>`.
* **Codes de Statut HTTP** :
    * `200 OK` : Succès de la requête.
    * `401 Unauthorized` : Token absent ou invalide.
    * `403 Forbidden` : Accès refusé (Permissions insuffisantes).
    * `429 Too Many Requests` : Rate-limit Cloudflare atteint.

### Structure de Réponse Standard
```json
{
  "success": true,
  "timestamp": "2026-03-09T15:30:00Z",
  "data": { ... },
  "error": null
}