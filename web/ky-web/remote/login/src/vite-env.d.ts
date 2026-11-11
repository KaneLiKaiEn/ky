/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOGIN_PORT?: string;
  readonly VITE_LOGIN_ORIGIN?: string;
  readonly VITE_LOGIN_BASE?: string;
  readonly VITE_COMM_ENTRY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
