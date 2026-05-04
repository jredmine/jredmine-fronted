/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 留空时使用当前站点源 + Vite 代理 */
  readonly VITE_API_BASE_URL?: string
  readonly VITE_APP_TITLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
