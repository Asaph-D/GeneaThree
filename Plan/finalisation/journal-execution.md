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
- [x] Exposer l'atelier sur `/atelier`.
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

### Décisions

- `/quick-start` reste la page Horizons afin de ne pas casser les liens existants.
- L'atelier reçoit la route explicite `/atelier`.
- Le mode local reste le défaut documenté tant que la sauvegarde backend n'est pas atomique.
