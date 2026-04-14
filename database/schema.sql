CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  population INTEGER
);

CREATE TABLE IF NOT EXISTS monthly_climate (
  id BIGSERIAL PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  avg_temp_day NUMERIC(5,2) NOT NULL,
  avg_temp_night NUMERIC(5,2) NOT NULL,
  rainfall_mm NUMERIC(6,2) NOT NULL,
  rainy_days NUMERIC(5,2) NOT NULL,
  humidity NUMERIC(5,2) NOT NULL,
  sunshine_hours NUMERIC(5,2) NOT NULL,
  UNIQUE (city_id, month)
);

CREATE TABLE IF NOT EXISTS poi (
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  indoor BOOLEAN NOT NULL DEFAULT FALSE,
  popularity_score INTEGER NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS city_localizations (
  city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  canonical_slug TEXT,
  aliases_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (city_id, locale),
  CHECK (jsonb_typeof(aliases_json) = 'array')
);

CREATE TABLE IF NOT EXISTS poi_localizations (
  poi_id TEXT NOT NULL REFERENCES poi(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (poi_id, locale)
);

CREATE TABLE IF NOT EXISTS poi_images (
  poi_id TEXT PRIMARY KEY REFERENCES poi(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_page_url TEXT NOT NULL,
  file_title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumb_url TEXT,
  width INTEGER,
  height INTEGER,
  author TEXT,
  license_name TEXT,
  license_url TEXT,
  attribution_text TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locale_publication (
  locale TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  tier TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_scores (
  id BIGSERIAL PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  crowd_level TEXT NOT NULL CHECK (crowd_level IN ('low', 'medium', 'high')),
  price_level TEXT NOT NULL CHECK (price_level IN ('low', 'medium', 'high')),
  UNIQUE (city_id, month)
);

CREATE TABLE IF NOT EXISTS page_cache (
  id BIGSERIAL PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  payload_json JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (city_id, month)
);

CREATE TABLE IF NOT EXISTS page_copy (
  id BIGSERIAL PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  locale TEXT NOT NULL,
  copy_json JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (city_id, month, locale)
);

CREATE INDEX IF NOT EXISTS idx_monthly_climate_city_month
  ON monthly_climate (city_id, month);

CREATE INDEX IF NOT EXISTS idx_monthly_scores_city_month
  ON monthly_scores (city_id, month);

CREATE INDEX IF NOT EXISTS idx_poi_city_popularity
  ON poi (city_id, popularity_score DESC);

CREATE INDEX IF NOT EXISTS idx_city_localizations_locale
  ON city_localizations (locale, city_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_city_localizations_locale_slug
  ON city_localizations (locale, canonical_slug)
  WHERE canonical_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_poi_localizations_locale
  ON poi_localizations (locale, poi_id);

CREATE INDEX IF NOT EXISTS idx_poi_images_source
  ON poi_images (source, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_locale_publication_published
  ON locale_publication (published, locale);

CREATE INDEX IF NOT EXISTS idx_page_cache_generated_at
  ON page_cache (generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_copy_locale_generated_at
  ON page_copy (locale, generated_at DESC);
