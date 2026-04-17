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
