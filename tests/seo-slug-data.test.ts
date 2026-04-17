import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const legacyCitySlugs = new Set(["bia-ystok", "odz", "wroc-aw"]);
const legacyPageSlugPrefixes = ["bia-ystok-in-", "odz-in-", "wroc-aw-in-"];

function readJson(relativePath: string) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function hasLegacyPageSlug(value: string) {
  return legacyPageSlugPrefixes.some((prefix) => value.startsWith(prefix));
}

test("raw city catalog keeps internal ids but exposes canonical slugs", () => {
  const cities = readJson("src/data/raw/european-cities-top20.json");
  const slugById = new Map(cities.map((city: { id: string; slug: string }) => [city.id, city.slug]));

  assert.equal(slugById.get("wroc-aw"), "wroclaw");
  assert.equal(slugById.get("odz"), "lodz");
  assert.equal(slugById.get("bia-ystok"), "bialystok");
});

test("generated monthly scores and page payloads only expose canonical public slugs", () => {
  const monthlyScores = readJson("src/data/generated/monthly-scores.json");
  const pages = readJson("src/data/generated/page-cache.json");

  assert.ok(
    monthlyScores.every((record: { citySlug: string }) => !legacyCitySlugs.has(record.citySlug)),
  );
  assert.ok(pages.some((page: { slug: string }) => page.slug === "lodz-in-january"));
  assert.ok(pages.some((page: { slug: string }) => page.slug === "wroclaw-in-january"));
  assert.ok(pages.some((page: { slug: string }) => page.slug === "bialystok-in-january"));

  for (const page of pages as Array<{
    slug: string;
    citySlug: string;
    internalLinks?: { sameCity?: { slug: string }[]; similarCities?: { slug: string }[] };
  }>) {
    assert.ok(!legacyCitySlugs.has(page.citySlug));
    assert.ok(!hasLegacyPageSlug(page.slug));

    for (const group of [page.internalLinks?.sameCity ?? [], page.internalLinks?.similarCities ?? []]) {
      assert.ok(group.every((entry) => !hasLegacyPageSlug(entry.slug)));
    }
  }
});

test("localized page copy keys use canonical page slugs", () => {
  const pageCopy = readJson("src/data/generated/page-copy.json");

  for (const localeEntries of Object.values(pageCopy) as Array<Record<string, unknown>>) {
    const slugs = Object.keys(localeEntries);
    assert.ok(slugs.every((slug) => !hasLegacyPageSlug(slug)));
  }

  const englishCopy = pageCopy.en as Record<string, unknown>;
  assert.ok(englishCopy["lodz-in-january"]);
  assert.ok(englishCopy["wroclaw-in-january"]);
  assert.ok(englishCopy["bialystok-in-january"]);
});
