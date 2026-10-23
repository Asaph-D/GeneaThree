# État actuel du projet

GeneaTree est une application Vite + React, avec une visualisation D3 sur la page démo, un store Zustand, et une API Spring (`api/geneatree`) qui persiste personnes, mariages et événements. Le discours produit (page d’accueil) promet déjà des « relations familiales complexes ». Le moteur de dessin, lui, reste un arbre père-enfant classique.

## Ce qui existe et qui est utile

Le modèle de données n’est pas le blocage principal.

- `Person` porte `parentIds`, `childrenIds` et `spouseIds`. Plusieurs conjoints sont donc déjà possibles.
- `Marriage` est une entité à part : deux conjoints, et une liste `childrenIds`. Côté Java, la table `marriage_children_ids` existe déjà.
- L’ajout d’un conjoint crée bien un enregistrement `Marriage`.
- La vue démo sait zoomer, survoler, colorer par type de relation, et tracer un lien pointillé entre deux conjoints **s’ils sont tous les deux déjà présents comme nœuds**.

Autrement dit : la polygamie est stockable. Elle n’est pas dessinée.

## Ce qui empêche un arbre de chefferie

### 1. Le placement est celui de `d3.tree`

`TreeVisualization` appelle `processFamilyData`, puis `d3.hierarchy` et `d3.tree`. Cet algorithme (Reingold–Tilford) suppose un arbre : un parent, des enfants, une profondeur égale au nombre de pas depuis la personne focale.

Conséquences directes :

- La profondeur D3 n’est pas une génération généalogique. Un cousin atteint par un autre chemin, ou un conjoint rattaché comme « enfant » du foyer, ne tombe pas sur la même bande horizontale que ses pairs.
- Seuls les descendants via `childrenIds` entrent dans la hiérarchie. Un conjoint qui n’est pas lui-même enfant de quelqu’un dans cette descente **n’a pas de coordonnées**. Le lien de mariage pointillé ne se dessine alors pas.
- Les liens sont des courbes de Bézier de parent vers enfant. Il n’y a ni tige de filiation, ni barre de fratrie, ni point d’union. La forme ne dit pas la relation : seule la couleur le tente (`relationshipColors`).

C’est le même défaut que sur [l’éditeur Family Tree Easy](https://familytreeeasy.com/fr/builder) : des personnes peuvent partager un niveau, pendant que les arêtes des fils et celles des cousins se croisent ou se lisent comme la même fratrie.

### 2. L’enfant est rattaché à tous les conjoints du parent

Dans `PersonFormModal`, ajouter un enfant depuis une personne copie **tous** ses `spouseIds` dans `parentIds`. Pour un chef et trois épouses, l’enfant de la première épouse reçoit aussi la deuxième et la troisième comme parents.

Le flux démo (`DemoPage`) est encore plus pauvre : l’enfant n’est relié qu’à la personne cliquée, et `Marriage.childrenIds` n’est jamais rempli. Le mariage existe, mais il ne possède pas sa descendance.

Résultat : soit une fausse fratrie (tous les enfants du chef mélangés), soit une filiation incomplète (l’enfant ne connaît qu’un parent). Les deux cassent la chefferie.

### 3. La « relation » est un libellé vers la personne focale, pas une structure

`processFamilyData` étiquette chaque nœud `parent`, `child`, `cousin`, `uncle_aunt`… par rapport au focus, avec des recherches bornées (grands-parents, oncles, cousins germains). Au-delà, tout devient `other`. Un arbre de 7 générations ne tient pas dans cette taxonomie locale, et la couleur du nœud change selon qui est sélectionné. Le lien de sang, lui, ne devrait pas changer de forme quand on change de focus.

### 4. Deux moteurs de données coexistent

- `src/components/demo/utils.ts` : hiérarchie descendante uniquement, utilisée par la démo.
- `src/components/tree/utils.ts` : tente aussi les parents, mais renvoie un `ExtendedPerson`, que la démo recouvre ensuite avec `d3.hierarchy` sans accessor — les parents ne deviennent pas des nœuds dessinés.
- `TreeVisualisationP.jsx` : ancien prototype, `spouseId` au singulier.
- `familyTreeStore.ts` décrit encore `people` comme un tableau et `birthPlace` comme une chaîne, alors que les types réels sont un objet `Location` et, côté démo, un état React local. Le store n’est pas la source de vérité de l’arbre affiché.

### 5. La collecte familiale suppose un couple unique

`advanced-family.ts` et `QuickFamilyForm` enchaînent « votre père », « votre mère », « votre conjoint ». Les branches sont `paternal | maternal`. Utile pour une saisie nucléaire occidentale, inadapté à un homme et plusieurs foyers, ou à une épouse qui a elle-même des enfants d’une union précédente.

## Écart avec le besoin

| Besoin | État actuel |
| --- | --- |
| Une génération = une bande horizontale | La coordonnée verticale est la profondeur D3 depuis le focus |
| Foyers polygames distincts, enfants rattachés à leurs deux parents | Conjoints multiples stockés, enfants non attribués à un mariage, parfois rattachés à toutes les épouses |
| Filiation, barre de fratrie et union de formes différentes | Bézier unique + pointillé de mariage si les deux nœuds existent |
| Déplier une branche, replier une descendance, centrer un ancêtre | Zoom global seulement. Pas de repli. Pas de fenêtre sur un ancêtre |
| 4, 5, 7 générations lisibles | Espacement fixe (`nodeSize` 200×120), portraits absents du dessin, noms en texte SVG qui rétrécissent avec le zoom |

Le chantier utile n’est donc pas un nouveau thème de couleurs. C’est un placement dont l’unité est le **foyer**, et dont l’ordonnée est la **génération**, calculée avant tout dessin.
