# Lëtzebuergesch

Appli web personnelle pour apprendre ~100 phrases de base en luxembourgeois (bureau et vie de tous les jours), 10 à 15 minutes par jour. Cartes mémoire avec répétition espacée (Leitner, 5 boîtes), phrase du jour, suivi de progression. Fonctionne hors ligne et s'installe sur l'écran d'accueil (PWA). Aucune donnée ne quitte l'appareil.

> ⚠️ **Contenu à vérifier.** Tout le luxembourgeois (phrases, phonétique, notes) a été rédigé par une IA et peut contenir des erreurs. Chaque carte porte `verified: false` et un badge « à vérifier ». Utilise l'écran **Réglages → Relecture** pour exporter un CSV à faire relire par un collègue, ou compare avec [lod.lu](https://lod.lu).

## Lancer en local

Prérequis : [Node.js](https://nodejs.org) 20 ou plus récent.

```bash
npm install
```

```bash
npm run dev
```

Ouvre l'adresse affichée (http://localhost:5173). Pour tester sur ton téléphone depuis le même Wi-Fi : `npm run dev -- --host`, puis ouvre l'adresse « Network ».

## Tests

```bash
npm test
```

Vitest couvre la logique métier : transitions de boîte, échéances, tri de la file du jour, limite de nouvelles cartes, passage de minuit et fuseau horaire (les tests tournent en `Europe/Luxembourg`), série, migrations, import invalide, validation du contenu, export CSV, et l'écran de révision.

`npm run test:watch` relance les tests à chaque modification.

## Structure

```
src/
  domain/        Types, dates locales, algorithme Leitner, file du jour, statistiques,
                 phrase du jour, export CSV, type Scenario (V2). Fonctions pures, date injectée.
  achievements/  Règles de badges (V2, non affichées) : état → badges débloqués.
  storage/       Interface Storage + implémentation localStorage, état versionné, migrations.
  content/       Un fichier JSON par module + validation de schéma.
  ui/            Écrans, composants, registre des types de cartes (cardRenderers).
```

## Ajouter une carte

Dans le fichier JSON du module (`src/content/<module>.json`), ajoute un objet à `cards` :

```json
{
  "id": "office-019",
  "moduleId": "office",
  "type": "phrase",
  "fr": "Bonne fin de journée !",
  "lb": "…",
  "phonetic": "…",
  "note": "facultatif",
  "lodQuery": "mot à chercher sur lod.lu (facultatif)",
  "verified": false
}
```

- `id` doit être unique et **ne plus jamais changer** (la progression y est rattachée). Format : `<module>-NNN`.
- `phonetic` : prononciation écrite « à la française ».
- `lodQuery` : le terme recherché par le lien « Écouter sur lod.lu » (sinon la phrase entière).
- Passe `verified` à `true` une fois la carte relue par un locuteur natif.

`npm test` vérifie le contenu (champs requis, ids uniques, cohérence `moduleId`).

## Ajouter un module

1. Crée `src/content/mon-module.json` avec `id`, `title`, `description` et `cards`.
2. Importe-le dans `src/content/index.ts` et ajoute-le à `RAW_MODULES` (l'ordre du tableau est l'ordre de présentation des nouvelles cartes).

## Données et sauvegarde

La progression est stockée dans le `localStorage` du navigateur (clé `letzebuergesch:state`). Elle est propre à chaque appareil et navigateur : **exporte-la régulièrement** (Réglages → Exporter) et importe le fichier sur un autre appareil pour la transférer.

L'état contient un `schemaVersion`. Pour ajouter un champ en V2 : incrémenter `CURRENT_SCHEMA_VERSION` (`src/domain/types.ts`) et ajouter une migration dans `src/storage/migrations.ts`. Les anciennes sauvegardes restent importables.

## Déployer

```bash
npm run build
```

Le dossier `dist/` est un site statique (chemins relatifs, routage par `#`), déployable n'importe où.

**GitHub Pages (déploiement actuel)** : l'appli est publiée sur https://lokmanme.github.io/letzebuergesch/. Le workflow `.github/workflows/deploy.yml` lance les tests, construit et publie à chaque `git push` sur `main` : pour mettre à jour, il suffit de pousser. Sur un compte gratuit, le dépôt et le site sont publics (ta progression, elle, reste dans ton navigateur).

**Netlify** : glisse-dépose le dossier `dist/` sur [app.netlify.com/drop](https://app.netlify.com/drop) ; URL aléatoire en `*.netlify.app`.

**Vercel** : `npx vercel` à la racine du projet (framework détecté : Vite, dossier de sortie `dist`).

Une fois en ligne, ouvre l'URL sur ton téléphone puis « Ajouter à l'écran d'accueil » (Safari : bouton Partager ; Chrome : menu ⋮). L'appli fonctionne ensuite hors ligne.

## Préparé pour la V2

- **Nouveaux types de cartes** (`mcq`, `reorder`, `typed-answer`) : ajouter le type dans `Card["type"]`, un composant dans `src/ui/cards/` et une entrée dans `cardRenderers` (`src/ui/cards/registry.ts`). L'écran de révision n'a pas à changer.
- **Cartes personnelles** : `state.customCards` (vide en V1) est déjà fusionné avec le contenu officiel.
- **Scénarios** : type `Scenario` dans `src/domain/scenario.ts`.
- **Badges** : règles dans `src/achievements/rules.ts`.
- **Nouvelles routes** (`/quiz`, `/scenarios`, `/cartes-perso`, `/badges`) : à déclarer dans `src/ui/App.tsx`.
