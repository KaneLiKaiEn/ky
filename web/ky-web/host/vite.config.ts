import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { federation } from "@module-federation/vite";
import { fileURLToPath } from "node:url";
import { mfFastRefreshCompat } from "../vite-plugin-mf-fast-refresh";
import { appVersion } from "../vite-plugin-app-version";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  const port = Number(env.VITE_HOST_PORT || 4173);
  const origin = env.VITE_HOST_ORIGIN || `http://localhost:${port}`;
  const base = "/";
  const commEntry = env.VITE_COMM_ENTRY || "http://localhost:4172/comm.js";
  const apiTarget = env.VITE_API_TARGET || "http://localhost:8080";

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
        name: "host_app",
        // version-first 会在 Host 初始化时拉取所有 remoteEntry；loaded-first 为按需加载
        shareStrategy: "loaded-first",
        // comm 作为构建期已知的共享 remote，固定注册
        remotes: {
          comm: {
            type: "module",
            name: "comm",
            entry: commEntry,
            entryGlobalName: "comm",
            shareScope: "default",
          },
        },
        // 避免启动时预加载 remote 模块；业务 remote 在运行时通过 registerRemotes 注册
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
          target: apiTarget,
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
