import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(response.headers.get("cache-control") ?? "", /no-store/i);
  const html = await response.text();
  assert.match(html, developmentPreviewMeta);

  const publicReferences = [...html.matchAll(/(?:src|href)=["'](\/(?:assets|brand|maps)\/[^"']+)["']/g)].map((match) => match[1]);
  assert.ok(publicReferences.length >= 6, "the rendered shell should reference its built CSS, JavaScript, brand, and map assets");
  const clientRoot = fileURLToPath(new URL("../dist/client/", import.meta.url));
  await Promise.all([...new Set(publicReferences)].map((reference) => access(`${clientRoot}${decodeURIComponent(reference.slice(1))}`)));
});
