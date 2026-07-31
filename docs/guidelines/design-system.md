---
sidebar_position: 4
---

# Design System

Le design system du 3LEvent est implémenté en **Tailwind CSS v4**, sans fichier de configuration
JavaScript : les tokens sont déclarés dans la directive `@theme` de `public/src/input.css`, dans
chaque application.

:::warning `tailwind.config.js` n'est plus la source de vérité
Chaque dépôt contient encore un `tailwind.config.js` hérité de Tailwind v3. En v4, **c'est
`public/src/input.css` qui fait foi**. Modifier une couleur dans le fichier JS n'a aucun effet.
:::

---

## 1. Palette de marque — la règle des trois couleurs

L'identité repose sur trois couleurs, et trois seulement.

| Token | Hex | Rôle |
| :--- | :--- | :--- |
| `--color-le3-dark` | `#1A2238` | Dominante, texte principal |
| `--color-le3-blue` | `#0094FF` | Action primaire, liens, information |
| `--color-le3-red` | `#E73344` | Accent, action secondaire, alerte |

Sur le site principal (`3levent`), le minimalisme est poussé jusqu'au bout : les couleurs de
statut sont **absorbées** dans la palette de marque.

```css
--color-success: #0094FF;   /* Succès = bleu */
--color-warning: #E73344;   /* Attention = rouge */
--color-error:   #E73344;   /* Erreur = rouge */
```

Les anciens tokens `--color-le3-yellow` et `--color-le3-pink` y sont alias sur le bleu et le rouge,
pour ne pas casser le HTML existant. **Ne les utilisez pas dans du code neuf.**

---

## 2. Trois applications, trois variantes

### `3levent` — clair, marque pure

Surfaces `#FFFFFF` / `#F8FAFC`, texte `#1A2238`, bordures `#E2E8F0` / `#94A3B8`. Les couleurs
sociales sont, elles aussi, ramenées à la palette de marque (Discord et Twitter en bleu, YouTube en
rouge, Twitch en dark).

### `3levent-panel` — clair, neutre « entreprise »

Le panel garde les trois couleurs de marque **en accents seulement** et repose sur des neutres
plus froids, plus lisibles pour de longues sessions de travail. Ses couleurs de statut sont
sémantiques, pas brandées :

| Token | Hex | | Token | Hex |
| :--- | :--- | :--- | :--- | :--- |
| `--color-surface-base` | `#FFFFFF` | | `--color-success` | `#16A34A` |
| `--color-surface-muted` | `#F6F7F9` | | `--color-warning` | `#D97706` |
| `--color-surface-alt` | `#F1F3F6` | | `--color-error` | `#DC2626` |
| `--color-border-subtle` | `#E6E9EE` | | `--color-text-main` | `#1F2733` |
| `--color-border-strong` | `#CBD2DC` | | `--color-text-muted` | `#5B6675` |

### `3levent-live` — sombre

Le Live est la seule application au thème sombre. Il conserve la palette historique complète
(`le3-yellow` `#FFCD00`, `le3-pink` `#F04A92`) et les **vraies** couleurs des plateformes
(Discord `#5865F2`, Twitch `#9146FF`, Twitter `#1DA1F2`).

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--color-live-bg` | `#0f1424` | Fond principal |
| `--color-live-panel` | `#161d31` | Conteneurs, cartes |
| `--color-live-card` | `#202840` | Lignes du classement |
| `--color-live-border` | `#ffffff1a` | Bordures (blanc 10 %) |

:::caution Les palettes divergent volontairement
N'harmonisez pas les trois `input.css` sans décision explicite : le contexte d'usage n'est pas le
même (vitrine publique, outil de travail, overlay de diffusion).
:::

---

## 3. Typographie

* **Police principale** : `Outfit`, avec repli `ui-sans-serif, system-ui, sans-serif`
  (`--font-main`).
* **Police monospace** (panel uniquement) : `JetBrains Mono`, repli `ui-monospace,
  SFMono-Regular, Menlo` (`--font-mono`) — utilisée pour la console de logs.
* In-game : police Minecraft par défaut, formatage via les codes `&` et hexadécimaux `&#RRGGBB`
  résolus par `ColorTranslator`.

---

## 4. Composants

Les composants sont des classes déclarées dans `@layer components` avec `@apply`. Utilisez-les :
n'écrivez pas une chaîne d'utilitaires quand une classe existe déjà.

### Boutons (panel)

| Classe | Apparence |
| :--- | :--- |
| `.btn-primary` | Fond `le3-blue`, texte blanc |
| `.btn-danger` | Fond `le3-red`, texte blanc |
| `.btn-ghost` | Fond clair, bordure, texte atténué |
| `.btn-soft` | Fond `le3-blue/10`, texte `le3-blue` |
| `.btn-discord` | `#5865F2` — seule exception à la règle des trois couleurs |

### Badges

`.badge-admin` (rouge), `.badge-staff` (bleu), `.badge-member` (neutre), et sur le panel
`.badge-success`, `.badge-warning`, `.badge-error`. Motif systématique : `bg-<couleur>/10` +
`text-<couleur>` — fond teinté à 10 %, jamais de fond plein.

### Structure

`.app-header`, `.admin-nav-item`, `.panel-card`, `.stat-card`, `.section-title`,
`.section-subtitle`, `.eyebrow`, `.data-table`, `.modal-overlay`, `.modal-container`,
`.admin-label`, `.admin-input`, `.log-console`, `.status-dot-online` / `.status-dot-offline`.

### Animations

Définies en `@keyframes` dans `@theme` : `fade-up`, `slide-down`, `float`, `spin-slow`,
`pulse-dot`, `modal-in`, `pulse-fast`, `ping-neutral`. Courbe standard :
`cubic-bezier(0.16, 1, 0.3, 1)`.

### Accessibilité

Le focus visible est traité globalement dans `@layer base` :

```css
a:focus-visible, button:focus-visible, input:focus-visible {
    @apply outline-2 outline-offset-2 outline-le3-blue/60;
}
```

Ne supprimez jamais cet outline sur un composant sans le remplacer par un indicateur équivalent.

---

## 5. Chaîne de build CSS

```bash
npm run dev:css     # @tailwindcss/cli --watch
npm run build:css   # --minify vers public/css/style.css
```

:::danger `public/css/style.css` est généré
Ne l'éditez jamais à la main : il est écrasé à chaque build. Toute modification de style se fait
dans `public/src/input.css`.
:::

---

## 6. Interface in-game

Les menus d'inventaire du plugin sont **entièrement paramétrés dans `config.yml`**, pas codés en
dur : emplacements (`menu.slots`), matériaux (`menu.materials`) et mises en page de lore
(`menu.lore_layouts`).

Conventions actuelles :

* Zones d'objets déclarées en plages (`"10-16,19-25,28-34,37-43"`).
* Navigation par flèches (`ARROW`), boutons de filtre invisibles (`STRUCTURE_VOID`).
* Succès terminé : `GREEN_TERRACOTTA` ; en cours : `RED_TERRACOTTA`.
* Palette in-game : `&#7d97db` (bleu doux) pour les valeurs, `&#db7d7d` (rouge doux) pour les
  titres, `&#A2D149` (vert) pour les confirmations, `&c` pour les erreurs.
* Petites capitales Unicode (`ᴘʀᴏɢʀès`, `ᴘᴏɪɴᴛs`) pour l'esthétique du serveur.

:::note L'in-game diverge du web
La palette in-game (`#7d97db`, `#db7d7d`, `#A2D149`) n'est pas celle du web (`#0094FF`,
`#E73344`). C'est un écart existant, à trancher : soit aligner l'in-game sur la marque, soit
documenter l'in-game comme un univers visuel distinct.
:::

---

## 7. Iconographie

* **Web** : **Font Awesome** via CDN (`cdnjs.cloudflare.com`, autorisé dans la CSP). Les modèles
  stockent des classes d'icônes en base (`categories.icon` avec `fa-comments` par défaut,
  `resourcelinks.icon` avec `fa-link`).
* **Avatars joueurs** : `mc-heads.net` — tête Minecraft à partir du `mc_uuid`, avec repli
  `MHF_Steve` géré par un `onerror`. Aucun avatar Discord n'est utilisé côté site public.
* **In-game** : caractères Unicode du resource pack, injectés via les placeholders
  `%img_teamN%`.

---

### Prochaines étapes

* **[Bibliothèque de snippets](./code-snippets)**
* **[Applications Web](../projects/web-applications)**
