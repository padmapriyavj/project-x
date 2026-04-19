/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** Optional override when generating types from a running FastAPI instance. */
  readonly VITE_OPENAPI_URL?: string
  readonly VITE_ELEVENLABS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
