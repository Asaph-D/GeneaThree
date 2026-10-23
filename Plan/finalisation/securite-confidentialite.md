# Sécurité, confidentialité et conservation

## Accès aux données

- En production, les données familiales passent uniquement par `/api/trees/{treeId}/family`.
- `OWNER` et `COLLABORATOR` peuvent lire et modifier un arbre ; `READER` peut seulement le lire.
- Les routes historiques globales existent uniquement avec les profils Spring `demo` ou `test`.
- L’API est sans session serveur et les mots de passe sont hachés avec BCrypt.
- Le frontend utilise Supabase Auth pour Google/GitHub lorsque `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont définies.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` est également accepté pour l'intégration Supabase fournie par Vercel ; l'URL doit être copiée dans `VITE_SUPABASE_URL`.
- Les clés `service_role`, secrètes, JWT et les identifiants PostgreSQL ne doivent jamais recevoir un préfixe public ni être intégrés au bundle Vite.
- Les URL de retour locale et Vercel doivent être autorisées dans Supabase et dans les consoles OAuth Google/GitHub.

## Consentement et droits utilisateur

- La création d’un compte exige `privacyConsent: true` et conserve la date du consentement.
- `GET /api/auth/export` produit un export JSON du compte, des rôles et des arbres accessibles.
- `DELETE /api/auth/me` supprime le compte, ses appartenances et les arbres dont il est propriétaire.
- La suppression d’un arbre propriétaire entraîne celle de son snapshot familial.

## Conservation

- Un compte actif et ses arbres sont conservés jusqu’à la demande de suppression du propriétaire.
- Les brouillons locaux restent dans le navigateur et peuvent être supprimés en effaçant les données du site.
- Les journaux applicatifs ne doivent contenir ni corps de requête, ni mot de passe, ni snapshot familial.
- Aucun délai de sauvegarde externalisée n’est revendiqué tant qu’un service de sauvegarde PostgreSQL n’est pas configuré.

## Sauvegarde et restauration

- La sauvegarde applicative d’un arbre est atomique grâce au snapshot versionné.
- Avant exposition publique, activer les sauvegardes PostgreSQL du fournisseur et définir leur rétention dans le contrat d’hébergement.
- Tester périodiquement une restauration dans une base isolée avant de remplacer la base active.
- Une restauration complète doit préserver les comptes, arbres, appartenances et identifiants des personnes.
- L’export JSON utilisateur constitue une copie portable, mais ne remplace pas une sauvegarde de base de données.
