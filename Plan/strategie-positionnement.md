# Stratégie de positionnement

Objectif : un lignage lisible à 7 générations, où un chef, ses épouses et les enfants de chaque foyer restent distincts, et où un cousin partage le niveau de son cousin sans jamais emprunter la même barre de filiation.

La vue par défaut proposée est le **lignage descendant** depuis un fondateur (le chef, l’ancêtre de la chefferie). Ce graphe, tant que l’on ne dessine pas en même temps tous les ascendants de toutes les alliances, reste presque planaire : on peut promettre des couloirs qui ne se croisent pas. L’heure en sablier (ancêtres au-dessus, descendants en dessous) reste un mode focal, pas la vue d’ensemble.

## 1. Une génération = une bande horizontale

La génération n’est pas la profondeur d’un parcours D3. Elle se calcule sur le graphe, une fois, pour tout le lignage visible :

- les personnes sans parent dans le graphe sont à la génération 0 (ou à la génération de leur conjoint, si elles n’entrent que par une alliance) ;
- tout enfant est à `max(générations de ses parents) + 1` ;
- un conjoint sans ascendance propre prend la génération de l’ancre du foyer, pour rester sur la même ligne.

L’ordonnée est alors globale :

```
y(personne) = generation * hauteurDeBande
```

Conséquence : frères, sœurs et cousins germains sont sur la même horizontale, même si une branche a 2 enfants et la voisine 11. L’âge ne déplace pas la bande. Un cadet né tard reste avec sa génération généalogique. Un décalage d’âge se lit dans la fiche (dates), pas dans la géométrie.

Les alliances (épouses dont on ne développe pas les parents) occupent la même bande que leur conjoint. Leurs propres ascendants n’apparaissent que si l’on ouvre explicitement cette branche : sinon ils élargiraient le lignage et casseraient les couloirs.

## 2. Le foyer est l’atome de placement

On ne place pas « les enfants d’un homme ». On place des **foyers**.

Un foyer est une union ordonnée :

- une ancre (souvent le mari, dans une chefferie) ;
- une conjointe (ou un conjoint) ;
- les enfants dont les deux parents sont exactement cette union ;
- un rang : ordre du mariage, ou ordre saisi (première épouse, deuxième épouse…).

`Marriage` existe déjà et possède `childrenIds`. C’est le bon support, à condition que l’ajout d’un enfant écrive cet identifiant de mariage, et n’ajoute comme second parent **que** le conjoint de ce foyer. Le comportement actuel de `PersonFormModal` (copier tous les `spouseIds`) est à abandonner avant même le dessin.

Un homme avec trois épouses produit trois foyers qui **partagent** la même carte d’ancre. Il n’est pas dupliqué en trois pères.

### Couloir

Chaque foyer possède un intervalle horizontal fermé `[x0, x1]`. Règle dure :

- les enfants d’un foyer, et plus tard leurs propres foyers, restent **strictement à l’intérieur** de l’intervalle du foyer parent ;
- les foyers d’un même père sont côte à côte, dans l’ordre de rang, sans entrelacer leurs enfants ;
- l’intervalle du père est l’union des intervalles de ses foyers.

C’est ce qui sépare fils et cousins. Le cousin est l’enfant du foyer de l’oncle. Il est sur la même bande que moi, mais dans le couloir de l’oncle, sous la barre de l’oncle. Aucune verticale ne sort de son couloir pour rejoindre mon père.

```
Génération 0
                 [Fondateur]——◆——[Épouse]
                          |
Génération 1
        [Fils A]——◆——[Ép. A]          [Fils B]——◆——[Ép. B]
                 |                              |
Génération 2
         [moi]  [frère]                 [cousin]  [cousine]
         couloir de A                   couloir de B
```

Les deux enfants de A et les deux enfants de B sont alignés. Leurs barres ne se touchent pas.

### Largeur, du bas vers le haut

On ne demande pas à `d3.tree` de deviner. On mesure, puis on place.

1. Une feuille (personne sans foyer enfant ouvert) occupe une largeur de carte fixe, assez grande pour le portrait et deux lignes de nom.
2. Un foyer vaut au moins la largeur de sa rangée de conjoints, et au moins la somme des largeurs de ses sous-foyers plus les gouttières.
3. On place de gauche à droite, en respectant l’ordre de naissance dans la fratrie et l’ordre de rang des épouses.
4. La carte de l’ancre est centrée sur l’union de ses foyers, sur la bande de sa génération. Chaque épouse est centrée sur **son** couloir, sur la même bande.

Polygamie, même principe :

```
Génération G
 [Épouse 1]——◆——[Chef]——◆——[Épouse 2]——◆——[Épouse 3]
        |                  |                  |
        |                  |                  |
Génération G+1
   [a] [b] [c]          [d] [e]         [f] [g] [h] [i]
   foyer 1              foyer 2         foyer 3
```

Le chef est une seule carte. Un rail horizontal relie ses unions. Chaque ◆ n’arrose que les enfants de cette épouse. a, b, c ne deviennent pas frères et sœurs de d.

Le rail du chef et la barre des enfants ne sont pas la même ligne : le rail est **sur** la bande des adultes, entre les cartes ; la barre des enfants est **entre** les deux bandes.

### Cas à trancher avant le code, avec une position par défaut

| Situation | Défaut proposé |
| --- | --- |
| Épouse qui a aussi des enfants d’une union précédente | Second foyer, couloir voisin, même génération d’enfants. Elle a deux ◆, pas une fratrie fusionnée |
| Femme avec plusieurs maris | Même mécanisme, l’ancre n’est pas genrée dans l’algorithme. Le rang visuel « chef à gauche du groupe, épouses le long du rail » est un habillage de chefferie, pas une loi du graphe |
| Mariage entre cousins (le graphe cesse d’être un arbre) | Une seule carte, placée dans le couloir du premier parent listé. Le second parent est relié par un lien de filiation secondaire dans la gouttière, affiché seulement quand la personne ou l’un des deux foyers est focalisé. On ne promet pas zéro croisement dans ce cas |
| Parent inconnu | Foyer à un seul adulte. La tige part de sa carte, pas d’un ◆ fictif |
| Ordre des épouses | Rang explicite sur le mariage (1, 2, 3), saisi, pas déduit du prénom |

## 3. Trois connecteurs, trois formes

La couleur peut aider. Elle ne porte pas le sens. Trois géométries seulement :

| Relation | Forme | Où elle vit |
| --- | --- | --- |
| Union | Trait horizontal double, avec un losange ◆ au milieu | Sur la bande de la génération, entre les deux cartes. En polygamie, le rail du chef enchaîne plusieurs ◆ |
| Filiation | Trait vertical simple, sans courbe | Du ◆ (ou de la carte s’il n’y a qu’un parent) jusqu’à la barre des enfants |
| Distribution des enfants | Barre horizontale simple, puis un petit trait vertical jusqu’à chaque enfant | Dans l’intervalle du foyer, à mi-chemin de la bande suivante |

Interdits dans cette vue, parce qu’ils recréent la confusion de Family Tree Easy :

- courbe de Bézier d’une personne vers « ses » enfants toutes épouses confondues ;
- trait direct cousin → oncle qui traverse le couloir du père ;
- code « pointillé = conjoint » comme unique distinction, surtout si le conjoint n’est pas sur la bande.

Le survol d’une personne éclaire son foyer, la barre de ses enfants et le rail de ses unions, et baisse le reste. Le survol d’un cousin n’éclaire pas la barre de mon père.

## 4. Navigation quand le lignage s’étire

Sept générations d’une chefferie ne tiennent pas dans un écran si chaque carte reste à taille de lecture. On sépare donc **vue d’ensemble** et **lecture locale**.

### Vue d’ensemble

Tout le lignage ouvert est dans le même SVG, bandes alignées, règle de génération à gauche (G0 … G7). Un mini-plan montre le rectangle visible. Le zoom montre la structure : couloirs, barres, densité. En deçà d’un seuil, le portrait disparaît et le nom devient l’initiale du foyer, pas un texte illisible.

### Lecture locale

Au-dessus du seuil, portrait, nom complet et années restent à une taille d’écran minimale (le texte compense le zoom). Centrer un ancêtre recadre sur son couloir et les bandes utiles, sans recalculer les générations : les cousins restent sur leur ligne.

### Repli

Chaque carte avec une descendance a un état replié :

- repliée : la carte reste, un badge indique le nombre de descendants cachés (`+ 12`) ;
- ouverte : ses foyers et la génération suivante se déploient dans son couloir.

Déplier une branche n’ouvre pas les branches sœurs. Replier un fils du chef referme ses enfants et petits-enfants, et rend la largeur à ses frères. Le fondateur peut rester ouvert sur un seul niveau (ses épouses et ses fils) pendant qu’une seule ligne est déroulée jusqu’à G7.

Proposition de départ, à valider : à l’ouverture d’un lignage de plus de 4 générations, tout est replié au-delà de G2, sauf le couloir de la personne focale, déroulé jusqu’au bout. On voit la forme de la chefferie, et on lit une ligne.

## 5. Ce qu’on ne réutilise pas pour ce placement

- `d3.tree` et `d3.cluster` pour la vue lignage. Ils restent éventuellement pour une vue radiale plus tard, clairement secondaire.
- La couleur de relation calculée depuis le focus comme substitut de structure.
- L’idée qu’un `siblingIds` redondant définit la fratrie. La fratrie se déduit du foyer : mêmes deux parents. Les demi-frères partagent l’ancre, pas la barre.

## 6. Ordre de chantier, quand on décidera de coder

1. **Données.** Un enfant appartient à un mariage. L’ajout d’un enfant choisit le foyer. On cesse d’ajouter toutes les épouses comme parents.
2. **Générations et couloirs.** Fonction pure : personnes + mariages → `{ generation, x, y, foyerId }` sans SVG. Tests sur un fixture de chefferie : 1 fondateur, 3 épouses, 5 à 7 générations, cousins au même `y`, intervalles imbriqués, aucun segment de filiation hors de son couloir.
3. **Dessin.** Remplacer les Bézier de `TreeVisualization` par les trois connecteurs, dans la vue verticale uniquement.
4. **Repli, centrage, seuil de lisibilité** des noms et portraits.
5. **Saisie.** Le formulaire demande « enfant de quel foyer ? » au lieu de « enfant de cette personne, donc de tous ses conjoints ».

Le fixture de l’étape 2 est le juge. Tant qu’il n’est pas stable, on ne touche pas au thème ni à l’export PDF.

## 7. Décisions

1. **Rail adaptatif.** Peu d’épouses : le chef reste au centre du rail. Beaucoup d’épouses : il passe en tête de rail, et les unions se suivent dans l’ordre de rang, pour ne pas l’éloigner de la première.
2. **Le rang est une donnée, pas un ornement.** Chaque union a un rang (1, 2, 3…). Il ordonne le dessin aujourd’hui et pourra porter une lecture du lignage plus tard.
3. **Mariage entre cousins : une seule carte.** Le second lien de filiation passe dans la gouttière. On ne duplique pas la personne.
4. **Plusieurs vues restent.** La vue par bandes devient la vue lignage. Les vues radiale et horizontale restent disponibles : les lecteurs n’ont pas les mêmes habitudes.
