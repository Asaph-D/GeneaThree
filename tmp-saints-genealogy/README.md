# Arbres de saints — travail temporaire

Ce dossier contient des archives directement importables dans GeneaTreePro.

Le sous-dossier `catalogue/` prépare également la future page **Découvrir** avec 91 fiches indexées : 73 saints dans 15 catégories et 18 généalogies bibliques séparées par corpus.

## Méthode

- Parentés structurées : Wikidata (`P22` père, `P25` mère).
- Portraits : uniquement les fichiers Wikimedia Commons attachés par `P18`.
- Profondeur demandée : jusqu’à six générations, limitée par les données structurées disponibles.
- Chaque sous-dossier contient l’archive `.geneatree.json` et un relevé `sources.json`.

## Contenu validé

- Saint Louis IX : 61 personnes, 6 générations, 46 portraits.
- Sainte Élisabeth de Hongrie : 63 personnes, 6 générations, 28 portraits.
- Sainte Marguerite d’Écosse : 18 personnes, 6 générations, 9 portraits.

## Avertissement historique

Les lignées médiévales peuvent être incomplètes ou discutées. Les fichiers distinguent la donnée structurée de la preuve historique et doivent rester révisables. Ils ne remplacent pas des sources primaires.

## Régénération

```powershell
node .\tmp-saints-genealogy\generate-saint-trees.mjs
node .\tmp-saints-genealogy\validate-saint-trees.mjs
```
