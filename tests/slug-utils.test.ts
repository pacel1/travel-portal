import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCitySlugAliases,
  getCanonicalCitySlug,
  normalizeTravelSlug,
} from "../src/lib/slug-utils.ts";

test("normalizeTravelSlug transliterates Polish l with stroke", () => {
  assert.equal(normalizeTravelSlug("Wroclaw"), "wroclaw");
  assert.equal(normalizeTravelSlug("Wrocław"), "wroclaw");
});

test("getCanonicalCitySlug fixes malformed stored slugs", () => {
  assert.equal(getCanonicalCitySlug("wroc-aw", "Wrocław"), "wroclaw");
  assert.equal(getCanonicalCitySlug("valencia", "Valencia"), "valencia");
});

test("buildCitySlugAliases keeps legacy and canonical city slugs", () => {
  const aliases = buildCitySlugAliases("wroc-aw", "Wrocław");

  assert.ok(aliases.has("wroc-aw"));
  assert.ok(aliases.has("wroclaw"));
});
