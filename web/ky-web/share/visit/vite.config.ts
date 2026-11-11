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

  const port = Number(env.VITE_VISIT_PORT || 4176);
  const origin = env.VITE_VISIT_ORIGIN || `http://localhost:${port}`;
  const base = env.VITE_VISIT_BASE || "/";
  const commEntry = env.VITE_COMM_ENTRY || "http://localhost:4172/comm.js";
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
        name: "visit",
        filename: "visit.js",
        exposes: {
          "./form": "./src/exposes/form.ts",
          "./inPatientList": "./src/exposes/inPatientList.ts",
          "./visitItem": "./src/exposes/visitItem.ts",
          "./visitInfo": "./src/exposes/visitInfo.ts",
          "./patientInfo": "./src/exposes/patientInfo.ts",
          "./insurancePanel": "./src/exposes/insurancePanel.ts",
          "./readCardHeader": "./src/exposes/readCardHeader.ts",
          "./readCardHeader2": "./src/exposes/readCardHeader2.ts",
          "./readCardHeaderWithoutQRcode":
            "./src/exposes/readCardHeaderWithoutQRcode.ts",
          "./reportExam": "./src/exposes/reportExam.ts",
          "./reportLab": "./src/exposes/reportLab.ts",
          "./reportPathology": "./src/exposes/reportPathology.ts",
          "./emrContent": "./src/exposes/emrContent.ts",
          "./batchEvaluate": "./src/exposes/batchEvaluate.ts",
          "./emrWorkspace": "./src/exposes/emrWorkspace.ts",
          "./emrPreview": "./src/exposes/emrPreview.ts",
          "./emrView": "./src/exposes/emrView.ts",
          "./printList": "./src/exposes/printList.ts",
          "./userMultipleList": "./src/exposes/userMultipleList.ts",
          "./emrDiscuss": "./src/exposes/emrDiscuss.ts",
          "./prepayDeposit": "./src/exposes/prepayDeposit.ts",
          "./prepayList": "./src/exposes/prepayList.ts",
          "./diagnosis": "./src/exposes/diagnosis.ts",
          "./clinicalPathwayExec": "./src/exposes/clinicalPathwayExec.ts",
          "./cohortDict": "./src/exposes/cohortDict.ts",
          "./emrTimeManagement": "./src/exposes/emrTimeManagement.ts",
          "./medrecordQuality": "./src/exposes/medrecordQuality.ts",
          "./diag-tcm": "./src/exposes/diagTcm.ts",
          "./allergyHistory": "./src/exposes/allergyHistory.ts",
          "./orderListTable": "./src/exposes/orderListTable.ts",
          "./orderAttatch": "./src/exposes/orderAttatch.ts",
          "./linkBill": "./src/exposes/linkBill.ts",
          "./guaranteeList": "./src/exposes/guaranteeList.ts",
          "./careRecord": "./src/exposes/careRecord.ts",
          "./nuringListTable": "./src/exposes/nuringListTable.ts",
          "./carePlanProblem": "./src/exposes/carePlanProblem.ts",
          "./assessmentTimeline": "./src/exposes/assessmentTimeline.ts",
          "./templateSaveForm": "./src/exposes/templateSaveForm.ts",
          "./temperatureSheet": "./src/exposes/temperatureSheet.ts",

          "./credit": "./src/exposes/credit.ts",
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
          // disableAssetsAnalyze: true,
        },
        dts: {
          consumeTypes: true,
        },
        dev: {
          // 三个开关必须一起开，dts-dev 才会直接 return，否则仍会挂 watcher 拉类型
          disableHotTypesReload: false,
          disableLiveReload: false,
          disableDynamicRemoteTypeHints: false,
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
