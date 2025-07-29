/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_ANON_KEY: string
    // more env variables...
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {}