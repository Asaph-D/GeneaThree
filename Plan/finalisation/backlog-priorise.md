# Backlog priorisé

## P0 — Bloquant

| ID | Travail | Dépendance | État |
| --- | --- | --- | --- |
| P0-01 | Exposer l'atelier sur `/atelier` | Aucune | Terminé |
| P0-02 | Configurer `VITE_API_BASE_URL` | Aucune | Terminé |
| P0-03 | Aligner `createPerson` sur `PersonDTO` | P0-02 | Terminé |
| P0-04 | Implémenter la sauvegarde atomique d'un arbre | Contrat snapshot | À faire |
| P0-05 | Isoler les tests backend avec H2 ou Testcontainers | Profil test | Terminé |
| P0-06 | Corriger les 11 erreurs ESLint | Aucune | Terminé |
| P0-07 | Retirer les identifiants PostgreSQL du dépôt | Variables d'environnement | Terminé |
| P0-08 | Désactiver l'initialiseur hors profil `demo` | Profils Spring | Terminé |

## P1 — Nécessaire au MVP

| ID | Travail | Résultat attendu |
| --- | --- | --- |
| P1-01 | Authentification et autorisations par arbre | Données privées |
| P1-02 | Validation métier des relations | Pas de cycle ou lien incohérent |
| P1-03 | Source de vérité front unique | Suppression des stores parallèles |
| P1-04 | Tests du parcours principal | Régression détectée automatiquement |
| P1-05 | Gestion uniforme des erreurs | Messages exploitables |
| P1-06 | Migrations Flyway | Schéma versionné |
| P1-07 | Export et suppression des données | Contrôle utilisateur |

## P2 — Qualité bêta

| ID | Travail | Résultat attendu |
| --- | --- | --- |
| P2-01 | Nouveau placement par foyers | Lecture correcte des lignages complexes |
| P2-02 | Lazy loading PDF et visualisation | Bundle initial réduit |
| P2-03 | Accessibilité clavier et lecteurs d'écran | Parcours inclusif |
| P2-04 | Sauvegarde/restauration automatisée | Résilience opérationnelle |
| P2-05 | Observabilité respectueuse de la vie privée | Diagnostic en production |

## Ordre d'exécution

`P0-01 → P0-02 → P0-03 → P0-05 → P0-06 → P0-07 → P0-08 → P0-04`, puis les P1. Le moteur visuel P2-01 commence seulement lorsque le contrat de foyer est stable.
