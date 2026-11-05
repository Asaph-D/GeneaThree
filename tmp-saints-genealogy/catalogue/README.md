# Catalogue éditorial GeneaTreePro

Ce répertoire prépare la future page **Découvrir** sans inventer les données manquantes.

Le catalogue actuel contient **91 fiches** : **73 saints**, répartis dans **15 catégories**, et **18 généalogies bibliques**.

## Organisation

- `catalog.json` : index global prévu pour la recherche et les filtres.
- `saints/<categorie>/<slug>/metadata.json` : identité, description, synonymes et état d’avancement.
- `saints/<categorie>/<slug>/sources.json` : sources historiques et iconographiques à compléter.
- `genealogies-bibliques/recits-et-lignages/<slug>/` : une reconstruction par corpus biblique.

Les généalogies de Matthieu et de Luc restent volontairement séparées. Elles ne doivent pas être fusionnées silencieusement, car leurs structures et leurs objectifs textuels diffèrent.

## États

- `planned` : fiche créée, recherche non terminée.
- `reviewed-seed` : première base structurée disponible, révision éditoriale encore nécessaire.
- `available` : archive GeneaTreePro déjà produite.
- `pending` : travail ou images à produire ultérieurement.

Régénération de la structure :

```powershell
node .\tmp-saints-genealogy\scaffold-catalog.mjs
```
