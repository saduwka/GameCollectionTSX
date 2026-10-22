/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAWG_PROXY_URL: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
