import { defineConfig, loadEnv } from "vite";
import { federation } from "@module-federation/vite";
import { fileURLToPath } from "node:url";
import { appVersion } from "../../vite-plugin-app-version";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  
  const port = Number(env.VITE_COMM_PORT || 4172);
  const origin = env.VITE_COMM_ORIGIN || `http://localhost:${port}`;
  const base = env.VITE_COMM_BASE || "/";

  return {
    base,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [
      appVersion(),
      federation({
        name: "comm",
        filename: "comm.js",
        exposes: {
          "./request": "./src/request.ts",
          "./session": "./src/session.ts",
          "./eventBus": "./src/eventBus.ts",
          "./theme": "./src/theme.ts",
          "./moduleContext": "./src/moduleContext.ts",
          "./navbarSlot": "./src/navbarSlot.ts",
          "./resource": "./src/resource.ts",
          "./management": "./src/management.ts",
          "./utils": "./src/utils.ts",
        },
        shareStrategy: "loaded-first",
        manifest: {
          disableAssetsAnalyze: true,
        },

        dev: {
          
          
        },
        shared: {
          react: { singleton: true },
          "react/": { singleton: true },
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
    },
    build: {
      target: "esnext",
    },
  };
});
