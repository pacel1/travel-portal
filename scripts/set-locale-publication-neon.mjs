import { applySchema, createNeonPool, syncLocalePublication } from "./lib/neon-sync.mjs";
import { loadLocalEnv } from "./lib/load-env.mjs";
import { allLocales } from "./lib/locales.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before updating locale publication.");
}

const locale = String(process.env.LOCALE_CODE ?? process.env.LOCALE ?? "")
  .trim()
  .toLowerCase();
const publishedInput = String(process.env.LOCALE_PUBLISHED ?? "")
  .trim()
  .toLowerCase();

if (!locale || !allLocales.includes(locale)) {
  throw new Error(
    `Unsupported or missing LOCALE_CODE. Expected one of: ${allLocales.join(", ")}.`,
  );
}

if (!["1", "true", "yes", "on", "0", "false", "no", "off"].includes(publishedInput)) {
  throw new Error(
    'Missing LOCALE_PUBLISHED. Use "true" to publish or "false" to unpublish.',
  );
}

const published = ["1", "true", "yes", "on"].includes(publishedInput);
const pool = createNeonPool(process.env.DATABASE_URL);

try {
  await applySchema(pool);
  await syncLocalePublication(pool);
  await pool.query(
    `
      UPDATE locale_publication
      SET published = $2, updated_at = NOW()
      WHERE locale = $1
    `,
    [locale, published],
  );

  console.log(
    `${locale} is now marked as ${published ? "published" : "unpublished"} in locale_publication.`,
  );
} finally {
  await pool.end();
}
