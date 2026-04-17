import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("formatting config includes localized Morocco labels", () => {
  const formattingSource = readFileSync(path.join(repoRoot, "src/lib/formatting.ts"), "utf8");

  assert.match(formattingSource, /Morocco:\s*"Morocco"/);
  assert.match(formattingSource, /Morocco:\s*"Maroko"/);
  assert.match(formattingSource, /Morocco:\s*"Marokko"/);
  assert.match(formattingSource, /Morocco:\s*"Maroc"/);
  assert.match(formattingSource, /Morocco:\s*"Marruecos"/);
});
