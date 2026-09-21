/**
 * The dashboard is a Vite app and reads `import.meta.env.BASE_URL` when resolving bundled
 * assets. The film bundles those same components with webpack, which has no `import.meta.env`,
 * so `remotion.config.ts` defines the value and this declares its type.
 */
interface ImportMetaEnv {
  readonly BASE_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
