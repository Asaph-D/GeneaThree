# Journal d'exécution

## 2026-10-23 — Lancement

### Diagnostic initial

- Build front réussi.
- Lint front en échec : 11 erreurs et 7 avertissements.
- Test backend en échec car il exige PostgreSQL sur `localhost:5432`.
- Atelier présent dans le code mais absent du routage.
- URL API dupliquée et codée en dur.
- Contrat de création d'une personne divergent entre le front et Spring.

### Sprint 0 engagé

- [x] Créer le dossier de pilotage de finalisation.
- [x] Définir phases, backlog et checklist de livraison.
- [x] Transformer `/atelier` en vitrine publicitaire et partenaires.
- [x] Ajouter l’accès assistant depuis `/demo` et conserver séparément arbre validé et brouillon.
- [x] Ajouter l’action explicite « Parenter les enfants de X ».
- [x] Refaire FAQ et À propos dans le langage visuel du site.
- [x] Valider dates, identifiants, réciprocité et cycles avant toute sauvegarde atomique.
- [x] Retourner des erreurs RFC 9457 cohérentes sur les ressources CRUD absentes.
- [x] Centraliser l'URL API.
- [x] Aligner le corps de `createPerson` sur `PersonDTO`.
- [x] Relancer build et lint.

### Validation du lot

- `npm run build` : réussi.
- `npm run lint` : toujours en échec avec les 11 erreurs et 7 avertissements déjà recensés; aucune nouvelle erreur liée au lot.
- Avertissement à traiter : bundle principal supérieur à 500 kB, aggravé tant que les pages lourdes ne sont pas chargées à la demande.

### Prochaine action

P0-04 : concevoir et tester la sauvegarde atomique du snapshot familial.

## 2026-10-23 — Phase 0, deuxième lot

- [x] Ajouter H2 et le profil `test`.
- [x] Exécuter le test Spring sans PostgreSQL local : 1 test, 0 échec.
- [x] Externaliser port, base, CORS et niveaux de logs.
- [x] Limiter `DBInitializer` au profil `demo`.
- [x] Corriger les 11 erreurs ESLint : 0 erreur restante, 6 avertissements.
- [x] Charger les pages React à la demande.
- [x] Réduire le chunk initial de 1 011 kB à 182 kB environ.
- [x] Ajouter un Dockerfile Spring Boot multi-étapes.
- [x] Ajouter le Blueprint Render et sa documentation.

## 2026-10-23 — Phase 1, snapshot atomique

- [x] Ajouter le contrat versionné `FamilySnapshotDTO`.
- [x] Ajouter `GET`, `PUT` et `DELETE /api/family`.
- [x] Valider les identifiants dupliqués et les références inconnues avant écriture.
- [x] Remplacer le lignage dans une transaction unique.
- [x] Raccorder `familyGateway` au nouvel endpoint.
- [x] Retourner les erreurs de snapshot au format `application/problem+json`.
- [x] Conserver les identifiants UUID fournis par le frontend.
- [x] Tester la sauvegarde/relecture et la conservation des données après rejet : 2 tests, 0 échec.
- [x] Exécuter la suite backend complète : 3 tests, 0 échec.
- [x] Vérifier le modal `/demo` : choix obligatoire de l'union, parents et `Marriage.childrenIds` correctement mis à jour.

### Décisions

- `/quick-start` reste la page Horizons afin de ne pas casser les liens existants.
- `/atelier` devient une vitrine partenaires ; la création se concentre sur `/assistant` et `/demo`.
- Le mode local reste le défaut documenté tant que la sauvegarde backend n'est pas atomique.
