/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WIDGET_PORT?: string;
  readonly VITE_WIDGET_ORIGIN?: string;
  readonly VITE_WIDGET_BASE?: string;
  readonly VITE_COMM_ENTRY?: string;
  readonly VITE_VISIT_ENTRY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
