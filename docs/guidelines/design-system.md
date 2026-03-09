---
sidebar_position: 12
---

# Design System

Le Design System du **3LEvent** définit les règles visuelles obligatoires pour l'ensemble des plateformes de l'écosystème. L'objectif est d'assurer une expérience utilisateur fluide et une reconnaissance immédiate de la marque "3LEvent".

---

## 1. Palette de Couleurs

L'identité visuelle repose sur une base sombre (Dark Mode) avec des accents contrastés pour la lisibilité.

### Couleurs Primaires
| Usage | Nom | Hexadécimal | Application |
| :--- | :--- | :--- | :--- |
| **Fond Principal** | `Dark-900` | `#0F172A` | Background Web / GUI Sombre |
| **Accent Primaire** | `Emerald-500` | `#10B981` | Boutons, succès, liens |
| **Accent Secondaire**| `Indigo-500` | `#6366F1` | Éléments de marque, CTA |

### Couleurs de Statut
| État | Hexadécimal | Utilisation |
| :--- | :--- | :--- |
| **Succès** | `#22C55E` | Validation, points gagnés |
| **Erreur** | `#EF4444` | Alertes, bannissements, échecs |
| **Alerte** | `#F59E0B` | Maintenance, avertissements |
| **Info** | `#3B82F6` | Informations neutres, logs |



---

## 2. Typographie

### Environnement Web (Angular)
* **Police Principale** : `Inter` ou `Roboto` (Sans-serif).
* **Hiérarchie** :
    * `h1` : 2.25rem, Bold.
    * `h2` : 1.5rem, Semi-bold.
    * `Body` : 1rem, Regular.

### Environnement Minecraft
* **Police** : Police par défaut de Minecraft.
* **Formatage** : Utilisation stricte de l'API **MiniMessage** pour les dégradés et les couleurs hexadécimales.
* **Standard** : Ne jamais utiliser les codes de couleur classiques (`&a`, `&c`) pour les éléments de l'interface utilisateur fixe.

---

## 3. Intégration Technique (CSS Variables)

Toutes les applications web doivent importer le fichier `variables.scss` fourni dans le `LE3-Web-Template`.

```css
:root {
  /* Brand Colors */
  --le3-primary: #10B981;
  --le3-secondary: #6366F1;
  
  /* Backgrounds */
  --le3-bg-main: #0F172A;
  --le3-bg-card: #1E293B;
  
  /* Text */
  --le3-text-high: #F8FAFC;
  --le3-text-muted: #94A3B8;
  
  /* Status */
  --le3-success: #22C55E;
  --le3-error: #EF4444;
}

```

---

## 4. Composants UI (Web)

Pour garantir la cohérence, utilisez les composants Angular pré-faits :

* **Boutons** : Bordures arrondies (8px), transition douce (200ms).
* **Cartes** : Background `--le3-bg-card`, bordure légère de 1px.
* **Inputs** : Focus avec outline `--le3-primary`.

---

## 5. Interface Minecraft (GUI)

Les menus d'inventaire doivent respecter la structure suivante :

1. **Bordures** : Utilisation de vitres teintées (Stained Glass Pane) grises ou noires pour délimiter les zones.
2. **Pagination** : Boutons "Précédent" (Flèche gauche) et "Suivant" (Flèche droite) placés systématiquement en bas de l'interface.
3. **Titres** : Toujours centrés et utilisant le préfixe de l'event (ex: `[3LEvent] Classement`).

---

## 6. Iconographie

* **Web** : Utilisation exclusive de la bibliothèque **Lucide React** (ou Angular equivalent) pour des icônes fines et professionnelles.
* **Discord** : Utilisation d'icônes personnalisées (Emojis de guilde) pour les indicateurs de statut, sans utiliser d'emojis standards dans les titres de salons.
* **In-game** : Utilisation de caractères Unicode spécifiques intégrés au Resource Pack de l'évenement.

---

### Prochaines étapes

* **[Consulter les Snippets de Code UI](https://www.google.com/search?q=./guidelines/code-snippets)**
* **[Guide de développement Angular](https://www.google.com/search?q=./projects/web-applications)**