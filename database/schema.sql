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

CREATE INDEX IF NOT EXISTS idx_monthly_climate_city_month
  ON monthly_climate (city_id, month);

CREATE INDEX IF NOT EXISTS idx_monthly_scores_city_month
  ON monthly_scores (city_id, month);

CREATE INDEX IF NOT EXISTS idx_poi_city_popularity
  ON poi (city_id, popularity_score DESC);

CREATE INDEX IF NOT EXISTS idx_page_cache_generated_at
  ON page_cache (generated_at DESC);
