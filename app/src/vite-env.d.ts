/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL của API thật - dùng ở phase 2, phase 1 để trống. */
  readonly VITE_BASE_API_URL?: string;
  /** "web" | "desktop" - giữ lại để tham chiếu khi nối bản Electron. */
  readonly VITE_APP_TARGET?: string;
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
