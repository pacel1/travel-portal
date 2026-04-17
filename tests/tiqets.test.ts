import assert from "node:assert/strict";
import test from "node:test";

import { getTiqetsCityId, shouldRenderTiqetsWidget } from "../src/lib/tiqets.ts";

test("getTiqetsCityId returns IDs for supported internal city ids", () => {
  assert.equal(getTiqetsCityId("berlin", "Berlin"), "65144");
  assert.equal(getTiqetsCityId("barcelona", "Barcelona"), "66342");
  assert.equal(getTiqetsCityId("warsaw", "Warsaw"), "485");
});

test("getTiqetsCityId falls back to normalized city names when needed", () => {
  assert.equal(getTiqetsCityId("unknown-city", "Krak\u00f3w"), "46");
  assert.equal(getTiqetsCityId("unknown-city", "Krakow"), "46");
});

test("getTiqetsCityId returns null for unsupported cities", () => {
  assert.equal(getTiqetsCityId("bialystok", "Bia\u0142ystok"), null);
  assert.equal(getTiqetsCityId("augsburg", "Augsburg"), null);
});

test("shouldRenderTiqetsWidget matches page-level section visibility", () => {
  assert.equal(shouldRenderTiqetsWidget("berlin", "Berlin"), true);
  assert.equal(shouldRenderTiqetsWidget("bialystok", "Bia\u0142ystok"), false);
});
