# Mon Bar 🍸

Application personnelle (PWA) pour gérer son bar et savoir quels cocktails on peut préparer.

- **Mon bar** : bouteilles rangées sur des étagères, garde-manger (frais & épicerie), suggestions d'achat.
  Les bouteilles absentes de la liste (sirops, liqueurs…) s'ajoutent comme nouveaux ingrédients.
- **Cocktails** : 137 recettes en français (dont 21 sans alcool), filtres *faisables / presque / autres*, recherche,
  filtre par ingrédients (ou par famille : « tous les rhums »…), filtre « sans alcool », tri par degré, fiches détaillées.
- **Degré d'alcool** : estimé à partir du degré de chaque ingrédient et de la dilution par la glace selon la méthode
  (formules de Dave Arnold pour le shaker et le verre à mélange) ; il peut être saisi à la main dans l'éditeur.
- **Recettes** : création, variantes, modification et suppression de toutes les recettes. Une classique modifiée
  peut revenir à l'original, une classique supprimée se restaure depuis les réglages.
- Données stockées **uniquement sur l'appareil** (IndexedDB), avec export/import JSON dans les réglages.

## Commandes

```bash
npm install        # une fois
npm run dev        # serveur de développement → http://localhost:5173
npm test           # tests (données des recettes + logique de calcul)
npm run build      # version de production dans dist/
npm run preview    # sert la version de production → http://localhost:4173
```

### Tester sur le téléphone (même Wi-Fi)

```bash
npm run dev -- --host
```

Puis ouvrir sur le téléphone l'adresse « Network » affichée (ex. `http://192.168.1.20:5173`).
L'app fonctionne, mais l'**installation sur l'écran d'accueil** et le mode hors-ligne exigent du HTTPS :
il faudra l'héberger (GitHub Pages, Netlify…).

## Déploiement (GitHub Pages)

Chaque push sur `main` lance `.github/workflows/deploy.yml` : tests, build, puis publication sur
`https://<compte>.github.io/<dépôt>/`. Le chemin du sous-dossier est passé au build via `BASE_PATH`.
Prérequis (une fois) : dans le dépôt, *Settings → Pages → Source : GitHub Actions*.

## Organisation du code

| Dossier | Contenu |
|---|---|
| `src/data/` | Types, ingrédients (rayons, familles, substituts, degrés), recettes, unités et verres |
| `src/lib/` | Base locale (Dexie), calcul faisable/presque, degré d'alcool, actions, sauvegarde, formatage |
| `src/state/` | Contexte React qui combine le bar et les recettes |
| `src/components/` | Composants partagés : icônes SVG (verres, bouteilles), panneau, sélecteur d'ingrédients… |
| `src/pages/` | Écrans : bar, liste des cocktails, fiche, éditeur, réglages |

### Ajouter une recette ou un ingrédient de base

Éditer `src/data/cocktails.ts` ou `src/data/ingredients.ts`, puis lancer `npm test` : les tests vérifient
que chaque recette référence des ingrédients existants et que chaque ingrédient est utilisé.

Les icônes PWA sont générées depuis `public/logo.svg` avec `npm run icons`.
