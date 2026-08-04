---
sidebar_position: 4
---

# BMAD : cadrage assisté

**BMAD-METHOD** est installé au niveau du workspace 3LEvent. Il fournit un jeu d'agents
spécialisés, analyste, product manager, architecte, développeur, et des workflows de cadrage qui
produisent des artefacts versionnés plutôt que des conversations.

Cette page dit **quand il apporte quelque chose**, ce qui est plus utile que la liste de ses
fonctionnalités.

---

## 1. Le principe

Un échange libre avec un modèle produit une réponse. BMAD produit un **document** : brief
produit, PRD, spécification d'architecture, découpage en epics et stories. Ces documents sont
relus, corrigés, versionnés, et servent ensuite de contexte à l'implémentation.

L'intérêt n'est pas le document en lui-même, c'est qu'il **force à trancher avant d'écrire du
code**. La plupart des reprises coûteuses viennent d'un besoin mal posé, pas d'une mauvaise
implémentation.

## 2. Quand il est rentable

| Situation | Verdict |
| :--- | :--- |
| Nouvelle fonctionnalité dont le périmètre n'est pas arrêté | **Oui.** C'est le cas nominal |
| Nouveau service dans l'écosystème | **Oui.** L'agent architecte confronte l'existant, notamment le bus d'événements et les valeurs partagées |
| Reprise d'un module que personne n'a touché depuis des mois | **Oui**, pour la documentation d'existant avant modification |
| Correction de bug | **Non.** Aller directement au code |
| Montée de version de dépendance | **Non** |
| Besoin déjà clair, découpage évident | **Non.** Le cadrage produirait une paraphrase |

Le mauvais usage le plus courant est de cadrer ce qui est déjà cadré. On obtient alors un
document long qui n'apprend rien et qu'il faut quand même relire.

## 3. Une installation, pas seize

BMAD est installé **au niveau du workspace**, pas dans chaque dépôt. C'est délibéré.

Les défaillances les plus coûteuses de cet écosystème sont des **désynchronisations entre
dépôts** : un contrat d'événement modifié d'un seul côté, une valeur partagée qui diverge, une
documentation qui décrit un comportement disparu. Un agent qui ne voit qu'un service ne peut pas
les détecter.

La configuration pointe la documentation officielle comme source de vérité sur l'intention, et
le code comme source de vérité sur le comportement. Quand les deux divergent, c'est un défaut à
signaler, pas une ambiguïté à trancher seul.

## 4. Ce qu'il ne remplace pas

BMAD structure la réflexion, il ne la produit pas. Un PRD généré à partir d'une demande vague
sera un PRD vague, plus long et donc plus difficile à contester.

Il ne remplace pas non plus la revue : un découpage en stories reste une proposition, et
l'ordonnancement de sprint reste une décision d'équipe.

## 5. En pratique

Les agents et workflows sont exposés à Claude Code sous forme de compétences invocables. Le
runbook d'installation, les adaptations propres à 3LEvent et la liste des workflows disponibles
sont dans `docs/bmad.md` du workspace, et les instructions destinées aux agents dans
`ai/bmad.md` du dépôt d'organisation.

Les artefacts produits sont écrits dans un dossier de sortie dédié. **Ils se relisent et se
corrigent avant d'être utilisés comme contexte d'implémentation** : un document faux propagé
dans les stories coûte plus cher que pas de document du tout.
