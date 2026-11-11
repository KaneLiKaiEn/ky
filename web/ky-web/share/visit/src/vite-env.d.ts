/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VISIT_PORT?: string;
  readonly VITE_VISIT_ORIGIN?: string;
  readonly VITE_VISIT_BASE?: string;
  readonly VITE_COMM_ENTRY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
