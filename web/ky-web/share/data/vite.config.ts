import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { fileURLToPath } from "node:url";
import { mfFastRefreshCompat } from "../../vite-plugin-mf-fast-refresh";
import { appVersion } from "../../vite-plugin-app-version";
import { pdfAssets } from "./pdf-assets";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const port = Number(env.VITE_DATA_PORT || 4171);
  const origin = env.VITE_DATA_ORIGIN || `http://localhost:${port}`;
  const base = env.VITE_DATA_BASE || "/";
  const commEntry =
    env.VITE_COMM_ENTRY ||
    (mode === "production" ? "/comm/comm.js" : "http://localhost:4172/comm.js");
  return {
    base,
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    plugins: [
      pdfAssets(),
      react(),
      mfFastRefreshCompat(),
      appVersion(),
      federation({
        name: "data",
        filename: "data.js",
        exposes: {
          "./theme": "./src/theme.ts",
          "./dataset-editor": "./src/dataset-editor.ts",
          "./query-controls": "./src/query-controls.ts",
          "./metric-preview": "./src/metric-preview.ts",
          "./board-preview": "./src/board-preview.ts",
          "./report-preview": "./src/report-preview.ts",
        },
        remotes: {
          comm: {
            type: "module",
            name: "comm",
            entry: commEntry,
            entryGlobalName: "comm",
            shareScope: "default",
          },
        },
        shareStrategy: "loaded-first",
        manifest: { disableAssetsAnalyze: true },
        dev: { disableHotTypesReload: false },
        shared: {
          react: { singleton: true },
          "react/": { singleton: true },
          "react-dom": { singleton: true },
          "react-dom/": { singleton: true },
          "react-router-dom": { singleton: true },
          antd: { singleton: true },
          axios: { singleton: true },
        },
      }),
      cssInjectedByJsPlugin({ relativeCSSInjection: true }),
    ],
    server: {
      port,
      origin,
      watch: {
        ignored: [
          "**/dist/**",
          "**/*.d.ts",
          "**/@mf-types/**",
          "**/node_modules/.federation/**",
        ],
      },
      proxy: {
        "/api": {
          target: "https://xmhis.top:30101",
          changeOrigin: true,
          secure: false,
        },
        "/ai": {
          target: "https://xmhis.top:30101",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: { target: "esnext" },
  };
});
