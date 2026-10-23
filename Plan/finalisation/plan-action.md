# Plan d'action de finalisation

## Objectif produit

Permettre à une famille de créer, enregistrer, relire et modifier un lignage complexe sans perte de données, avec des foyers distincts, une confidentialité explicite et un déploiement reproductible.

## Indicateurs de sortie MVP

- Le parcours création → enregistrement → visualisation → modification fonctionne sans intervention technique.
- Les personnes, unions et enfants restent cohérents après rechargement.
- Le build, le lint et les tests automatisés passent en CI.
- Aucun secret ni URL d'environnement n'est codé en dur.
- Un utilisateur ne peut lire ou modifier que les arbres auxquels il a accès.
- Les erreurs réseau et métier ne laissent pas de sauvegarde partielle.

## Phase 0 — Stabilisation immédiate

Durée cible : 2 à 4 jours.

- [x] Exposer l'atelier sur une route dédiée et visible.
- [x] Centraliser l'URL de l'API dans la configuration Vite.
- [x] Aligner les requêtes front sur les DTO Spring existants.
- [x] Corriger les erreurs ESLint bloquantes.
- [x] Créer un profil de test backend indépendant de PostgreSQL local.
- [x] Préparer le conteneur et le Blueprint Render.

Critère de sortie : build et lint front verts, test de contexte backend vert sans service externe, parcours local accessible depuis la navigation.

## Phase 1 — Intégrité des données

Durée cible : 1 à 2 semaines.

- [ ] Définir un contrat versionné `FamilySnapshot` partagé par OpenAPI.
- [ ] Ajouter un endpoint transactionnel de lecture et sauvegarde d'un arbre complet.
- [ ] Associer chaque enfant à un foyer précis plutôt qu'à tous les conjoints.
- [ ] Ajouter validations de dates, identifiants, cycles et relations réciproques.
- [ ] Remplacer les erreurs génériques par des réponses RFC 9457.
- [x] Réserver l'initialisation de démonstration au profil `demo`.

Critère de sortie : une sauvegarde est atomique; les fixtures monogame, polygame et recomposée passent les tests d'intégration.

## Phase 2 — Sécurité et confidentialité

Durée cible : 1 à 2 semaines.

- [ ] Ajouter authentification et modèle propriétaire/collaborateur/lecteur.
- [ ] Protéger toutes les routes de données par arbre.
- [x] Externaliser les secrets et rendre CORS configurable.
- [ ] Durcir cookies et journaux avant exposition publique.
- [ ] Ajouter consentement, export et suppression des données personnelles.
- [ ] Documenter sauvegarde, restauration et durée de conservation.

Critère de sortie : tests d'autorisation négatifs verts et aucune donnée personnelle exposée anonymement.

## Phase 3 — Moteur généalogique

Durée cible : 2 à 4 semaines.

- [ ] Écrire le moteur pur de générations, foyers et couloirs décrit dans `../strategie-positionnement.md`.
- [ ] Couvrir le moteur par des fixtures jusqu'à sept générations.
- [ ] Remplacer progressivement le placement `d3.tree` dans la vue lignage.
- [ ] Ajouter repli, centrage et niveaux de détail selon le zoom.
- [ ] Conserver les vues alternatives comme modes secondaires.

Critère de sortie : cousins alignés, foyers polygames séparés et aucune filiation principale hors de son couloir.

## Phase 4 — Industrialisation et bêta

Durée cible : 1 à 2 semaines.

- [ ] Ajouter CI et migrations Flyway.
- [x] Ajouter le conteneur backend et documenter l'environnement Render.
- [x] Découper les pages du bundle initial.
- [ ] Charger les fonctions d'export à la demande.
- [ ] Ajouter observabilité, suivi d'erreurs et métriques non personnelles.
- [ ] Exécuter tests d'accessibilité, responsive et compatibilité navigateurs.
- [ ] Organiser une bêta fermée avec scénarios et formulaire de retour.

Critère de sortie : déploiement reproductible, retour arrière documenté et checklist entièrement validée.
