/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_HOST_PORT?: string;
  readonly VITE_COMM_ENTRY?: string;
  readonly VITE_WIDGET_ENTRY?: string;
  readonly VITE_LOGIN_ENTRY?: string;
  readonly VITE_SYSTEM_ENTRY?: string;
  readonly VITE_VISIT_ENTRY?: string;
  readonly VITE_INPATIENT_DOCTOR_STATION_ENTRY?: string;
  readonly VITE_QUALITY_CONTROL_ENTRY?: string;
  readonly VITE_TENCENT_ASR_SECRET_ID?: string;
  readonly VITE_TENCENT_ASR_SECRET_KEY?: string;
  /** 启动器下载目录，如 http://localhost:4001/downloads/agent */
  readonly VITE_AGENT_DOWNLOAD_BASE?: string;
  readonly [key: `VITE_${string}_ENTRY`]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
