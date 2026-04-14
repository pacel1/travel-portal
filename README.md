# Travel Portal MVP

This repository contains a data-first MVP for a city + month travel portal built with Next.js App Router. The implementation follows `project_context.txt` by keeping the content short, metric-led, and static-friendly.

## What is included

- Landing pages like `rome-in-may`, `krakow-in-december`, and `paris-in-october`
- Precomputed travel scores based on temperature comfort, rainfall, crowd level, and price level
- Generated page cache JSON used directly by the frontend
- Normalized source datasets for cities, climate rows, POIs, and crowd and price signals
- PostgreSQL schema ready for Neon
- No runtime third-party API calls

## Local development

```bash
npm install
npm run etl
npm run dev
```

The ETL step reads generated cache from Neon when `DATABASE_URL` is available and the database is already populated. If Neon is not configured yet, it falls back to the local seed data in `src/data/raw`.

## Neon workflow

1. Create `.env.local` and add your Neon connection string as `DATABASE_URL`.
2. Run:

```bash
npm run db:sync
```

This script:

- applies `database/schema.sql`
- upserts source data into `cities`, `monthly_climate`, and `poi`
- computes and stores `monthly_scores`
- computes and stores `page_cache`

3. Refresh local generated files from Neon:

```bash
npm run etl
```

After that, `npm run build` will use the Neon-backed cache automatically.

If you only need to refresh multilingual city and POI labels in Neon without rerunning the full live import, use:

```bash
npm run db:sync-localized-entities
```

This command only syncs local POI display-name overrides. City localizations are now managed directly in Neon and exported by ETL.

The ETL step also exports `src/data/generated/city-localizations.json`, which is the static build-time source used by routing and page rendering for localized city names and locale-aware slugs.

## Live integrations

To replace local seed rows with real imported source data for the current cities:

```bash
npm run db:import-live
npm run etl
```

The live importer currently uses:

- Open-Meteo archive data for monthly climate aggregates
- OpenStreetMap Overpass for POIs around each city center
- local heuristics for crowd and price signals, which are then written into `monthly_scores`
- optional Wikimedia Commons image import for the POIs already used in page cache cards

For controlled expansion batches from the European city catalog, use:

```powershell
$env:IMPORT_COUNTRIES="DE"
npm run db:import-live-batch
npm run etl
```

Optional batch controls:

- `IMPORT_COUNTRIES`
  Comma-separated country codes from the generated catalog, for example `DE,ES`
- `IMPORT_CITY_IDS`
  Comma-separated city ids/slugs, for example `berlin,hamburg`
- `IMPORT_CITY_LIMIT`
  Maximum number of cities from the selected batch
- `IMPORT_CITY_OFFSET`
  Skip the first `n` matching cities

Important:

- this importer is designed for controlled batches, not full-Europe one-shot runs
- historical weather imports can hit upstream rate limits if the batch is too aggressive
- expand city content in slices, then regenerate AI copy only for the imported cities when needed

For a safer country-by-country workflow with sequential retries, AI copy generation, and a success/failure report, use the runner:

```powershell
$env:IMPORT_COUNTRIES="DE"
$env:OPEN_METEO_DELAY_MS="500"
$env:RUNNER_CITY_DELAY_MS="2000"
$env:OVERPASS_DELAY_MS="700"
npm run db:run-country-import
npm run etl
```

The runner:

- imports one city at a time
- writes localized AI copy for imported pages
- continues through the batch even if an individual city fails
- writes a report to `src/data/generated/country-runner-report.json`

## European city catalog

To expand the city inventory without immediately triggering full climate and POI enrichment for every city, use the catalog workflow:

```bash
npm run data:build-european-cities
npm run db:sync-european-cities
```

This workflow:

- builds a catalog of the top 20 cities by population for each targeted European-market country
- writes the generated catalog to `src/data/raw/european-cities-top20.json`
- writes import metadata and shortfall diagnostics to `src/data/raw/european-cities-top20.meta.json`
- syncs that catalog into the `cities` table in Neon without forcing a full page-generation import for all of them

Important:

- this is a city inventory expansion step, not a full content expansion step
- it is safe for growing the database before climate, POI, and page-cache enrichment are run in controlled batches
- four microstates currently have no usable populated-place rows in the GeoNames dump used for this catalog, so they are tracked as shortfalls instead of being filled with synthetic data

## AI copy generation

If you want more natural page copy while keeping the facts data-first:

```bash
npm run db:generate-ai-copy
npm run etl
```

By default, copy generation now uses a hybrid model policy:

- English source pages use `gpt-5.4-mini`
- translated locales use `gpt-5.4-nano`

You can still force one model for everything, or override source and translation separately:

```bash
OPENAI_COPY_MODEL=gpt-5.4-mini npm run db:generate-ai-copy
OPENAI_COPY_MODEL_SOURCE=gpt-5.4-mini OPENAI_COPY_MODEL_TRANSLATION=gpt-5.4-nano npm run db:generate-ai-copy
```

This step:

- reads factual page payloads from `page_cache`
- compacts the input facts before sending them to the OpenAI Responses API
- for non-English locales, translates the existing English copy structure instead of regenerating all fields from raw facts
- generates natural `summary`, `verdict`, `recommendations`, `tips`, and editorial copy
- writes localized copy into `page_copy`
- uses prompt caching on the Responses API for repeated batch runs
- prints per-batch and per-run telemetry with latency, cached-token share, retries, and estimated cost
- overlays localized copy back into the final generated `page-cache.json` during `npm run etl`

The factual metrics, score, and attraction selection still come from the deterministic ETL pipeline.

Useful controls:

- `COPY_LOCALE`
  Generate one locale, for example `en` or `de`
- `COPY_CITY_IDS`
  Limit generation to selected city ids, for example `berlin,munich`
- `COPY_BATCH_SIZE`
  Number of pages fetched from Neon before each save cycle, default `24`
- `COPY_CONCURRENCY`
  Initial AI request concurrency for the adaptive scheduler
- `COPY_ENABLE_VERDICT_REPAIR`
  Enable the optional second repair call for verdict headings; disabled by default
- `OPENAI_COPY_MODEL`
  Force one model for every locale
- `OPENAI_COPY_MODEL_SOURCE`
  Override the default English source model
- `OPENAI_COPY_MODEL_TRANSLATION`
  Override the default translation model

## Wikimedia Commons POI images

To enrich the attraction cards with static photos and keep runtime free of third-party calls:

```bash
npm run db:import-poi-images
npm run etl
```

This step:

- searches Wikimedia Commons for POIs that already appear in the generated attraction panels
- stores one matched image per POI in `poi_images`
- keeps source, author, and license metadata in Neon
- overlays image data back into the final generated `page-cache.json` during ETL

Useful controls:

- `WIKIMEDIA_CITY_IDS`
  Comma-separated city ids, for example `berlin,munich`
- `WIKIMEDIA_POI_IDS`
  Comma-separated POI ids when you want to repair a few specific attractions
- `WIKIMEDIA_POI_LIMIT`
  Maximum number of POIs to process in one batch
- `WIKIMEDIA_FORCE_REFRESH`
  Re-run POIs that already have a stored image

Important:

- this importer only runs during ETL and does not add runtime API calls
- Commons files must still be shown with attribution and license information
- match quality is heuristic, so it is worth spot-checking headline attractions before a wide rollout

You can target a specific locale during generation:

```powershell
$env:COPY_LOCALE="en"; npm run db:generate-ai-copy
```

You can also target only the cities you just imported:

```powershell
$env:COPY_LOCALE="en"
$env:COPY_CITY_IDS="berlin"
npm run db:generate-ai-copy
```

Or generate rollout copy for an entire tier without publishing it yet:

```powershell
$env:COPY_TIER="tier1"; npm run db:generate-rollout-ai-copy
$env:COPY_TIER="tier2"; npm run db:generate-rollout-ai-copy
```

Supported locale codes are defined in `config/locales.json`.

## Multilanguage architecture

The MVP is intentionally English-only in production, but the codebase is now prepared for multilingual rollout without changing the core data model or page architecture.

Operational rollout notes also live in `docs/multilanguage-rollout.md`.
The SEO-safe release checklist for new languages is documented there as the mandatory pre-deploy and post-deploy gate.

Current decisions:

- `en` is the default and only published locale for MVP
- localized copy is stored separately from factual page payloads
- base facts stay in `page_cache`
- locale-specific copy lives in `page_copy`
- localized entity names belong in dedicated localization tables, not in wide columns like `name_en`, `name_pl`, `name_es`
- each locale gets one canonical city-month slug, while exonym variants are handled as redirect aliases
- static UI strings are routed through dictionary files instead of being hardcoded directly in the page templates
- localized detail-page routes are already supported through `/[locale]/[slug]`
- publication visibility is controlled from Neon via `locale_publication`, not by hardcoding locale rollout in templates

Key files:

- `config/locales.json`
  Source of truth for supported locale availability, labels, and rollout tiers
- `src/data/generated/locale-publication.json`
  Build-time export of Neon-backed locale publication state used for sitemap, `hreflang`, and route exposure
- `src/lib/i18n.ts`
  Shared locale helpers, path builders, canonical helpers, and published locale logic
- `src/i18n/get-dictionary.ts`
  UI dictionary resolver
- `scripts/generate-ai-copy-neon.mjs`
  Generates localized AI copy into `page_copy`
- `scripts/build-page-cache.mjs`
  Builds final generated JSON by combining `page_cache` with localized rows from `page_copy`
- `database/schema.sql`
  Defines `city_localizations` and `poi_localizations` for multilingual entity naming in Neon
- `src/app/[locale]/page.tsx`
  Canonical English page renderer for unprefixed city-month pages and shared template logic
- `src/app/[locale]/[slug]/page.tsx`
  Locale-prefixed detail-page route for published non-default locales
- `src/lib/page-routing.ts`
  Locale-aware canonical slug builder and alias redirect resolver

## Rollout tiers

The rollout plan is stored in `config/locales.json` and should stay aligned with product decisions:

- Tier 0
  `en`
- Tier 1
  `de`, `es`
- Tier 2
  `fr`, `pl`

Rules to preserve:

- English remains the default locale and canonical MVP experience
- do not publish a new locale until UI strings and AI copy are both ready
- factual data must remain locale-agnostic
- AI can localize wording, but it must not invent new travel facts
- runtime requests must never call translation or LLM APIs

## How to publish a new locale

When enabling a new language, follow this order:

1. Confirm the locale exists in `config/locales.json`.
2. Add or review UI dictionary coverage in `src/i18n`.
3. Generate AI copy for that locale.
4. Mark the locale as published in Neon.
5. Rebuild generated cache.
6. Verify static routes, metadata, and sitemap output.

Example for Tier 1 rollout:

```powershell
$env:COPY_LOCALE="de"; npm run db:generate-ai-copy
$env:COPY_LOCALE="es"; npm run db:generate-ai-copy
$env:LOCALE_CODE="de"; $env:LOCALE_PUBLISHED="true"; npm run db:set-locale-publication
$env:LOCALE_CODE="es"; $env:LOCALE_PUBLISHED="true"; npm run db:set-locale-publication
npm run etl
npm run lint
npm run build
```

Example for Tier 2 rollout:

```powershell
$env:COPY_LOCALE="fr"; npm run db:generate-ai-copy
$env:COPY_LOCALE="pl"; npm run db:generate-ai-copy
$env:LOCALE_CODE="fr"; $env:LOCALE_PUBLISHED="true"; npm run db:set-locale-publication
$env:LOCALE_CODE="pl"; $env:LOCALE_PUBLISHED="true"; npm run db:set-locale-publication
npm run etl
npm run lint
npm run build
```

## Multilanguage guardrails

To avoid regressions during future expansion:

- never overwrite factual base payloads with locale-specific copy
- never add per-locale entity columns like `name_en`, `name_de`, `name_pl` directly to core tables
- store localized entity labels in dedicated localization tables keyed by entity id + locale
- treat `city_localizations` in Neon as the source of truth for city names and locale-aware slugs
- never store translated facts separately per locale unless the underlying facts actually differ
- keep `page_cache` deterministic and locale-neutral
- keep `page_copy` focused on human-facing text only
- always verify `copyMeta.locale` after generating a new locale batch
- keep homepage rollout conservative; multilingual scale is currently designed primarily around SEO detail pages
- keep unpublished locales generated if useful, but do not expose them until `locale_publication.published = true`

## Disable local fallback

If you want the project to fail instead of silently using static local data, add this to `.env.local`:

```bash
DISABLE_LOCAL_DATA="true"
```

With that flag enabled:

- `npm run etl` will only accept cache read from Neon
- `npm run db:import-live` will fail if a live provider fails instead of falling back to local POIs
- `npm run db:sync` is blocked, because it exists only for local seed sync

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
  Generated monthly scores and page payload cache used by the app
- `scripts/lib/travel-engine.mjs`
  Shared score and page-cache generation logic
- `scripts/sync-neon.mjs`
  Pushes source and derived data into Neon
- `scripts/build-page-cache.mjs`
  Pulls cache from Neon when available, otherwise falls back to local seed generation
- `database/schema.sql`
  PostgreSQL schema matching the project spec

## Next phase

- Replace local raw seed files with a real ETL import pipeline
- Expand from 3 cities to 50 to 100 cities
- Add cron-driven refreshes for `page_cache`
- Add admin tooling for import jobs and dataset QA
