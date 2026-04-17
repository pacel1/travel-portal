import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCitySlugAliases,
  getCanonicalCitySlug,
  normalizeTravelSlug,
} from "../src/lib/slug-utils.ts";

test("normalizeTravelSlug transliterates Polish city names into stable ASCII slugs", () => {
  assert.equal(normalizeTravelSlug("Wroclaw"), "wroclaw");
  assert.equal(normalizeTravelSlug("Wroc\u0142aw"), "wroclaw");
  assert.equal(normalizeTravelSlug("\u0141\u00f3d\u017a"), "lodz");
  assert.equal(normalizeTravelSlug("Bia\u0142ystok"), "bialystok");
});

test("getCanonicalCitySlug fixes malformed stored slugs", () => {
  assert.equal(getCanonicalCitySlug("wroc-aw", "Wroc\u0142aw"), "wroclaw");
  assert.equal(getCanonicalCitySlug("odz", "\u0141\u00f3d\u017a"), "lodz");
  assert.equal(getCanonicalCitySlug("bia-ystok", "Bia\u0142ystok"), "bialystok");
  assert.equal(getCanonicalCitySlug("valencia", "Valencia"), "valencia");
});

test("buildCitySlugAliases keeps legacy and canonical city slugs", () => {
  const wroclawAliases = buildCitySlugAliases("wroc-aw", "Wroc\u0142aw");
  const lodzAliases = buildCitySlugAliases("lodz", "\u0141\u00f3d\u017a");
  const bialystokAliases = buildCitySlugAliases("bialystok", "Bia\u0142ystok");

  assert.ok(wroclawAliases.has("wroc-aw"));
  assert.ok(wroclawAliases.has("wroclaw"));
  assert.ok(lodzAliases.has("odz"));
  assert.ok(lodzAliases.has("lodz"));
  assert.ok(bialystokAliases.has("bia-ystok"));
  assert.ok(bialystokAliases.has("bialystok"));
});
