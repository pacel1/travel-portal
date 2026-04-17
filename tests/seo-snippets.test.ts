import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCityMonthSeoDescription,
  buildCityMonthSeoTitle,
} from "../src/lib/seo-snippets.ts";

test("english city-month snippets stay keyword-first and compact", () => {
  const title = buildCityMonthSeoTitle("Valencia in January", "en");
  const description = buildCityMonthSeoDescription({
    avgTempDay: 16.4,
    crowdLevel: "medium",
    locale: "en",
    pageLabel: "Valencia in January",
    priceLevel: "medium",
    rainyDays: 4,
    sunshineHours: 9.5,
  });

  assert.match(title, /weather/i);
  assert.match(description, /Valencia in January/);
  assert.match(description, /16\.4°C/);
  assert.ok(description.length >= 145);
  assert.ok(description.length <= 158);
});

test("polish city-month snippets include pogoda intent and stay within snippet limits", () => {
  const title = buildCityMonthSeoTitle("Barcelona w marcu", "pl");
  const description = buildCityMonthSeoDescription({
    avgTempDay: 17.2,
    crowdLevel: "low",
    locale: "pl",
    pageLabel: "Barcelona w marcu",
    priceLevel: "medium",
    rainyDays: 6,
    sunshineHours: 8.1,
  });

  assert.match(title, /pogoda/i);
  assert.match(description, /w dzien ok\./i);
  assert.match(description, /17\.2°C/);
  assert.ok(description.length >= 145);
  assert.ok(description.length <= 158);
});
