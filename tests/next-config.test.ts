import test from "node:test";
import assert from "node:assert/strict";

import nextConfig from "../next.config.ts";

test("next config redirects www traffic to apex host", async () => {
  assert.equal(typeof nextConfig.redirects, "function");

  const redirects = await nextConfig.redirects?.();
  const hostRedirect = redirects?.find(
    (entry) =>
      entry.source === "/:path*" &&
      entry.destination === "https://triptimi.com/:path*" &&
      entry.permanent === true,
  );

  assert.ok(hostRedirect);
  assert.deepEqual(hostRedirect.has, [
    {
      type: "host",
      value: "www.triptimi.com",
    },
  ]);
});

test("next config applies baseline security headers to all pages", async () => {
  assert.equal(typeof nextConfig.headers, "function");

  const headers = await nextConfig.headers?.();
  const globalHeaders = headers?.find((entry) => entry.source === "/:path*")?.headers ?? [];
  const headerMap = new Map(globalHeaders.map((header) => [header.key, header.value]));

  assert.match(headerMap.get("Content-Security-Policy") ?? "", /frame-ancestors 'self'/);
  assert.match(headerMap.get("Content-Security-Policy") ?? "", /object-src 'none'/);
  assert.equal(headerMap.get("X-Frame-Options"), "SAMEORIGIN");
  assert.equal(headerMap.get("X-Content-Type-Options"), "nosniff");
  assert.equal(headerMap.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.match(headerMap.get("Permissions-Policy") ?? "", /camera=\(\)/);
});
