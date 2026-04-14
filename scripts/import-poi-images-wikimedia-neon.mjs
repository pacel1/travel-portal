import { applySchema, createNeonPool } from "./lib/neon-sync.mjs";
import { loadLocalEnv } from "./lib/load-env.mjs";
import { resolvePoiImageFromWikimedia } from "./lib/wikimedia-poi-images.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before importing Wikimedia POI images.");
}

const targetCityIds = String(process.env.WIKIMEDIA_CITY_IDS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const targetPoiIds = String(process.env.WIKIMEDIA_POI_IDS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const batchLimit = Number(process.env.WIKIMEDIA_POI_LIMIT ?? 0);
const forceRefresh = ["1", "true", "yes", "on"].includes(
  String(process.env.WIKIMEDIA_FORCE_REFRESH ?? "").trim().toLowerCase(),
);
const requestDelayMs = Number(process.env.WIKIMEDIA_DELAY_MS ?? 500);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTargetPois(pool) {
  const values = ["en"];
  const clauses = [];

  if (targetCityIds.length) {
    values.push(targetCityIds);
    clauses.push(`p.city_id = ANY($${values.length}::text[])`);
  }

  if (targetPoiIds.length) {
    values.push(targetPoiIds);
    clauses.push(`p.id = ANY($${values.length}::text[])`);
  }

  if (!forceRefresh) {
    clauses.push("pi.poi_id IS NULL");
  }

  if (batchLimit > 0) {
    values.push(batchLimit);
  }

  const result = await pool.query(
    `
      SELECT
        p.id,
        p.name,
        p.category,
        p.city_id,
        c.name AS city_name,
        COALESCE(pl.name, p.name) AS localized_name
      FROM poi p
      JOIN cities c ON c.id = p.city_id
      LEFT JOIN poi_localizations pl
        ON pl.poi_id = p.id
       AND pl.locale = $1
      LEFT JOIN poi_images pi
        ON pi.poi_id = p.id
      WHERE EXISTS (
        SELECT 1
        FROM page_cache pc
        WHERE EXISTS (
          SELECT 1
          FROM jsonb_array_elements(pc.payload_json->'attractions'->'outdoor') item
          WHERE item->>'id' = p.id
        )
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(pc.payload_json->'attractions'->'indoor') item
          WHERE item->>'id' = p.id
        )
      )
      ${clauses.length ? `AND ${clauses.join(" AND ")}` : ""}
      ORDER BY p.popularity_score DESC, p.id
      ${batchLimit > 0 ? `LIMIT $${values.length}` : ""}
    `,
    values,
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    cityId: row.city_id,
    cityName: row.city_name,
    localizedName: row.localized_name,
  }));
}

async function upsertPoiImage(pool, image) {
  await pool.query(
    `
      INSERT INTO poi_images (
        poi_id,
        source,
        source_page_url,
        file_title,
        image_url,
        thumb_url,
        width,
        height,
        author,
        license_name,
        license_url,
        attribution_text,
        generated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (poi_id) DO UPDATE
      SET
        source = EXCLUDED.source,
        source_page_url = EXCLUDED.source_page_url,
        file_title = EXCLUDED.file_title,
        image_url = EXCLUDED.image_url,
        thumb_url = EXCLUDED.thumb_url,
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        author = EXCLUDED.author,
        license_name = EXCLUDED.license_name,
        license_url = EXCLUDED.license_url,
        attribution_text = EXCLUDED.attribution_text,
        generated_at = NOW()
    `,
    [
      image.poiId,
      image.source,
      image.sourcePageUrl,
      image.fileTitle,
      image.imageUrl,
      image.thumbUrl,
      image.width,
      image.height,
      image.author,
      image.licenseName,
      image.licenseUrl,
      image.attributionText,
    ],
  );
}

async function deletePoiImage(pool, poiId) {
  await pool.query(`DELETE FROM poi_images WHERE poi_id = $1`, [poiId]);
}

async function main() {
  const pool = createNeonPool(process.env.DATABASE_URL);

  try {
    await applySchema(pool);
    const pois = await fetchTargetPois(pool);

    if (!pois.length) {
      console.log("No POIs need Wikimedia images for the current selection.");
      return;
    }

    let imported = 0;
    let skipped = 0;
    let removed = 0;

    for (const poi of pois) {
      try {
        const image = await resolvePoiImageFromWikimedia(poi);

        if (!image) {
          if (forceRefresh) {
            await deletePoiImage(pool, poi.id);
            removed += 1;
          }
          skipped += 1;
        } else {
          await upsertPoiImage(pool, image);
          imported += 1;
        }
      } catch (error) {
        skipped += 1;
        console.warn(`Wikimedia image import skipped for ${poi.id}: ${error.message}`);
      }

      if (requestDelayMs > 0) {
        await sleep(requestDelayMs);
      }
    }

    console.log(
      `Imported ${imported} Wikimedia POI images${skipped ? `, skipped ${skipped} unmatched POIs` : ""}${removed ? `, and removed ${removed} stale image rows` : ""}.`,
    );
  } finally {
    await pool.end();
  }
}

await main();
