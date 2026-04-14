import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getLocalizedEntityData() {
  return {
    cityLocalizations: [],
    poiLocalizations: buildPoiLocalizations(),
  };
}

function buildPoiLocalizations() {
  const filePath = path.resolve(__dirname, "../../src/data/generated/poi-name-overrides.json");

  if (!existsSync(filePath)) {
    return [];
  }

  const contents = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(contents);
  const rows = [];

  for (const [poiId, localeMap] of Object.entries(parsed ?? {})) {
    for (const [locale, value] of Object.entries(localeMap ?? {})) {
      if (typeof value !== "string" || !value.trim()) {
        continue;
      }

      rows.push({
        poiId,
        locale,
        name: value.trim(),
      });
    }
  }

  return rows;
}
