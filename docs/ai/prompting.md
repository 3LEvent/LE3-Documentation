---
sidebar_position: 2
---

# Méthode : formuler une demande utile

La qualité d'une réponse dépend moins du modèle que de ce qu'on lui donne. Cette page décrit la
méthode attendue sur 3LEvent, avec des exemples pris dans notre propre écosystème.

---

## 1. L'anatomie d'une demande qui aboutit

Une bonne demande tient en quatre blocs. Les deux premiers sont indispensables, les deux suivants
font la différence entre un résultat correct et un résultat exploitable.

### Le but, pas la solution

Décris **le problème observé**, pas la correction que tu as en tête. Une demande formulée comme
une solution enferme l'agent dans ton hypothèse, y compris quand elle est fausse.

> ❌ « Ajoute un `try/catch` autour de l'appel Redis dans le panel. »
>
> ✅ « Le panel affiche un classement vide en production alors que le plugin publie bien sur le
> bus. Trouve pourquoi et corrige. »

La seconde formulation autorise l'agent à découvrir que le vrai problème est un `REDIS_URL`
divergent entre le plugin et les applications web, ce qu'un `try/catch` aurait masqué.

### Le périmètre

Dis explicitement ce qui est **hors sujet**. Un agent capable a tendance à élargir : il corrigera
volontiers trois autres choses au passage, et ta PR deviendra irrelisable.

> « Ne touche qu'au contrôleur des pronostics. Si tu vois autre chose à corriger, signale-le sans
> le faire. »

### Le critère de réussite

Comment saura-t-on que c'est fait ? Sans critère, l'agent s'arrête quand le code compile, ce qui
ne veut rien dire.

> « C'est bon quand `npm test` passe et qu'un pronostic sur une équipe supprimée renvoie une 404
> au lieu d'une 500. »

### Les contraintes non devinables

Tout ce qu'un lecteur du dépôt ne pourrait pas déduire seul : une décision passée, une échéance,
une dépendance externe, une contrainte de compatibilité.

> « La table MySQL est écrite par le plugin, qu'on ne peut pas redéployer avant l'événement. Le
> schéma est donc figé. »

## 2. Ce qu'il faut fournir comme contexte

L'erreur la plus fréquente est d'en donner trop peu. La seconde est d'en donner trop, ce qui
noie le signal.

**À fournir systématiquement** : le message d'erreur **complet et brut**, pas ton résumé ; le
comportement attendu opposé au comportement observé ; ce que tu as déjà essayé et le résultat.

**À ne jamais fournir** : le contenu d'un fichier `.env`, une URL contenant un jeton, une sortie
de commande non relue. Une valeur secrète transmise une fois est une valeur à rotationner, même
dans un outil privé. Notre `ROTATION.md` recense plusieurs entrées dont l'origine est exactement
cela.

**À laisser l'agent chercher lui-même** : le contenu des fichiers. Coller trois cents lignes de
code est presque toujours inutile quand l'agent a accès au dépôt, et cela l'empêche de constater
l'état réel du fichier au moment où il travaille.

## 3. Demander la vérification, pas la promesse

Un agent affirmera volontiers avoir vérifié quelque chose. Exige la **trace** de la vérification.

> « Ne me dis pas que le champ est inutilisé : montre-moi la commande de recherche que tu as
> lancée et sa sortie. »

Cette exigence a une valeur pratique immédiate. Sur cet écosystème, plusieurs affirmations
plausibles se sont révélées fausses à la vérification : une branche supposée fusionnée qui
portait un fichier absent de `main`, une collection supposée en croissance libre qui était en
réalité plafonnée, une sonde de santé supposée fiable qui validait un conteneur en boucle de
crash.

Dans les trois cas, la formulation initiale était affirmative et fausse. C'est la vérification
explicite qui a tranché.

## 4. Travailler par étapes

Une demande volumineuse produit une réponse volumineuse, difficile à relire, où une erreur passe
inaperçue.

Le découpage qui fonctionne :

1. **Analyse sans écriture.** « Explique-moi comment fonctionne X et où sont les pièges. »
2. **Plan.** « Propose une approche, liste ce qui pourrait casser. »
3. **Exécution.** « Applique le plan, un fichier à la fois. »
4. **Vérification.** « Lance les tests et montre-moi la sortie. »

Sur une opération destructive, l'étape 3 se fait toujours **après une sauvegarde**, et le mode
simulation précède l'exécution réelle.

## 5. Quand l'agent se trompe

Deux réflexes utiles.

**Ne pas insister sur la même formulation.** Répéter une demande qui a échoué produit
généralement le même échec. Reformule en changeant l'angle : donne le message d'erreur exact,
ou demande d'abord un diagnostic sans correction.

**Se méfier de la correction trop rapide.** Un agent qui corrige instantanément après un « non,
c'est faux » n'a souvent rien compris de plus : il a simplement changé de proposition. Demande
pourquoi la première réponse était fausse avant d'accepter la seconde.

## 6. Le cas particulier des versions

Un modèle raisonne sur des données d'entraînement figées. Sur tout ce qui bouge vite, sa réponse
est plausible et périmée.

Concrètement : numéros de version, options de CLI, chemins dans une interface d'administration,
disponibilité d'une fonctionnalité selon l'édition d'un produit. Sur ces sujets, exige que
l'agent consulte la documentation officielle ou le code source, et qu'il cite sa source.

Un exemple vécu : le runbook de bascule sur le coffre de secrets supposait qu'une variable
d'environnement suffisait à authentifier un CLI. C'était vrai à une époque, faux dans la version
déployée. Seule la lecture du comportement réel l'a révélé.
