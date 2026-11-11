import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const sourceRoot = fileURLToPath(new URL("../src", import.meta.url));

/** Preview the real exposed sources while keeping auth/network mocks at their boundary. */
export function commTestSources(
  requestMock: string,
  sessionMock: string,
): Plugin {
  return {
    name: "test-comm-sources",
    enforce: "pre",
    resolveId(source, importer) {
      if (["comm/resource", "comm/management", "comm/utils", "comm/theme"].includes(source))
        return resolve(sourceRoot, `${source.slice(5)}.ts`);
      if (importer?.startsWith(sourceRoot) && source.startsWith(".")) {
        const target = resolve(dirname(importer.split("?")[0]), source).replace(
          /\.tsx?$/,
          "",
        );
        if (target === resolve(sourceRoot, "request")) return requestMock;
        if (target === resolve(sourceRoot, "session")) return sessionMock;
      }
    },
  };
}
