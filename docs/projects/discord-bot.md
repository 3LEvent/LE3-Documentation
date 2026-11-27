---
sidebar_position: 6
---

# Discord Bot

Dépôt `LE3-Discord-Bot`. Vérification des inscriptions par code, gestion des équipes, tickets de
support et salons vocaux privés sur le serveur Discord.

Node 22, TypeScript strict ESM, discord.js 14, Mongoose 9. Aucun port exposé : le bot ouvre une
connexion sortante vers Discord et n'écoute nulle part.

---

## 1. Le point structurant : deux bases de données

C'est la particularité de ce service, et elle est délibérée.

| Connexion | Variable | Contenu | Propriétaire |
| :--- | :--- | :--- | :--- |
| `bot` | `LE3_BOT_MONGO_URI` | `tickets`, `voicerooms`, `guildsettings` | ce service |
| `site` | `LE3_MONGO_URI` | `users`, `teams`, `signups`, `verifications` | `LE3-Web-Main` |

**Le démarrage échoue si les deux URI désignent la même base.** Ce n'est pas une précaution de
style : la version précédente du bot partageait la base du site et y redéfinissait ses schémas
avec des champs supplémentaires. `avatarUrl` et `discord_avatar` sur les utilisateurs, `max_size`
et `status` sur les équipes : aucun n'existe dans les schémas du site, et tous ont été écrits sur
des documents de production avant d'être nettoyés à la main.

Les modèles de `backend/models/site/` sont donc des copies conformes de ceux de `LE3-Web-Main`.
**Ne jamais y ajouter un champ.** Un ajout côté site commence dans `LE3-Web-Main`.

## 2. Commandes

| Commande | Rôle | Permission |
| :--- | :--- | :--- |
| `/verify <code>` | Valide le code affiché sur la page d'inscription, approuve l'inscription, attribue le rôle participant et le rôle d'équipe | membres autorisés |
| `/team info` | Équipe du membre et ses inscrits ; le capitaine y voit le code d'invitation et peut en générer un nouveau | membres |
| `/team size` | Nombre de joueurs validés par équipe | staff |
| `/team roles` | Crée les rôles d'équipe manquants et les aligne sur les inscriptions validées, après confirmation | staff |
| `/linked [membre]` | Liaisons Discord vers Minecraft ; aussi en clic droit sur un membre, **Fiche 3LEvent** | staff |
| `/ticket open` | Formulaire de ticket : type de demande, description, preuves | tout le monde |
| `/ticket …` | Fermeture (auteur ou staff), panneau, ajout, retrait, prise en charge, renommage, transcript | staff |
| `/help` | Commandes du bot et liens utiles | tout le monde |

Les messages du bot sont en **Components V2** (cartes à couleur d'accent, sections, galeries) et
toutes les commandes sont limitées au serveur.

**Tickets.** Le bouton **Créer un ticket** du panneau de `#support` ouvre le même formulaire que
`/ticket open`. Les types de demande reprennent les cas de la page « Problèmes et tickets » du
wiki joueur, avec pour chacun ce que le staff doit recevoir. À la fermeture, confirmée par une
fenêtre avec raison facultative, l'historique est archivé dans le salon des transcripts et envoyé
en message privé à l'auteur, puis le salon est supprimé.

**Salons vocaux.** Rejoindre le salon relais crée un salon privé fermé, confié au membre, avec un
panneau : ouvrir ou fermer, inviter ou retirer des membres, places, nom. Quand le propriétaire part,
le salon passe à un membre encore présent ; vide, il est supprimé. Au démarrage, le bot rattrape
ce qui s'est passé pendant son absence.

Les permissions sont exprimées dans `config.json` sous forme de clés de rôles, une par usage,
jamais d'identifiants Discord en dur dans le code.

## 3. Ce qui casse en silence

**Le hash de l'OTP.** `hashOtp` doit rester identique à celui du site : le site écrit le hash, le
bot le compare. Changer l'algorithme casserait toutes les vérifications sans lever la moindre
erreur. Un test verrouille la valeur de référence.

**La taille maximale des équipes** vit dans la base du bot, pas sur les documents `teams`.
Auparavant elle était écrite dans un champ que le site ne déclarait pas, donc la vérification
« équipe complète » de `/verify` comparait un nombre à `undefined` et **ne se déclenchait jamais**
pour une équipe créée depuis le site.

**Le numéro de ticket** est séquentiel par serveur. La lecture du maximum et l'insertion ne sont
pas atomiques : c'est l'index unique `(guild_id, number)` qui empêche deux tickets identiques, et
le service réessaie sur collision.

## 4. Gestion des erreurs

Deux catégories, et la distinction pilote ce que voit l'utilisateur.

`UserFacingError` porte un message écrit pour la personne : compte non lié, code expiré, équipe
complète. Ce n'est pas un incident et ce n'est pas journalisé comme tel.

Tout le reste est un défaut : message générique pour l'utilisateur, détails dans le journal. Un
message interne ne doit jamais atteindre Discord, il peut contenir une chaîne de connexion.

`backend/interactions/router.ts` est le **seul** endroit qui décide de la réponse en cas
d'erreur.

## 5. Exploitation

Le bot tourne en conteneur sur `dockerubuntu`, au même titre que les trois applications web, et
reçoit ses secrets d'Infisical au démarrage. **Aucun `.env` sur le serveur.**

Il est déployé par le même script que les autres services, avec une nuance : n'exposant aucun
port, sa sonde de santé ne peut pas être une requête HTTP. Le script exige à la place que le
conteneur tourne depuis au moins vingt secondes sans avoir redémarré, ce qu'une boucle de crash
ne satisfait jamais.

`npm run register` publie les commandes slash. Il **remplace** l'intégralité du jeu de commandes
du serveur : toute commande absente du code disparaît. Le bot ne s'enregistre jamais lui-même au
démarrage.
