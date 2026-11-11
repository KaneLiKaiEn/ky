import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sourceModules, dataSource } from "./helpers.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
    item.isDirectory()
      ? sources(resolve(dir, item.name))
      : /\.(ts|tsx|scss)$/.test(item.name)
        ? [resolve(dir, item.name)]
        : [],
  );
}
test("analytics applications depend on data and comm, and expose only their application entry", () => {
  for (const app of ["metric", "board", "report"]) {
    const config = readFileSync(
      resolve(root, "remote", app, "vite.config.ts"),
      "utf8",
    );
    const remotes = config.match(/remotes:\s*\{([\s\S]*?)shareStrategy:/)[1];
    assert.match(remotes, /\bdata:\s*\{/);
    assert.match(remotes, /\bcomm:\s*\{/);
    assert.doesNotMatch(remotes, /\b(metric|board|report):\s*\{/);
    const exposes = config.match(/exposes:\s*\{([\s\S]*?)\},/)[1];
    assert.deepEqual(
      [...exposes.matchAll(/"\.\/([^"]+)"\s*:/g)].map((item) => item[1]),
      [app],
    );
    for (const path of sources(resolve(root, "remote", app, "src")))
      assert.doesNotMatch(
        readFileSync(path, "utf8"),
        /(?:from\s*|import\s*\()["'](?:metric|board|report)\//,
        path,
      );
  }
});
test("data has no business remote, self remote or source dependency on remote applications", () => {
  const config = readFileSync(
    resolve(root, "share/data/vite.config.ts"),
    "utf8",
  );
  const remotes = config.match(/remotes:\s*\{([\s\S]*?)shareStrategy:/)[1];
  assert.doesNotMatch(remotes, /\b(data|metric|board|report):\s*\{/);
  for (const path of sources(dataSource)) {
    const text = readFileSync(path, "utf8");
    assert.doesNotMatch(
      text,
      /(?:from\s*|import\s*\()["'](?:data|metric|board|report)\//,
      path,
    );
    assert.doesNotMatch(
      text,
      /(?:from\s*|import\s*\()["'][^"']*\bremote\//,
      path,
    );
  }
});
test("the public metric context is the same instance used by its shared components", () => {
  const load = sourceModules({ base: dataSource });
  assert.equal(
    load("data/metric-preview").Context,
    load("data/metric/features/metric-preview/context").Context,
  );
  assert.equal(
    load("data/metric-preview").usePreview,
    load("data/metric/features/metric-preview/context").usePreview,
  );
});
test("all embedded preview public entries avoid mounting inactive readers", () => {
  const load = sourceModules({ base: dataSource });
  for (const app of ["metric", "board", "report"])
    assert.equal(load(`data/${app}-preview`).default({ active: false }), null);
});
