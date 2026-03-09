---
sidebar_position: 3
---

# Bibliothèque de Snippets

Cette section regroupe les modèles de code approuvés pour l'écosystème **3LEvent**. L'utilisation de ces extraits garantit la maintenabilité, la sécurité et la cohérence visuelle entre les différents modules (Minecraft, Web, Discord).

---

## 1. Java / Paper API (Plugins Minecraft)

Tout plugin doit utiliser l'API **MiniMessage** pour le formatage et privilégier l'asynchronisme pour les opérations lourdes.

### Structure d'une Commande Standard
Les commandes doivent valider les permissions et utiliser les composants de texte pour respecter le Design System.

```java
public class TeamInfoCommand implements CommandExecutor {

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (!(sender instanceof Player player)) return true;

        // Instance MiniMessage pour le formatage
        var mm = MiniMessage.miniMessage();
        
        if (!player.hasPermission("le3.player.info")) {
            player.sendMessage(mm.deserialize("<red>Erreur :</red> <gray>Vous n'avez pas la permission.</gray>"));
            return true;
        }

        // Appel à l'API du Core (Exemple)
        Team team = CoreAPI.getInstance().getTeamManager().getPlayerTeam(player.getUniqueId());
        
        // Message avec dégradé conforme à la charte graphique
        player.sendMessage(mm.deserialize(
            "<gradient:#10B981:#6366F1><bold>3LEvent</bold></gradient> <dark_gray>»</dark_gray> " +
            "<gray>Votre équipe :</gray> <white>" + team.getName() + "</white>"
        ));

        return true;
    }
}

```

### Accès Base de Données (Asynchrone)

Il est strictement interdit de bloquer le thread principal pour des requêtes SQL ou Redis.

```java
public CompletableFuture<Void> updatePlayerPoints(UUID uuid, int points) {
    return CompletableFuture.runAsync(() -> {
        try (Connection conn = dataSource.getConnection()) {
            String query = "UPDATE le3_players SET score = score + ? WHERE uuid = ?";
            PreparedStatement ps = conn.prepareStatement(query);
            ps.setInt(1, points);
            ps.setString(2, uuid.toString());
            ps.executeUpdate();
        } catch (SQLException e) {
            plugin.getLogger().severe("Erreur lors de la mise à jour du score : " + e.getMessage());
        }
    });
}

```

---

## 2. TypeScript / Angular (Web Applications)

Les applications Web doivent séparer la logique de l'interface via des services et utiliser un typage strict.

### Service d'API avec Typage Strict

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface LeaderboardEntry {
  teamName: string;
  points: number;
  rank: number;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly endpoint = `${environment.apiUrl}/stats/leaderboard`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère le classement actuel
   */
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(this.endpoint);
  }
}

```

---

## 3. Node.js / Discord.js (Discord Bot)

Les interactions doivent utiliser les **Slash Commands** et respecter le format des Embeds officiels.

### Template de Commande Slash

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('score')
    .setDescription('Affiche le score actuel de votre équipe'),

  async execute(interaction: ChatInputCommandInteraction) {
    const scoreEmbed = new EmbedBuilder()
      .setColor(0x10B981) // Emerald-500
      .setTitle('🏆 Classement Actuel')
      .addFields(
        { name: 'Équipe', value: 'Alpha', inline: true },
        { name: 'Points', value: '1,250', inline: true }
      )
      .setFooter({ text: '3LEvent - Système Automatisé' })
      .setTimestamp();

    await interaction.reply({ embeds: [scoreEmbed] });
  },
};

```

---

## 4. Frontend / UI (Tailwind CSS)

Utilisation des variables CSS globales pour les composants d'interface.

### Carte de Statistique (Standard)

```html
<div class="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg transition-all hover:border-emerald-500/50">
  <span class="text-emerald-500 text-xs font-bold uppercase tracking-widest">Live Stats</span>
  <h3 class="text-white text-xl font-black mt-1">Total Points</h3>
  <div class="mt-4 flex items-center justify-between">
    <p class="text-4xl text-white font-mono">45,820</p>
    <div class="h-8 w-8 bg-emerald-500/10 flex items-center justify-center rounded-full">
      <lucide-icon name="trending-up" class="text-emerald-500 w-4 h-4"></lucide-icon>
    </div>
  </div>
</div>

```

---

## 5. CI/CD (GitHub Actions)

Appel d'un workflow réutilisable avec injection de secrets.

```yaml
name: Production Deployment
on:
  push:
    branches: [main]

jobs:
  deploy:
    uses: 3LEvent/LE3-Shared-Workflows/.github/workflows/angular-deploy.yml@main
    with:
      project-name: 'web-main-app'
    secrets:
      # Héritage automatique des secrets de l'organisation
      token: ${{ secrets.LE3_CLOUDFLARE_API_TOKEN }}

```

---

### Prochaines étapes

Cette bibliothèque est mise à jour régulièrement. Si vous avez besoin d'un nouveau pattern spécifique pour le **[Bot Discord](https://www.google.com/search?q=./projects/discord-bot)** ou les **[Plugins Minecraft](https://www.google.com/search?q=./projects/minecraft-plugins)**, contactez le Lead Dev.