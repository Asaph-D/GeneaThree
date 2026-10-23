# Déploiement Spring Boot sur Render

## Architecture

- `geneatree-api` : service Web Docker construit depuis `api/geneatree/Dockerfile`.
- `geneatree-db` : PostgreSQL Render.
- Le port HTTP est fourni par Render dans `PORT` et lu par Spring Boot.
- Les identifiants PostgreSQL sont injectés depuis la base gérée; aucun secret n'est commité.

## Création

1. Pousser le dépôt vers le fournisseur Git connecté à Render.
2. Créer un Blueprint à partir du fichier `render.yaml` à la racine.
3. Renseigner `DB_URL` sous la forme `jdbc:postgresql://HOTE:PORT/geneatree`.
4. Renseigner `CORS_ALLOWED_ORIGIN` avec l'origine exacte du frontend, sans barre finale.
5. Lancer le déploiement et vérifier les journaux de démarrage.

Render fournit sa chaîne PostgreSQL privée au format `postgresql://...`, alors que le pilote JDBC attend une URL commençant par `jdbc:postgresql://`. Le Blueprint laisse donc `DB_URL` à saisir explicitement et injecte séparément l'utilisateur et le mot de passe.

## Variables

| Variable | Exemple local | Production |
| --- | --- | --- |
| `PORT` | `8086` | Fournie par Render |
| `DB_URL` | `jdbc:postgresql://localhost:5432/geneatree` | URL JDBC privée Render |
| `DB_USERNAME` | `postgres` | Injectée depuis `geneatree-db` |
| `DB_PASSWORD` | vide ou secret local | Injectée depuis `geneatree-db` |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` | URL publique du frontend |

## Contrôles avant publication

- [x] Image multi-étapes avec JDK de build et JRE d'exécution.
- [x] Processus exécuté par un utilisateur non privilégié.
- [x] Port configurable.
- [x] Secrets absents du Blueprint.
- [ ] Endpoint de santé indépendant de la base.
- [ ] Migration Flyway avant activation de `ddl-auto=validate`.
- [ ] Authentification avant exposition de données réelles.

