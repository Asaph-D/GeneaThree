# Contraintes du dessin familial

Les pages assistant, démonstration et partage utilisent le même moteur
`bandLayout.ts` et le même rendu `drawBandTree.ts`.

Contraintes à conserver lors des évolutions :

- Les enfants d'une fratrie restent regroupés. Une personne d'une autre famille
  ne doit pas être insérée entre eux.
- Un foyer et ses conjoints sans ascendance concurrente forment un intervalle
  indivisible. La seconde épouse d'Innocent ne doit pas être repoussée après
  Antoine et Marceline, parents de Brigitte.
- Un couple reliant deux ascendances reste à leur frontière ; ses membres
  conservent chacun leur famille d'origine lorsque leurs parents sont présents.
- Deux parents connus partagent une jonction parentale vers leur enfant, même
  si aucune union n'a été enregistrée. `parentalHouseholds` produit cette
  représentation sans modifier les personnes ni ajouter de mariage aux données.
- Un enfant dont l'autre parent n'est pas connu conserve sa propre branche,
  indépendamment des unions connues du parent.
- Les raccords sont calculés à partir des coordonnées finales des personnes.
  Les positions ne changent pas lors de l'ouverture du même arbre depuis la
  base ou le partage.
- Le zoom conserve tous les segments et une épaisseur de trait indépendante
  de l'échelle. Les segments structurels ne doivent pas recevoir de dégradés
  qui rendent une partie de la filiation transparente. Les losanges restent.

L'assistant demande le nom de famille en premier, puis le prénom facultatif
avec « Passer ». Le rendu et les exports acceptent un prénom vide. Le formulaire
de personne accepte également les anciennes fiches ne contenant qu'un prénom.

## Reproduction réelle du cas signalé

Créer Asaph, ajouter Paul et Brigitte comme parents, sélectionner Paul et
ajouter Innocent puis Élise. Ajouter ensuite les parents de Brigitte, Antoine
et Marceline, puis Marie comme conjointe d'Innocent. La jonction des parents
de Paul doit être commune et Marie doit rester dans le foyer d'Innocent.

`scripts/check-asaph-family-browser.mjs` rejoue ces actions, passe le nom de
famille, modifie une fiche sans nom de famille, enregistre l'arbre dans le
backend local et le recharge depuis le lien public. Les coordonnées sont
comparées entre les trois pages. Les captures de zoom et de mobile se trouvent
dans `GeneaTree/test-artifacts/asaph-family-boundaries/`.

Contrôle du 12 novembre 2026 : captures examinées, huit personnes dans les
trois vues, 17 segments présents avant et après zoom jusqu'à 3,2, aucun segment
transparent. Le lot de positions couvre 85 arbres et 3 060 configurations,
dont l'inversion de l'ordre des personnes et les jonctions parentales implicites.
