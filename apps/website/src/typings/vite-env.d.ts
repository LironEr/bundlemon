/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUNDLEMON_SERVICE_URL: string;
  readonly VITE_GITHUB_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
