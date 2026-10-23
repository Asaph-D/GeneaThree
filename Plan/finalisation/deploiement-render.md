# Déploiement Spring Boot sur Render

## Architecture

- `geneatree-api` : service Web Docker construit depuis `api/geneatree/Dockerfile`.
- PostgreSQL est externe : Supabase, Render PostgreSQL ou tout service fournissant une connexion JDBC compatible.
- Le port HTTP est fourni par Render dans `PORT` et lu par Spring Boot.
- Les identifiants PostgreSQL sont injectés depuis la base gérée; aucun secret n'est commité.

## Création

1. Pousser le dépôt vers le fournisseur Git connecté à Render.
2. Créer un Blueprint à partir du fichier `render.yaml` à la racine et relier la branche `main`.
3. Renseigner `DB_URL` sous la forme `jdbc:postgresql://HOTE:PORT/geneatree`.
4. Renseigner `CORS_ALLOWED_ORIGIN` avec l'origine exacte du frontend, sans barre finale.
5. Lancer le déploiement et vérifier les journaux de démarrage.

Les fournisseurs fournissent souvent une chaîne `postgresql://...`, alors que Spring attend une URL commençant par `jdbc:postgresql://`. `DB_URL`, `DB_USERNAME` et `DB_PASSWORD` restent donc des secrets Render à renseigner explicitement.

Pour Supabase, utiliser de préférence le pooler en port `6543` et convertir l'URL en `jdbc:postgresql://...`. Après toute exposition accidentelle, régénérer le mot de passe avant de le saisir dans Render.

## Déploiement automatique après push

1. Dans Render, ouvrir le service puis `Settings > Deploy Hook` et copier l'URL secrète.
2. Dans GitHub, ouvrir `Settings > Secrets and variables > Actions`.
3. Créer le secret `RENDER_DEPLOY_HOOK_URL` avec cette URL.
4. Conserver `Auto-Deploy` désactivé dans Render : le Blueprint fixe `autoDeploy: false`.
5. À chaque push sur `main` touchant le backend, GitHub Actions exécute les tests, construit l'image Docker, puis appelle Render seulement si les contrôles réussissent.

Le workflow se trouve dans `.github/workflows/backend-deploy.yml`. Les pull requests exécutent les contrôles sans déployer.

## Variables

| Variable | Exemple local | Production |
| --- | --- | --- |
| `PORT` | `8086` | Fournie par Render |
| `DB_URL` | `jdbc:postgresql://localhost:5432/geneatree` | URL JDBC ou URL `postgres://` Supabase |
| `DB_USERNAME` | `postgres` | Injectée depuis `geneatree-db` |
| `DB_PASSWORD` | vide ou secret local | Injectée depuis `geneatree-db` |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` | URL publique du frontend |

Le backend reconnaît aussi `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL`, `SUPABASE_DB_URL` et `DATABASE_URL`. Sur Render, au moins une de ces variables doit exister ; sinon le démarrage s'arrête avec un message explicite au lieu d'essayer `localhost`.

### Correction de l'erreur `Connection to localhost:5432 refused`

Les variables de l'intégration Supabase installée dans Vercel ne sont pas copiées automatiquement vers Render. Dans le tableau de bord Render du service backend, ajouter au minimum l'une de ces options :

- `DB_URL` avec l'URL PostgreSQL Supabase complète ; ou
- `POSTGRES_URL` avec l'URL du pooler Supabase.

Si l'URL contient déjà `utilisateur:motDePasse@hôte`, `DB_USERNAME` et `DB_PASSWORD` sont extraits automatiquement. Sinon, les renseigner séparément. Régénérer d'abord le mot de passe précédemment exposé.

## Contrôles avant publication

- [x] Image multi-étapes avec JDK de build et JRE d'exécution.
- [x] Processus exécuté par un utilisateur non privilégié.
- [x] Port configurable.
- [x] Secrets absents du Blueprint.
- [x] Endpoint de santé indépendant de la base.
- [x] Tests et construction Docker automatiques avant déploiement.
- [x] Déploiement automatique après push réussi sur `main`.
- [ ] Migration Flyway avant activation de `ddl-auto=validate`.
- [ ] Authentification avant exposition de données réelles.
