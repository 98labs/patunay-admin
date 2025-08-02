/// <reference types="vite/client" />
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_APP_ENV?: string
  readonly VITE_ENABLE_DEVTOOLS?: string
  readonly VITE_LOG_LEVEL?: string
  readonly VITE_ANALYTICS_ID?: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_NETWORK_TEST_ENDPOINT?: string
  readonly VITE_NETWORK_TEST_CORS_MODE?: 'cors' | 'no-cors' | 'same-origin'
  readonly VITE_NETWORK_TEST_USE_AUTH?: string
  readonly VITE_NETWORK_TEST_INTERVAL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}