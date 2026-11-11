/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COMM_PORT?: string;
  readonly VITE_COMM_ORIGIN?: string;
  readonly VITE_COMM_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
