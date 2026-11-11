import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { checkTheme } from "./theme-check.mjs";

function fixture(t, files = {}) {
  const root = mkdtempSync(join(tmpdir(), "theme-check-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (name, source) => {
    const file = join(root, name);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, source);
  };
  write("share/comm/src/styles/shell.css", "body { margin: 0; }");
  write(
    "share/comm/src/themeVars.ts",
    'export const vars = { "--app-theme-text": token.colorText };',
  );
  write(
    "remote/sample/src/bootstrap.tsx",
    'import "../../../share/comm/src/styles/shell.css";',
  );
  for (const [name, source] of Object.entries(files)) write(name, source);
  return { root, write };
}

test("reports unknown CSS and Tailwind theme keys even when a fallback masks the typo", (t) => {
  const { root } = fixture(t, {
    "remote/sample/src/View.tsx":
      'const view = <div className="bg-(--app-theme-container)" />;',
    "remote/sample/src/page.scss":
      ".page { color: var(--app-theme-txet, #333); }",
  });
  const { errors } = checkTheme(root);
  assert.equal(errors.length, 2);
  assert.ok(errors.some((error) => error.includes("--app-theme-container")));
  assert.ok(errors.some((error) => error.includes("--app-theme-txet")));
});

test("accepts scoped CSS and React definitions while ignoring generated assets and comments", (t) => {
  const { root } = fixture(t, {
    "remote/sample/src/View.tsx":
      'const style = { "--app-theme-local": "red" };\nconst url = "https://example.test";\n// --app-theme-comment\n',
    "remote/sample/src/page.scss":
      ".page { --app-theme-accent: red; color: var(--app-theme-local); background: var(--app-theme-accent); }\n/* --app-theme-example */",
    "remote/sample/src/layout.scss": ":root { --app-layout-size: 56px; }",
    "remote/sample/src/assets/vendor.css":
      "body { color: var(--app-theme-vendor); }",
    "remote/sample/src/generated.d.ts":
      'type Generated = "--app-theme-generated";',
  });
  assert.deepEqual(checkTheme(root).errors, []);
});

test("rejects shell imports through components, lazy imports and CSS wrappers", (t) => {
  const { root } = fixture(t, {
    "remote/sample/src/App.tsx":
      'import "../../../share/comm/src/styles/shell.css";',
    "remote/sample/src/expose.ts":
      'await import("../../../share/comm/src/styles/shell-scroll.css");',
    "remote/sample/src/index.css":
      '@import "../../../share/comm/src/styles/shell.css";',
  });
  const { errors } = checkTheme(root);
  assert.equal(errors.length, 3);
  assert.ok(
    errors.every((error) => error.includes("only be imported by standalone")),
  );
});

test("requires standalone shell imports and rejects duplicate imports", (t) => {
  const { root, write } = fixture(t);
  write("remote/sample/src/bootstrap.tsx", 'import "./index.css";');
  assert.match(checkTheme(root).errors[0], /exactly once/);
  write(
    "remote/sample/src/bootstrap.tsx",
    'import "../../../share/comm/src/styles/shell.css";\nimport "../../../share/comm/src/styles/shell.css";',
  );
  assert.match(checkTheme(root).errors[0], /exactly once/);
});

test("rejects document resets but accepts scoped rules and Tailwind palette imports", (t) => {
  const { root, write } = fixture(t, {
    "remote/sample/src/index.css":
      '@import "tailwindcss/theme.css" layer(theme);\nbody { overflow: hidden; }\n.page a { color: var(--app-theme-text); }',
  });
  assert.equal(checkTheme(root).errors.length, 1);
  assert.match(checkTheme(root).errors[0], /Document reset/);
  write(
    "remote/sample/src/index.css",
    '@import "tailwindcss/theme.css" layer(theme);\n.page a { color: var(--app-theme-text); }',
  );
  assert.deepEqual(checkTheme(root).errors, []);
});

test("accepts the visit standalone scroll exception without exposing it to components", (t) => {
  const { root } = fixture(t, {
    "share/comm/src/styles/shell-scroll.css": "body { overflow: auto; }",
    "share/visit/src/bootstrap.tsx":
      'import "../../comm/src/styles/shell.css";\nimport "../../comm/src/styles/shell-scroll.css";',
  });
  assert.deepEqual(checkTheme(root).errors, []);
});

test("distinguishes nested SCSS elements from document rules inside media queries", (t) => {
  const { root, write } = fixture(t, {
    "remote/sample/src/article.scss":
      ".markdown { p, ul, ol { margin: 0; } a { color: red; } @media (width < 600px) { a { color: blue; } } }",
  });
  assert.deepEqual(checkTheme(root).errors, []);
  write(
    "remote/sample/src/article.scss",
    "@media (width < 600px) { body { margin: 0; } }",
  );
  assert.equal(checkTheme(root).errors.length, 1);
});
