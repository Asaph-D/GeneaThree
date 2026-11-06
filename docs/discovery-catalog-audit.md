# Contrôle du catalogue Découvrir — 6 novembre 2026

## Défauts identifiés

- L'ouverture copiait les personnes mais ignorait `tree.view` : le nombre de générations et la personne focale provenaient de la précédente session.
- L'ouverture ne marquait pas explicitement la nouvelle copie comme importée, ce qui pouvait conduire `/demo` à charger un exemple.
- Certaines branches convergentes occupent davantage de niveaux dans le dessin que la profondeur annoncée par l'archive. Le nombre de niveaux nécessaire est maintenant calculé à l'ouverture.
- Les anciens tests de positions ne vérifiaient ni l'identité du sujet, ni son ouverture depuis Découvrir, ni sa présence dans la vue configurée. Leur succès ne validait donc pas le contenu historique du catalogue.

## Identités corrigées

| Fiche | Ancien identifiant | Identifiant corrigé et source |
| --- | --- | --- |
| Mère Teresa | Q41189, Agence juive | [Q30547](https://www.wikidata.org/wiki/Q30547) |
| Jean-Paul II | Q10641, catégorie astronomique | [Q989](https://www.wikidata.org/wiki/Q989) |
| Hildegarde de Bingen | Q7094, biochimie | [Q70991](https://www.wikidata.org/wiki/Q70991) |
| Joséphine Bakhita | Q233690, sommet montagneux | [Q236030](https://www.wikidata.org/wiki/Q236030) |
| Perpétue | Q771956, notice collective Perpétue et Félicité | [Q12871157](https://www.wikidata.org/wiki/Q12871157) |
| Félicité de Carthage | Q257960, Félicité de Rome | [Q11697793](https://www.wikidata.org/wiki/Q11697793) |

Les six notices et leurs parentés disponibles ont été reconstruites à partir des entités corrigées. Le conditionnement du catalogue refuse maintenant une archive dont la personne focale ne correspond pas à la table des sujets dans `scripts/discovery-subjects.json`.

## Vérifications et limites

- 73 fiches testées : ouverture, sauvegarde locale, rechargement, personne focale, réglages et présence de tous les nœuds à l'ouverture. Le stockage IndexedDB est simulé dans ce test ; il ne s'agit pas d'un parcours automatisé dans un navigateur.
- Tests de positions : 78 arbres, 2 808 configurations.
- 39 fiches ne contiennent encore qu'un seul nœud. Elles n'apportent pas de filiation ; cela ne prouve pas qu'aucune filiation historique ne soit connue. La fiche collective Cyrille et Méthode fait partie de ces notices.
- Les autres parentés sont des données structurées importées. Elles ne constituent pas une vérification historique de chaque lien, particulièrement pour les traditions bibliques, hagiographiques et les filiations médiévales discutées.
- Les contrôles techniques ne certifient pas l'exactitude historique intégrale des 73 fiches. La page indique désormais cette limite et distingue les notices sans parenté renseignée.
- Une copie déjà importée n'est pas modifiée par cette correction : il faut rouvrir la fiche depuis Découvrir après déploiement du frontend et du catalogue backend.

## Vérification réelle avec backend et navigateur

Cette seconde vérification complète les tests simulés décrits ci-dessus.

- Backend Spring Boot réellement démarré sur `http://localhost:8086`, avec PostgreSQL 16.15 dans le conteneur isolé `geneatree-visual-audit-postgres`, port local 55432. Les migrations Flyway ont été exécutées.
- 73 arbres enregistrés via les API authentifiées, puis relus via les liens publics : 326 personnes rattachées à ces arbres. Les neuf personnes de démonstration sans arbre, créées au démarrage du profil `demo`, ne sont pas incluses dans ce total.
- Chaque fiche a été recherchée et ouverte dans le navigateur depuis `/atelier`. Pour chacune : capture de la vue initiale de `/demo`, capture après « Recentrer », puis capture de `/shared` après rechargement depuis PostgreSQL. Total : 219 captures principales.
- Les captures des 73 démos et des 73 partages ont été examinées visuellement, en planches et individuellement pour les grands cas. La personne focale est visible dans les 73 ouvertures.
- Huit cas ont aussi été ouverts à 1280 × 720 : Marie, Jean-Paul II, Louis IX, Élisabeth de Hongrie, Marguerite d'Écosse, Thomas d'Aquin, Brigitte de Suède et Katharine Drexel.
- Les grands arbres dépassent parfois la largeur de l'écran au cadrage initial centré sur le sujet. « Recentrer » affiche l'ensemble à une échelle plus petite. Les captures conservent ces deux cadrages.
- Un blocage de capture dans Chromium a nécessité une reprise sous Edge avec un profil isolé. La capture de Boniface, initialement en échec au démarrage du navigateur, a été reprise et examinée. Le relevé final contient 73 captures complètes, sans fiche en échec.

Défauts supplémentaires trouvés pendant ce parcours réel et corrigés :

- L'API refusait des dates partielles ou mal formées dans 50 archives. Les 195 indications concernées sont conservées dans les notes ; elles ne sont plus transmises comme des dates exactes. Les fichiers sources et le catalogue conditionné ont été corrigés.
- Les cercles pouvaient rester vides pendant le chargement des portraits externes. L'initiale reste maintenant présente sous l'image et en cas d'échec du portrait.
- Le catalogue comportait des accents remplacés par `?` dans le texte ajouté. Le texte est corrigé.
- Les statistiques affichaient « 0 ans » et « 0 pays » pour des données absentes. Elles affichent désormais « N/A » ; les pays sous forme d'objet sont également lus correctement.
- Vite tentait de surveiller le profil du navigateur de contrôle et s'arrêtait sur un fichier verrouillé. Le dossier d'artefacts est maintenant exclu de cette surveillance.

Les preuves locales se trouvent dans `GeneaTree/test-artifacts/saints-review/` :

- `index.html` : galerie des 73 fiches, captures et liens de consultation réels ;
- `archives/` : les 73 archives utilisées ;
- `stored-trees.json` et `rendered-results.json` : relevés des enregistrements et ouvertures ;
- `postgresql.dump` : sauvegarde de la base utilisée pour ce contrôle.

Galerie consultable tant que le frontend tourne : `http://localhost:5173/test-artifacts/saints-review/index.html`.

La compilation de production du frontend passe. Le contrôle visuel ne lève pas la limite éditoriale : les 39 notices sans filiation restent sans généalogie renseignée, et les parentés ne sont pas intégralement certifiées historiquement.
