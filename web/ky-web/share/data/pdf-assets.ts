import type { Plugin } from "vite";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { readdirSync, readFileSync } from "node:fs";

/** Keep fonts/CMaps/decoders local in both standalone and federated deployments. */
export function pdfAssets(): Plugin {
  const root = dirname(
    createRequire(import.meta.url).resolve("pdfjs-dist/package.json"),
  );
  const files = new Map<string, string>();
  files.set(
    "report-pdf-assets/pdf.worker.min.js",
    resolve(root, "build/pdf.worker.min.mjs"),
  );
  for (const folder of ["cmaps", "standard_fonts", "wasm"])
    for (const name of readdirSync(resolve(root, folder)))
      files.set(
        `report-pdf-assets/${folder}/${name}`,
        resolve(root, folder, name),
      );
  return {
    name: "report-pdf-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split("?")[0].replace(/^\//, "");
        const file = name && files.get(name);
        if (!file) return next();
        res.setHeader(
          "Content-Type",
          name!.endsWith(".wasm")
            ? "application/wasm"
            : name!.endsWith(".js")
              ? "text/javascript"
              : "application/octet-stream",
        );
        res.end(readFileSync(file));
      });
    },
    generateBundle() {
      for (const [fileName, file] of files)
        this.emitFile({ type: "asset", fileName, source: readFileSync(file) });
    },
  };
}
