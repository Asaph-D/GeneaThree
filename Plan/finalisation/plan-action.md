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

- [x] Transformer `/atelier` en vitrine publicitaire et partenaires.
- [x] Faire de `/demo` l’éditeur principal synchronisé avec `/assistant`.
- [x] Protéger l’arbre enregistré et persister le brouillon assistant.
- [x] Ajouter « Parenter les enfants de X » lors de l’ajout d’un conjoint.
- [x] Harmoniser la FAQ et la page À propos avec le produit réel.
- [x] Centraliser l'URL de l'API dans la configuration Vite.
- [x] Aligner les requêtes front sur les DTO Spring existants.
- [x] Corriger les erreurs ESLint bloquantes.
- [x] Créer un profil de test backend indépendant de PostgreSQL local.
- [x] Préparer le conteneur et le Blueprint Render.

Critère de sortie : build et lint front verts, test de contexte backend vert sans service externe, parcours local accessible depuis la navigation.

## Phase 1 — Intégrité des données

Durée cible : 1 à 2 semaines.

- [x] Définir un contrat versionné `FamilySnapshot` exposé par OpenAPI.
- [x] Ajouter un endpoint transactionnel de lecture et sauvegarde d'un arbre complet.
- [x] Associer chaque enfant à une union précise plutôt qu'à tous les conjoints.
- [x] Ajouter validations de dates, identifiants, cycles et relations réciproques.
- [x] Retourner les erreurs de validation du snapshot au format RFC 9457.
- [x] Étendre les réponses RFC 9457 aux anciens contrôleurs CRUD.
- [x] Réserver l'initialisation de démonstration au profil `demo`.

Critère de sortie : une sauvegarde est atomique; les fixtures monogame, polygame et recomposée passent les tests d'intégration.

## Phase 2 — Sécurité et confidentialité

Durée cible : 1 à 2 semaines.

- [x] Ajouter authentification et modèle propriétaire/collaborateur/lecteur.
- [x] Protéger toutes les routes de données par arbre.
- [x] Externaliser les secrets et rendre CORS configurable.
- [x] Durcir cookies et journaux avant exposition publique.
- [x] Ajouter consentement, export et suppression des données personnelles.
- [x] Documenter sauvegarde, restauration et durée de conservation.

Critère de sortie : tests d'autorisation négatifs verts et aucune donnée personnelle exposée anonymement.

## Phase 3 — Moteur généalogique

Durée cible : 2 à 4 semaines.

- [x] Écrire le moteur pur de générations, foyers et couloirs décrit dans `../strategie-positionnement.md`.
- [x] Couvrir le moteur par des fixtures jusqu'à sept générations.
- [x] Remplacer progressivement le placement `d3.tree` dans la vue lignage.
- [x] Ajouter repli, centrage et niveaux de détail selon le zoom.
- [x] Conserver les vues alternatives comme modes secondaires.
- [x] Reconstruire les branches ascendantes dans l'assistant lors du chargement depuis `/demo`.
- [x] Déduire le parent commun d'un nouvel oncle ou d'une nouvelle tante lorsqu'il est déjà connu.
- [x] Distinguer l'union parentale des oncles et tantes lorsque les grands-parents ont plusieurs conjoints.
- [x] Tester les parcours cousin avec branche parentale connue et inconnue.
- [x] Documenter visuellement les combinaisons de parenté dans la FAQ.

Critère de sortie : cousins alignés, foyers polygames séparés et aucune filiation principale hors de son couloir.

## Phase 4 — Industrialisation et bêta

Durée cible : 1 à 2 semaines.

- [ ] Ajouter les migrations Flyway.
- [x] Ajouter la CI et le déploiement automatique du backend après push sur `main`.
- [x] Ajouter le conteneur backend et documenter l'environnement Render.
- [x] Découper les pages du bundle initial.
- [x] Transformer `/quick-start` en page d'abonnements.
- [x] Ajouter le tiroir mobile superposé et le menu de profil.
- [x] Intégrer les sessions et fournisseurs OAuth Google/GitHub via Supabase.
- [ ] Charger les fonctions d'export à la demande.
- [ ] Ajouter observabilité, suivi d'erreurs et métriques non personnelles.
- [ ] Exécuter tests d'accessibilité, responsive et compatibilité navigateurs.
- [ ] Organiser une bêta fermée avec scénarios et formulaire de retour.

Critère de sortie : déploiement reproductible, retour arrière documenté et checklist entièrement validée.
