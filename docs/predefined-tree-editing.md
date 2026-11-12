# Arbres prédéfinis et assistant — 12 novembre 2026

Les fiches Découvrir proviennent d'un catalogue livré avec le backend ; elles
n'étaient pas des arbres appartenant au compte supposé par l'interface.

L'édition publiée est maintenant réservée à la session Supabase authentifiée de
`kouokamasaph142@gmail.com`. `PUT /api/discovery/trees/{id}` refuse les visiteurs,
les autres comptes et l'authentification Basic. Un simple enregistrement local
avec cette adresse ne permet donc pas de prendre ces droits. La lecture reste
publique. Les changements autorisés sont enregistrés dans PostgreSQL par la
migration Flyway V4, puis rechargés au démarrage, en priorité sur le catalogue
livré avec l'application. Le sujet de la fiche ne peut pas être remplacé et les
filiations sont validées avant publication.

Le frontend conserve la provenance du catalogue dans son registre et dans les
archives téléchargées. Les anciennes copies importées portant le titre d'une
fiche du catalogue sont également reconnues. Les outils d'ajout, de modification,
de suppression, de changement de photo et de réinitialisation sont désactivés
pour les lecteurs. L'ouverture, le parcours et les exports restent disponibles.
Une copie externe dont la provenance a été retirée n'acquiert aucun droit de
publication sur le catalogue du serveur.

Un refus du serveur n'est jamais transformé en sauvegarde locale autorisée.
Les droits sont recalculés après connexion ou déconnexion. La création d'un
nouvel arbre reste permise et crée un enregistrement personnel distinct.

L'assistant ne conservait pas sa question suivante à cause d'un appel à
`setHelpOpen`, fonction supprimée auparavant. Après les renseignements initiaux,
la construction se fait maintenant par sélection d'une personne, puis ajout
d'un parent, d'un enfant ou d'un conjoint. Les questions sur l'autre parent
restent explicites lorsqu'une union doit être choisie. La sélection est aussi
disponible par liste sur mobile. L'URL `new=1` est consommée une fois pour qu'un
rechargement ne supprime pas les réponses du brouillon.

Le contrôle réel a aussi révélé deux défauts corrigés : la disparition des
enfants à parent inconnu quand ce parent avait une union, et la suppression
d'une union lorsqu'un conjoint déjà présent était sélectionné comme parent
d'un nouvel enfant.

## Vérifications

- Navigateur Edge avec backend et PostgreSQL réels : commandes désactivées,
  profils, export JSON téléchargé, nouveau brouillon, question suivante,
  rechargement, sélection des nœuds, deux unions conservées, filiations précises,
  enfants à parent inconnu pour les deux membres du couple, affichage mobile,
  nouvel arbre personnel et reprise depuis `/demo`.
- Captures examinées dans
  `GeneaTree/test-artifacts/assistant-permissions/` et bilan `browser-results.json`.
- Tests de droits du backend : accès public, compte tiers refusé, usurpation
  par compte Basic refusée, propriétaire Supabase autorisé, parent absent et
  remplacement du sujet refusés.
- La clé publique de test n'est plus une valeur de secours en production.
  Pour les jetons Supabase HS256, configurer le vrai `SUPABASE_JWT_SECRET` ; sans
  secret, ce mode est refusé. Les signatures asymétriques utilisent les JWKS.
- Positions : 82 familles, 2 952 configurations, dont les cas à parent inconnu
  avec une et deux unions pour les deux membres du couple.
- Compilation de production réussie et lint sans erreur, avec les sept
  avertissements existants. Le contrôle TypeScript strict reste en échec :
  comparaison avec `HEAD`, 96 erreurs avant et 94 après, aucune nouvelle erreur.
  Les deux erreurs supprimées étaient les appels à `setHelpOpen`. Les autres
  erreurs héritées du projet ne sont pas corrigées dans ce lot.

Déployer le frontend et le backend ensemble. Les changements du catalogue
publiés par son propriétaire doivent être inclus dans les sauvegardes de la
base, car ils ne réécrivent pas le JSON du dépôt.
