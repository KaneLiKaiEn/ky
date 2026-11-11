#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHELL = "share/comm/src/styles/shell.css";
const SHELL_FILES = new Set([SHELL, "share/comm/src/styles/shell-scroll.css"]);
const EXTENSIONS = new Set([".ts", ".tsx", ".css", ".scss"]);
const IGNORED = new Set([
  "assets",
  "vendor",
  "public",
  "dist",
  "node_modules",
  "@mf-types",
]);
const TOKEN = /--app-theme-[a-zA-Z0-9-]+/g;

// Preserve literals (including URLs) and line numbers while ignoring commented examples.
function withoutComments(source) {
  return source.replace(
    /(["'`])(?:\\[\s\S]|(?!\1)[^\\])*?\1|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
    (text) =>
      text.startsWith("/*") || text.startsWith("//")
        ? text.replace(/[^\n]/g, " ")
        : text,
  );
}

function sourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (IGNORED.has(entry.name)) return [];
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return EXTENSIONS.has(extname(file)) && !file.endsWith(".d.ts")
      ? [file]
      : [];
  });
}

function sourceRoots(root) {
  const roots = existsSync(join(root, "host/src")) ? ["host/src"] : [];
  for (const group of ["remote", "share"]) {
    const directory = join(root, group);
    if (!existsSync(directory)) continue;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (
        entry.isDirectory() &&
        existsSync(join(directory, entry.name, "src"))
      ) {
        roots.push(`${group}/${entry.name}/src`);
      }
    }
  }
  return roots;
}

function imports(source) {
  return [
    ...source.matchAll(
      /(?:\b(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?|\bimport\s*\(\s*|@(?:import|use|forward)\s+(?:url\(\s*)?)["']([^"']+)["']/g,
    ),
  ].map((match) => ({ specifier: match[1], offset: match.index }));
}

function importPath(root, file, specifier) {
  if (specifier.startsWith("."))
    return relative(root, resolve(dirname(file), specifier));
  if (specifier.startsWith("@/")) {
    const sourceRoot = file.slice(0, file.indexOf("/src/") + 5);
    return relative(root, resolve(sourceRoot, specifier.slice(2)));
  }
  return specifier;
}

export function checkTheme(root = ROOT) {
  const roots = sourceRoots(root);
  const records = roots
    .flatMap((directory) => sourceFiles(join(root, directory)))
    .map((file) => ({
      file,
      name: relative(root, file).replaceAll("\\", "/"),
      source: withoutComments(readFileSync(file, "utf8")),
    }));
  const definitions = new Set();
  for (const { source } of records) {
    // Both CSS declarations and React style objects are legitimate scoped definitions.
    for (const match of source.matchAll(
      /(?:["']?(--app-theme-[a-zA-Z0-9-]+)["']?\s*:|setProperty\(\s*["'](--app-theme-[a-zA-Z0-9-]+)["'])/g,
    )) {
      definitions.add(match[1] ?? match[2]);
    }
  }

  const errors = [];
  const report = (record, offset, message) => {
    const line = record.source.slice(0, offset).split("\n").length;
    errors.push(`${record.name}:${line}: ${message}`);
  };
  for (const record of records) {
    const { file, name, source } = record;
    for (const match of source.matchAll(TOKEN)) {
      if (!definitions.has(match[0]))
        report(record, match.index, `Undefined theme variable ${match[0]}`);
    }
    const resolvedImports = imports(source).map((entry) => ({
      ...entry,
      target: importPath(root, file, entry.specifier).replaceAll("\\", "/"),
    }));
    const isBootstrap =
      /^(?:host|remote\/[^/]+|share\/(?:widget|visit))\/src\/bootstrap\.tsx$/.test(
        name,
      );
    for (const entry of resolvedImports) {
      if (SHELL_FILES.has(entry.target) && !isBootstrap) {
        report(
          record,
          entry.offset,
          "Document shell styles may only be imported by standalone bootstrap.tsx",
        );
      }
    }
    if (
      isBootstrap &&
      resolvedImports.filter((entry) => entry.target === SHELL).length !== 1
    ) {
      report(
        record,
        0,
        "Standalone bootstrap must import the shared shell exactly once",
      );
    }
    if ([".css", ".scss"].includes(extname(file)) && !SHELL_FILES.has(name)) {
      const scopes = [];
      for (const match of source.matchAll(/([^{}]*)([{}])/g)) {
        if (match[2] === "}") {
          scopes.pop();
          continue;
        }
        const header = match[1].split(";").at(-1).trim();
        const scoped = scopes.some((scope) => !scope.startsWith("@"));
        scopes.push(header);
        // SCSS nesting such as .markdown { a { ... } } is a local selector.
        if (scoped) continue;
        const selectors = header.split(",").map((item) => item.trim());
        if (
          !selectors.some((item) =>
            /^(?::root|html|body|#root|a|ul|ol)$/.test(item),
          )
        )
          continue;
        // Standalone custom-property declarations are tokens, not document resets.
        const body = source
          .slice(match.index + match[0].length)
          .split(/[{}]/, 1)[0];
        const declarations = body
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean);
        if (
          selectors.every((item) => item === ":root") &&
          declarations.every((item) => /^--[\w-]+\s*:/.test(item))
        )
          continue;
        report(
          record,
          match.index,
          "Document reset selectors belong in the shared shell, not embedded styles",
        );
      }
    }
  }
  return { errors, files: records.length, definitions: definitions.size };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = checkTheme();
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(
      `Theme check passed (${result.files} source files, ${result.definitions} declared app-theme variables).`,
    );
  }
}
