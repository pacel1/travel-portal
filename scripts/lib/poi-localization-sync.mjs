export async function fetchPoisForLocalization(pool, locale, options = {}) {
  const cityIds = options.cityIds ?? [];
  const poiIds = options.poiIds ?? [];
  const onlyMissing = options.onlyMissing ?? true;

  const clauses = [];
  const values = [locale];

  if (cityIds.length) {
    values.push(cityIds);
    clauses.push(`p.city_id = ANY($${values.length}::text[])`);
  }

  if (poiIds.length) {
    values.push(poiIds);
    clauses.push(`p.id = ANY($${values.length}::text[])`);
  }

  if (onlyMissing) {
    clauses.push("pl.poi_id IS NULL");
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await pool.query(
    `
      SELECT
        p.id,
        p.city_id,
        p.name,
        p.category,
        c.name AS city_name,
        c.country
      FROM poi p
      JOIN cities c ON c.id = p.city_id
      LEFT JOIN poi_localizations pl
        ON pl.poi_id = p.id
       AND pl.locale = $1
      ${whereSql}
      ORDER BY c.slug, p.popularity_score DESC, p.name
    `,
    values,
  );

  return result.rows.map((row) => ({
    id: row.id,
    cityId: row.city_id,
    cityName: row.city_name,
    country: row.country,
    name: row.name,
    category: row.category,
  }));
}

export async function savePoiLocalizations(pool, rows, locale) {
  for (const row of rows) {
    await pool.query(
      `
        INSERT INTO poi_localizations (poi_id, locale, name, generated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (poi_id, locale) DO UPDATE
        SET
          name = EXCLUDED.name,
          generated_at = NOW()
      `,
      [row.poiId, locale, row.name],
    );
  }
}
