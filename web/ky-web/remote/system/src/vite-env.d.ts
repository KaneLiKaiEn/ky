/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SYSTEM_PORT?: string;
  readonly VITE_SYSTEM_ORIGIN?: string;
  readonly VITE_SYSTEM_BASE?: string;
  readonly VITE_COMM_ENTRY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
