import path from "node:path";
import { Config } from "@remotion/cli/config";
import webpack from "webpack";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
Config.setBrowserExecutable("/usr/bin/chromium");
Config.setChromiumOpenGlRenderer("angle");

Config.setDelayRenderTimeoutInMilliseconds(120000);

/**
 * The film renders the dashboard's own React components rather than screenshots of them, so the
 * bundler has to reach into the frontend workspace. Two things make that work:
 *
 *  - `@app/*` resolves to `frontend/src/*`, so a scene can import `@app/components/ui/StatTile`
 *    and get the exact component the product ships — no copy to drift out of date, and the output
 *    is vector-crisp at any zoom instead of a fixed-resolution PNG.
 *  - React must resolve to a single copy. The frontend has its own `node_modules/react`; letting
 *    both load would give two renderers and "invalid hook call" at render time.
 */
Config.overrideWebpackConfig((config) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    // The dashboard resolves its bundled logos against Vite's BASE_URL; under webpack that
    // expression does not exist, so pin it to the film's own asset root.
    new webpack.DefinePlugin({ "import.meta.env.BASE_URL": JSON.stringify("/") }),
    // `CloudIcon` imports `./clouds` relatively, so a request alias never matches it. Match the
    // raw request instead and narrow by the importing directory, so only the dashboard's own
    // module is swapped. The shim imports the original via `@app/...`, which does not match this
    // pattern — without that asymmetry the replacement would import itself.
    new webpack.NormalModuleReplacementPlugin(/^\.\/clouds$/, (result: { context: string; request: string }) => {
      if (result.context.replace(/\\/g, "/").endsWith("frontend/src/components/ui")) {
        result.request = path.resolve(process.cwd(), "src/shims/clouds.ts");
      }
    }),
  ],
  resolve: {
    ...config.resolve,
    alias: {
      ...config.resolve?.alias,
      "@app": path.resolve(process.cwd(), "../frontend/src"),
      // `$` makes these exact-match only, so deep imports such as `react-router/dom` still
      // resolve through normal lookup instead of being rewritten to a directory path.
      react$: path.resolve(process.cwd(), "node_modules/react"),
      "react-dom$": path.resolve(process.cwd(), "node_modules/react-dom"),
      // Same reasoning as React: the app components call `Link`, which reads router context.
      // Two copies of react-router mean two contexts, and the app's copy sees `null`.
      "react-router-dom$": path.resolve(process.cwd(), "node_modules/react-router-dom"),
      "react-router$": path.resolve(process.cwd(), "node_modules/react-router"),
    },
  },
}));
