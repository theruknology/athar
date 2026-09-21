/**
 * Provider-logo paths, resolved for the film instead of for the browser app.
 *
 * The dashboard builds these from Vite's `import.meta.env.BASE_URL`, which assumes an HTTP root
 * that Remotion's bundle does not have — the logos came out as broken images. Remotion resolves
 * bundled assets through `staticFile()`, so `remotion.config.ts` aliases
 * `@app/components/ui/clouds` to this module: same exports, same names, only `LOGO` differs.
 *
 * Everything else is re-exported from the real module so there is exactly one definition of the
 * cloud list, the labels and the brand colours.
 */
import { staticFile } from "remotion";

export { BRAND_COLOUR, CLOUDS, LABEL, cloudLabel, isCloud } from "@app/components/ui/clouds";
export type { Cloud } from "@app/components/ui/clouds";

import type { Cloud } from "@app/components/ui/clouds";

export const LOGO: Record<Cloud, string> = {
  aws: staticFile("logos/aws.png"),
  azure: staticFile("logos/azure.png"),
  gcp: staticFile("logos/gcp.png"),
};
