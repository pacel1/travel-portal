# Multilanguage Rollout Guide

This document is the operational source of truth for multilingual rollout in Travel Portal.

For product context, also see:

- `project_context.txt`
- `README.md`
- `config/locales.json`

## Current state

The project is production-ready for an English-only MVP, with multilingual architecture already prepared.

Current status:

- default locale: `en`
- published locales: `en`
- Tier 1 rollout targets: `de`, `es`
- Tier 2 rollout targets: `fr`, `pl`

The current release strategy is conservative:

- English remains the canonical MVP experience
- multilingual scale is designed primarily around SEO detail pages
- locale-prefixed detail routes are supported through `/[locale]/[slug]`
- factual travel data remains locale-neutral
- localized copy is generated offline and stored separately
- locale publication is controlled in Neon via `locale_publication`

## Architecture rules

These rules should not be broken without an explicit architectural decision.

1. `page_cache` is the factual base layer.
2. `page_copy` is the localized human-facing copy layer.
3. ETL combines `page_cache` with `page_copy` to build final generated JSON.
4. LLMs may improve wording, but they must not invent facts.
5. Runtime requests must never call AI or translation APIs.
6. A locale is not publishable until both UI strings and AI copy are ready.
7. New locale rollout should be done per batch, never ad hoc page by page.
8. Localized city and POI names must live in localization tables keyed by entity id + locale, not as `name_en`, `name_de`, `name_pl` columns on the base tables.

## Localized slug policy

This project uses one canonical detail-page slug per locale and redirects all known name variants to that canonical URL.

Examples:

- `en`: `/munich-in-may`
- `de`: `/de/muenchen-im-mai`
- `pl`: `/pl/monachium-w-maju`

Rules:

1. One city-month page may have many accepted aliases, but only one indexable slug per locale.
2. Canonical URLs must be generated from locale-aware slug helpers, never hand-built in templates.
3. Alias slugs must resolve with a permanent redirect to the locale canonical URL.
4. Sitemap entries and `hreflang` alternates must contain canonical URLs only.
5. City exonyms such as `Munich`, `Muenchen`, and `Monachium` must be modeled as aliases, not as separate pages.
6. `city_localizations` in Neon is the source of truth for localized city names, canonical slugs, and aliases.
7. ETL exports that data to `src/data/generated/city-localizations.json` for static build-time routing.
8. Shared routing logic for canonical slugs and alias resolution lives in `src/lib/page-routing.ts`.

## Key files

- `config/locales.json`
  Defines supported locales, bootstrap defaults, labels, and rollout tiers.
- `src/data/generated/locale-publication.json`
  Build-time export of Neon-backed publication state used by routing, sitemap, and `hreflang`.
- `src/lib/i18n.ts`
  Shared locale helpers, localized path builders, canonical helpers, and published locale checks.
- `src/i18n/get-dictionary.ts`
  Resolves the UI dictionary used by pages.
- `database/schema.sql`
  Defines `page_cache`, `page_copy`, `city_localizations`, and `poi_localizations`.
- `src/data/generated/city-localizations.json`
  Build-time export of Neon-backed city localization data for static routing.
- `scripts/generate-ai-copy-neon.mjs`
  Generates locale-specific AI copy into `page_copy`. Non-English locales use the English copy as the source text plus factual guardrails, so the result should read like natural transcreation rather than literal translation.
- `scripts/build-page-cache.mjs`
  Reads Neon and overlays localized copy into generated payloads.
- `src/app/[locale]/page.tsx`
  Canonical English detail page for unprefixed routes and shared rendering logic.
- `src/app/[locale]/[slug]/page.tsx`
  Locale-prefixed detail page route for published non-default locales.
- `src/app/sitemap.ts`
  Emits sitemap entries and locale alternates.

## Locale model

Tier plan:

- Tier 0: `en`
- Tier 1: `de`, `es`
- Tier 2: `fr`, `pl`

Publishing logic:

- `defaultLocale` controls the canonical root experience
- `locale_publication.published` controls which locales are actually exposed
- locale tiers are planning metadata and should stay aligned with product rollout

Supported but unpublished locales may exist in config before they are publicly enabled.

## Data flow

1. Import source data into Neon.
2. Build deterministic factual payloads into `page_cache`.
3. Generate localized AI copy into `page_copy` using `COPY_LOCALE`.
4. Read locale publication state from Neon and export it for the frontend.
5. Run ETL to build final generated JSON for the frontend.
6. Build and verify static output.

The important separation is:

- facts come from deterministic ETL
- wording comes from AI copy generation
- localized city labels and slug aliases come from `city_localizations` in Neon
- localized POI labels come from `poi_localizations` in Neon

## Publish checklist

Use this checklist every time a new locale is being published.

1. Confirm the locale is listed in `config/locales.json`.
2. Confirm the locale has product approval for rollout.
3. Review UI dictionary coverage in `src/i18n`.
4. Generate AI copy for the locale.
5. Mark the locale as published in `locale_publication`.
6. Run ETL.
7. Run lint.
8. Run build.
9. Verify detail-page routes and metadata.
10. Verify sitemap output includes the locale where expected.

## Commands

## Quick cheat sheet

### Publish one locale

```powershell
$env:LOCALE_CODE="de"
$env:LOCALE_PUBLISHED="true"
npm run db:set-locale-publication
npm run etl
npm run build
```

### Unpublish one locale

```powershell
$env:LOCALE_CODE="de"
$env:LOCALE_PUBLISHED="false"
npm run db:set-locale-publication
npm run etl
npm run build
```

### Publish Tier 1

```powershell
$env:LOCALE_CODE="de"; $env:LOCALE_PUBLISHED="true"; npm run db:set-locale-publication
$env:LOCALE_CODE="es"; $env:LOCALE_PUBLISHED="true"; npm run db:set-locale-publication
npm run etl
npm run build
```

### Roll back Tier 1

```powershell
$env:LOCALE_CODE="de"; $env:LOCALE_PUBLISHED="false"; npm run db:set-locale-publication
$env:LOCALE_CODE="es"; $env:LOCALE_PUBLISHED="false"; npm run db:set-locale-publication
npm run etl
npm run build
```

### Publish Tier 2

```powershell
$env:LOCALE_CODE="fr"; $env:LOCALE_PUBLISHED="true"; npm run db:set-locale-publication
$env:LOCALE_CODE="pl"; $env:LOCALE_PUBLISHED="true"; npm run db:set-locale-publication
npm run etl
npm run build
```

### Roll back Tier 2

```powershell
$env:LOCALE_CODE="fr"; $env:LOCALE_PUBLISHED="false"; npm run db:set-locale-publication
$env:LOCALE_CODE="pl"; $env:LOCALE_PUBLISHED="false"; npm run db:set-locale-publication
npm run etl
npm run build
```

### Generate copy without publishing

```powershell
$env:COPY_TIER="tier1"; npm run db:generate-rollout-ai-copy
$env:COPY_TIER="tier2"; npm run db:generate-rollout-ai-copy
npm run etl
```

Default model for large locale batches:

```powershell
$env:OPENAI_COPY_MODEL="gpt-5.4-nano"
```

Use a stronger model only for a small QA sample or a final polish pass:

```powershell
$env:OPENAI_COPY_MODEL="gpt-5.4-mini"
$env:COPY_CITY_IDS="berlin,paris,krakow"
$env:COPY_LOCALE="pl"
npm run db:generate-ai-copy
```

### Generate English copy

```powershell
$env:COPY_LOCALE="en"
npm run db:generate-ai-copy
npm run etl
```

### Tier 1 rollout

```powershell
$env:COPY_TIER="tier1"
npm run db:generate-rollout-ai-copy

$env:LOCALE_CODE="de"
$env:LOCALE_PUBLISHED="true"
npm run db:set-locale-publication

$env:LOCALE_CODE="es"
$env:LOCALE_PUBLISHED="true"
npm run db:set-locale-publication

npm run etl
npm run lint
npm run build
```

### Tier 2 rollout

```powershell
$env:COPY_TIER="tier2"
npm run db:generate-rollout-ai-copy

$env:LOCALE_CODE="fr"
$env:LOCALE_PUBLISHED="true"
npm run db:set-locale-publication

$env:LOCALE_CODE="pl"
$env:LOCALE_PUBLISHED="true"
npm run db:set-locale-publication

npm run etl
npm run lint
npm run build
```

## Verification checklist

After generating a locale batch, verify:

- `page_copy` has rows for the locale
- `copyMeta.locale` is correct in generated payloads
- English routes still resolve without prefixes
- newly published locale routes resolve with `/[locale]/[slug]`
- unpublished locales stay generated but hidden from route exposure, sitemap, and `hreflang`
- metadata canonical and language alternates are correct
- sitemap output reflects the currently published locale set

## SEO safety test plan

This section is the mandatory release gate before publishing any new locale.

Do not publish a locale if any of the checks below fail.

### Local pre-deploy tests

Run the full generation flow first:

```powershell
$env:COPY_LOCALE="de"
npm run db:generate-ai-copy

$env:COPY_LOCALE="es"
npm run db:generate-ai-copy

npm run etl
npm run lint
npm run build
```

Then run these checks locally against a production-like server:

1. Start the app locally with `npm run start`.
2. Open one English page and one page for each new locale candidate.
3. Confirm the English canonical URL stays unprefixed, for example:
   - `/krakow-in-january`
4. Confirm the new locale pages resolve only under prefixed routes, for example:
   - `/de/krakow-in-january`
   - `/es/krakow-in-january`
5. Confirm unpublished locales still do not resolve:
   - `/fr/krakow-in-january`
   - `/pl/krakow-in-january`
6. Confirm `/en/krakow-in-january` does not become a published duplicate route.
7. Inspect rendered HTML and verify:
   - exactly one canonical URL is present
   - canonical points to the correct locale URL for the page being tested
   - `hreflang` alternates exist only for published locales
   - no unpublished locale appears in alternates
8. Confirm the English page still links internally to English detail pages without locale prefixes.
9. Confirm the newly published locale pages internally link to locale-prefixed detail pages.
10. Confirm page title and description are present for each tested locale.
11. Confirm the page content is actually localized and not falling back to the wrong locale unexpectedly.
12. Confirm generated payloads include the expected locale metadata.

Recommended local spot checks:

- homepage `/`
- 2 strong pages, for example `/rome-in-may` and `/paris-in-september`
- 2 weaker pages, for example winter or rain-heavy months
- 1 route for each new locale

### Local command-line checks

Use these kinds of checks before deploy:

```powershell
Invoke-WebRequest http://localhost:3000/sitemap.xml
Invoke-WebRequest http://localhost:3000/robots.txt
Invoke-WebRequest http://localhost:3000/krakow-in-january
Invoke-WebRequest http://localhost:3000/de/krakow-in-january
Invoke-WebRequest http://localhost:3000/es/krakow-in-january
```

Things to verify in responses:

- HTTP 200 for expected routes
- HTTP 404 for unpublished locale routes
- sitemap contains only currently published locales
- robots still points to the correct sitemap URL

### Required HTML assertions

For at least 3 representative pages per locale, verify:

- canonical is correct
- alternates are correct
- title is correct
- description is correct
- no accidental `noindex`
- no duplicated locale path in canonical
- no English canonical on a non-English page

### Data integrity checks before deploy

Before any multilingual deploy, verify:

- `page_copy` row count matches the expected number of pages for the locale batch
- `page-cache.json` contains `copyMeta.locale` for the generated locale pages
- no page in the new locale batch is missing `summary`
- no page in the new locale batch is missing `verdict`
- no page in the new locale batch is missing `editorial.bestFor`

## Post-deploy SEO checks

These checks should be run immediately after deployment and again after the deployment is live on the public domain.

### Immediate post-deploy checks

1. Open the deployed homepage.
2. Open at least 3 English detail pages.
3. Open at least 3 detail pages for each newly published locale.
4. Confirm all expected routes return HTTP 200.
5. Confirm unpublished locale routes still return 404.
6. Fetch `sitemap.xml` from production and confirm only published locales appear.
7. Fetch `robots.txt` from production and confirm the sitemap reference is correct.
8. Inspect production HTML and confirm canonical and alternate tags match the local build.
9. Confirm there are no redirect loops or accidental locale cross-redirects.
10. Confirm Vercel deployment output does not show missing static routes for the newly published locale.

### Search Console and monitoring checks

After the deploy, monitor these items closely:

- URL Inspection for one English page and one page per new locale
- Coverage / indexing for the new locale URLs
- Impressions trend for English pages that should remain stable
- Impressions trend for the new locale pages after discovery starts
- Crawl anomalies, alternate page issues, canonical conflicts, and duplicate warnings

### Rollback triggers

Rollback or unpublish the locale if any of these happen:

- English pages lose correct canonicals
- English pages start resolving under duplicate prefixed paths
- unpublished locales appear in sitemap or alternates
- published locale pages return 404 or soft-404
- canonical tags point to the wrong locale
- Search Console reports duplicate, alternate, or canonical-selection issues at scale
- impressions drop on existing English pages because of routing or canonical conflicts

## Minimal release sign-off

Before approving a locale rollout, confirm all of the following are true:

- local pre-deploy checks passed
- production route checks passed
- production metadata checks passed
- sitemap and robots checks passed
- Search Console inspection checks were completed
- no rollback trigger is currently active

## Things that are intentionally not localized yet

At the current stage, the following remain intentionally conservative:

- homepage rollout strategy
- some UI dictionary content still uses English fallback text
- formatting helpers are fully wired for English first

This is acceptable for the current MVP, but should be completed before public rollout of Tier 1.

## Risks to watch

1. Accidentally overwriting `page_cache` with localized copy.
2. Publishing a locale before AI copy has been generated for the full dataset.
3. Publishing a locale with incomplete UI dictionary coverage.
4. Mixing locale rollout decisions into runtime logic instead of config.
5. Treating translated copy as if it were factual source data.

## Definition of done for a new locale

A locale is considered ready only when:

- it is present in `config/locales.json`
- UI strings are acceptable for production
- AI copy has been generated for the dataset
- ETL output includes correct localized copy
- build passes
- sitemap and metadata are correct
- route verification is complete

Until then, the locale may exist in config as planned, but it must not be published.
