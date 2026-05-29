import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { buildCityMonthSeoTitle } from "../src/lib/seo-snippets.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function listSourceFiles(directory: string): string[] {
  const fullDirectory = path.join(repoRoot, directory);

  return readdirSync(fullDirectory).flatMap((entry) => {
    const fullPath = path.join(fullDirectory, entry);
    const relativePath = path.relative(repoRoot, fullPath);

    if (statSync(fullPath).isDirectory()) {
      return listSourceFiles(relativePath);
    }

    return /\.(tsx|ts)$/.test(entry) ? [relativePath] : [];
  });
}

test("literal jump links in TSX point to matching ids", () => {
  const issues: string[] = [];

  for (const relativePath of listSourceFiles("src")) {
    const source = read(relativePath);
    const ids = new Set(
      Array.from(source.matchAll(/\bid=["']([A-Za-z][\w:-]*)["']/g)).map((match) => match[1]),
    );

    for (const match of source.matchAll(/\bhref=["']#([A-Za-z][\w:-]*)["']/g)) {
      if (!ids.has(match[1])) {
        issues.push(`${relativePath} links to #${match[1]} without a matching id`);
      }
    }
  }

  assert.deepEqual(issues, []);
});

test("localized metadata and sitemap include x-default hreflang helpers", () => {
  assert.match(read("src/components/localized-home-page.tsx"), /addXDefaultLanguageAlternate/);
  assert.match(read("src/components/destinations-index.tsx"), /addXDefaultLanguageAlternate/);
  assert.match(read("src/app/[locale]/page.tsx"), /addXDefaultLanguageAlternate/);
  assert.match(read("src/app/sitemap.ts"), /addXDefaultLanguageAlternate/);
});

test("structured data avoids broken homepage fragment breadcrumbs", () => {
  const travelPageSource = read("src/app/[locale]/page.tsx");

  assert.doesNotMatch(travelPageSource, /buildHomePath\(locale\)}#/);
  assert.match(travelPageSource, /serializeJsonLd\(structuredData\)/);
});

test("long city-month SEO titles get compact fallbacks", () => {
  const englishTitle = buildCityMonthSeoTitle(
    "Santa Cruz de Tenerife in September",
    "en",
  );
  const polishTitle = buildCityMonthSeoTitle(
    "Santa Cruz de Tenerife we wrzesniu",
    "pl",
  );

  assert.ok(englishTitle.length <= 60);
  assert.ok(polishTitle.length <= 60);
});
