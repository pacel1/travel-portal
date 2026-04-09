# Travel Portal MVP

This repository contains a data-first MVP for a city + month travel portal built with Next.js App Router. The implementation follows `project_context.txt` by keeping the content short, metric-led, and static-friendly.

## What is included

- Landing pages like `rome-in-may`, `krakow-in-december`, and `paris-in-october`
- Precomputed travel scores based on temperature comfort, rainfall, crowd level, and price level
- Generated page cache JSON used directly by the frontend
- Normalized source datasets for cities, climate rows, POIs, and crowd and price signals
- PostgreSQL schema ready for a later Neon-backed phase
- No runtime third-party API calls

## Local development

```bash
npm install
npm run etl
npm run dev
```

The ETL step reads the seed data from `src/data/raw` and writes generated artifacts to `src/data/generated`.

## Verification

```bash
npm run lint
npm run build
```

`npm run build` automatically refreshes the generated page cache through the `prebuild` script.

## Project structure

- `src/data/raw`
  Source data for the MVP seed set
- `src/data/generated`
  Generated monthly scores and page payload cache
- `src/lib/catalog.ts`
  Read layer used by the App Router pages
- `scripts/build-page-cache.mjs`
  ETL-style generation step for scoring and cached payload creation
- `database/schema.sql`
  PostgreSQL schema matching the project spec

## Next phase

- Replace local JSON seeds with Neon-backed import and cache persistence
- Expand from 3 cities to 50 to 100 cities
- Add cron-driven ETL updates
- Add affiliate and monetization modules later, not in the MVP
