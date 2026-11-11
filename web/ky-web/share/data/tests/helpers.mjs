import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
export {
  hookHarness,
  plain,
  deferred,
  flush,
} from "../../comm/tests/helpers.mjs";

export const dataSource = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src",
);
export const commSource = resolve(dataSource, "../../comm/src");
const facades = new Set([
  "theme",
  "dataset-editor",
  "query-controls",
  "metric-preview",
  "board-preview",
  "report-preview",
]);
function sourceFile(path) {
  return (
    [
      path,
      ...[".ts", ".tsx", ".d.ts", "/index.ts", "/index.tsx"].map(
        (extension) => path + extension,
      ),
    ].find(
      (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
    ) ?? path
  );
}

/** Tests resolve public federation contracts and private source modules to one cached implementation. */
export function sourceModules({
  base = commSource,
  overrides = {},
  globals = {},
} = {}) {
  const cache = new Map(),
    exportMaps = new Map();
  // Match federation's singleton React/AntD graph even when loading comm source.
  const sharedRequire = createRequire(resolve(base === commSource ? dataSource : base, "test-loader.cjs"));
  const normalized = new Map();
  const app = base.match(/\/remote\/([^/]+)\/src$/)?.[1];
  for (const key of Object.getOwnPropertyNames(overrides)) {
    if (app && key.startsWith("@/")) {
      const target = sourceFile(resolve(dataSource, app, key.slice(2)));
      if (existsSync(target)) normalized.set(target, key);
    }
    if (key.startsWith("data/") && !facades.has(key.slice(5)))
      normalized.set(sourceFile(resolve(dataSource, key.slice(5))), key);
  }
  function exportsOf(path) {
    path = sourceFile(path);
    if (exportMaps.has(path)) return exportMaps.get(path);
    const entries = new Map();
    exportMaps.set(path, entries);
    const source = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    for (const statement of source.statements) {
      if (
        ts.isExportDeclaration(statement) &&
        statement.moduleSpecifier &&
        !statement.isTypeOnly
      ) {
        const target = sourceFile(
          resolve(dirname(path), statement.moduleSpecifier.text),
        );
        if (
          statement.exportClause &&
          ts.isNamedExports(statement.exportClause)
        ) {
          for (const item of statement.exportClause.elements)
            if (!item.isTypeOnly)
              entries.set(item.name.text, {
                path: target,
                member: (item.propertyName ?? item.name).text,
              });
        } else if (!statement.exportClause) {
          for (const [name, entry] of exportsOf(target))
            if (name !== "default") entries.set(name, entry);
        }
      } else if (
        statement.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        )
      ) {
        if (
          ts.isInterfaceDeclaration(statement) ||
          ts.isTypeAliasDeclaration(statement)
        )
          continue;
        if (
          statement.modifiers.some(
            (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
          )
        )
          entries.set("default", { path, member: "default" });
        else if (ts.isVariableStatement(statement)) {
          for (const item of statement.declarationList.declarations)
            if (ts.isIdentifier(item.name))
              entries.set(item.name.text, { path, member: item.name.text });
        } else if (statement.name)
          entries.set(statement.name.text, {
            path,
            member: statement.name.text,
          });
      }
    }
    return entries;
  }
  function load(name, from = base) {
    if (name in overrides) return overrides[name];
    if (name.endsWith("?url")) return name;
    let path = name.startsWith("data/")
      ? resolve(dataSource, name.slice(5))
      : name.startsWith("comm/")
        ? resolve(commSource, name.slice(5))
        : name.startsWith("@/")
          ? resolve(base, name.slice(2))
          : name.startsWith(".")
            ? resolve(from, name)
            : name;
    if (!path.startsWith("/"))
      return /^(react(?:-dom)?|antd)(\/|$)/.test(name)
        ? sharedRequire(name)
        : createRequire(resolve(from, "test-loader.cjs"))(name);
    if (path in overrides) return overrides[path];
    const alias = `@/${path.slice(base.length + 1)}`;
    if (path.startsWith(`${base}/`) && alias in overrides)
      return overrides[alias];
    path = sourceFile(path);
    if (path in overrides) return overrides[path];
    if (normalized.has(path)) return overrides[normalized.get(path)];
    if (cache.has(path)) return cache.get(path).exports;
    const module = { exports: {} };
    cache.set(path, module);
    if (path.endsWith(".scss") || path.endsWith(".css")) return module.exports;
    // A federation facade is linked lazily, so a page mock need not evaluate unrelated feature trees.
    if (
      dirname(path) === dataSource &&
      facades.has(path.slice(dataSource.length + 1, -3))
    ) {
      Object.defineProperty(module.exports, "__esModule", { value: true });
      for (const [member, entry] of exportsOf(path))
        Object.defineProperty(module.exports, member, {
          enumerable: true,
          get: () => load(entry.path)[entry.member],
        });
      return module.exports;
    }
    const code = ts.transpileModule(readFileSync(path, "utf8"), {
      fileName: path,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    vm.runInNewContext(
      code,
      {
        module,
        exports: module.exports,
        require: (dependency) => load(dependency, dirname(path)),
        Error,
        Date,
        Set,
        Map,
        URL,
        URLSearchParams,
        Blob,
        Uint8Array,
        TextDecoder,
        AbortController,
        atob,
        btoa,
        structuredClone,
        setTimeout,
        clearTimeout,
        window: { location: { origin: "https://example.test" } },
        ...globals,
      },
      { filename: path },
    );
    return module.exports;
  }
  return load;
}
