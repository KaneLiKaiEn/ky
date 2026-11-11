import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { federation } from "@module-federation/vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const mockSession: Plugin = {
  name: "smoke-session-read",
  configureServer(server) {
    install(server.middlewares);
  },
  configurePreviewServer(server) {
    install(server.middlewares);
  },
};

function install(middlewares: ViteDevServer["middlewares"]) {
  middlewares.use("/api/auth/GetSessionInfo", (request, response) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      const { session_id } = JSON.parse(body);
      response.setHeader("Content-Type", "application/json");
      response.end(
        JSON.stringify({
          code: 0,
          session_info: {
            org_id: session_id === "comm-smoke-next" ? 202 : 101,
            user_id: 7,
          },
        }),
      );
    });
  });
}

export default defineConfig({
  root,
  plugins: [
    mockSession,
    federation({
      name: "comm-smoke",
      remotes: {
        comm: {
          type: "module",
          name: "comm",
          entryGlobalName: "comm",
          shareScope: "default",
          entry:
            process.env.COMM_SMOKE_ENTRY ||
            "http://127.0.0.1:4272/comm/comm.js",
        },
      },
      dts: false,
      shareStrategy: "loaded-first",
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
  resolve: { dedupe: ["react", "react-dom", "react-router-dom", "antd"] },
  server: { host: "127.0.0.1", port: 4273, strictPort: true },
  preview: { host: "127.0.0.1", port: 4273, strictPort: true },
  build: {
    target: "esnext",
    outDir: "../../dist/federation-smoke",
    emptyOutDir: true,
  },
});
