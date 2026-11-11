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
  
  const port = Number(env.VITE_LOGIN_PORT || 4174);
  const origin = env.VITE_LOGIN_ORIGIN || `http://localhost:${port}`;
  const base = env.VITE_LOGIN_BASE || "/";
  const commEntry =
    env.VITE_COMM_ENTRY || "http://localhost:4172/comm.js";

  return {
    base,
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
        name: "login",
        filename: "login.js",
        exposes: {
          "./Login": "./src/expose.tsx",
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
        manifest: {
          disableAssetsAnalyze: true,
        },

        dev: {
          
          disableHotTypesReload: false,
          
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
        "/dev-api": {
          target: env.VITE_API_TARGET || "http://localhost:8080",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/dev-api/, ""),
        },
      },
    },
    build: {
      target: "esnext",
      
    },
  };
});
