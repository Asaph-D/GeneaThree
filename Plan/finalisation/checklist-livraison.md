# Checklist de livraison

## Fonctionnel

- [ ] Créer un lignage depuis l'atelier.
- [ ] Enregistrer personnes, unions et enfants atomiquement.
- [ ] Recharger le navigateur sans perte ni duplication.
- [ ] Modifier et supprimer une personne avec confirmation.
- [ ] Exporter un arbre lisible.
- [ ] Afficher un état vide, un chargement et une erreur réseau.

## Données et sécurité

- [x] Aucun secret applicatif codé en dur dans la configuration active.
- [ ] Authentification obligatoire pour les arbres privés.
- [ ] Autorisations testées entre deux comptes distincts.
- [ ] Validation serveur de toutes les entrées.
- [ ] Journalisation sans biographie, contact ou dates complètes.
- [ ] Export et suppression de compte documentés.
- [ ] Sauvegarde et restauration testées.

## Qualité

- [x] `npm run build` réussit.
- [x] `npm run lint` réussit sans erreur bloquante.
- [ ] Tests unitaires front réussis.
- [x] Tests backend réussis sans PostgreSQL local.
- [ ] Tests d'intégration du snapshot familial réussis.
- [ ] Parcours E2E principal réussi sur mobile et ordinateur.

## Exploitation

- [ ] Migrations de base versionnées.
- [x] Variables d'environnement documentées.
- [ ] Healthcheck sans fuite d'information.
- [ ] Procédure de déploiement et de retour arrière écrite.
- [ ] Alertes d'erreur applicative configurées.
- [ ] Responsable de validation identifié pour chaque livraison.
