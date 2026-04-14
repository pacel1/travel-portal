import { monthNumberByName } from "./travel-engine.mjs";

function stripNullChars(value) {
  if (typeof value === "string") {
    return value.replace(/\u0000/g, "");
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripNullChars(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, stripNullChars(nestedValue)]),
    );
  }

  return value;
}

export async function fetchCachedPages(pool, options = {}) {
  const cityIds = options.cityIds ?? [];
  const result = cityIds.length
    ? await pool.query(
        `
          SELECT city_id, month, payload_json
          FROM page_cache
          WHERE city_id = ANY($1::text[])
          ORDER BY city_id, month
        `,
        [cityIds],
      )
    : await pool.query(`
        SELECT city_id, month, payload_json
        FROM page_cache
        ORDER BY city_id, month
      `);

  return result.rows.map((row) => row.payload_json);
}

export function buildPageCopyKey(cityId, month) {
  const normalizedMonth = typeof month === "number" ? month : monthNumberByName[month];
  return `${cityId}:${normalizedMonth}`;
}

export async function fetchLocalizedCopyMap(pool, locale, options = {}) {
  const cityIds = options.cityIds ?? [];
  const result = cityIds.length
    ? await pool.query(
        `
          SELECT city_id, month, copy_json
          FROM page_copy
          WHERE locale = $1
            AND city_id = ANY($2::text[])
        `,
        [locale, cityIds],
      )
    : await pool.query(
        `
          SELECT city_id, month, copy_json
          FROM page_copy
          WHERE locale = $1
        `,
        [locale],
      );

  return Object.fromEntries(
    result.rows.map((row) => [buildPageCopyKey(row.city_id, row.month), row.copy_json]),
  );
}

export async function saveLocalizedPages(pool, pages, locale) {
  for (const page of pages) {
    const sanitizedCopy = stripNullChars({
      summary: page.summary,
      verdict: page.verdict,
      recommendations: page.recommendations,
      tips: page.tips,
      editorial: page.editorial,
      copyMeta: page.copyMeta,
    });

    await pool.query(
      `
        INSERT INTO page_copy (city_id, month, locale, copy_json, generated_at)
        VALUES ($1, $2, $3, $4::jsonb, $5::timestamptz)
        ON CONFLICT (city_id, month, locale) DO UPDATE
        SET
          copy_json = EXCLUDED.copy_json,
          generated_at = EXCLUDED.generated_at
      `,
      [
        page.cityId,
        monthNumberByName[page.month],
        locale,
        JSON.stringify(sanitizedCopy),
        page.copyMeta?.generatedAt ?? new Date().toISOString(),
      ],
    );
  }
}
