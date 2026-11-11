import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { federation } from "@module-federation/vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { fileURLToPath } from "node:url";
import { mfFastRefreshCompat } from "../../vite-plugin-mf-fast-refresh";
import { appVersion } from "../../vite-plugin-app-version";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  const port = Number(env.VITE_WIDGET_PORT || 4186);
  const origin = env.VITE_WIDGET_ORIGIN || `http://localhost:${port}`;
  const base = env.VITE_WIDGET_BASE || "/";
  const commEntry = env.VITE_COMM_ENTRY || "http://localhost:4172/comm.js";
  const visitEntry = env.VITE_VISIT_ENTRY || "http://localhost:4176/visit.js";

  return {
    base,
    define: {
      "process.env.DRAGGABLE_DEBUG": "false",
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [
      react(),
      mfFastRefreshCompat(),
      appVersion(),
      tailwindcss(),
      federation({
        name: "widget",
        filename: "widget.js",
        exposes: {
          "./widget": "./src/expose.tsx",
          "./userHome": "./src/exposes/userHome.ts",
          "./visitHome": "./src/exposes/visitHome.ts",
        },
        remotes: {
          comm: {
            type: "module",
            name: "comm",
            entry: commEntry,
            entryGlobalName: "comm",
            shareScope: "default",
          },
          visit: {
            type: "module",
            name: "visit",
            entry: visitEntry,
            entryGlobalName: "visit",
            shareScope: "default",
          },
        },
        shareStrategy: "loaded-first",
        manifest: {
          // disableAssetsAnalyze: true,
        },
        dts: {
          consumeTypes: false,
        },
        dev: {
          // 三个开关必须一起开，dts-dev 才会直接 return，否则仍会挂 watcher 拉类型
          disableHotTypesReload: true,
          disableLiveReload: true,
          disableDynamicRemoteTypeHints: true,
        },
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
      },
    },
    build: {
      target: "esnext",
    },
  };
});
