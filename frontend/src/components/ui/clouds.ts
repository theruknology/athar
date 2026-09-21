import type { Cloud } from "../../api/types";

export type { Cloud };

export const CLOUDS: readonly Cloud[] = ["aws", "azure", "gcp"];

export const LABEL: Record<Cloud, string> = {
  aws: "AWS",
  azure: "Azure",
  gcp: "Google Cloud",
};

/**
 * Official provider marks, bundled under `public/logos/` rather than pulled from a CDN so the
 * dashboard renders with no network. Used nominatively to identify whose estate a row came
 * from; the marks remain the property of their respective owners.
 */
export const LOGO: Record<Cloud, string> = {
  aws: `${import.meta.env.BASE_URL}logos/aws.png`,
  azure: `${import.meta.env.BASE_URL}logos/azure.png`,
  gcp: `${import.meta.env.BASE_URL}logos/gcp.png`,
};

/** Brand colours, for accents beside the logo (bars, rings) — not for redrawing the mark. */
export const BRAND_COLOUR: Record<Cloud, string> = {
  aws: "#ff9900",
  azure: "#0089d6",
  gcp: "#4285f4",
};

export function isCloud(value: unknown): value is Cloud {
  return typeof value === "string" && (CLOUDS as readonly string[]).includes(value);
}

export function cloudLabel(cloud: string): string {
  return isCloud(cloud) ? LABEL[cloud] : cloud.toUpperCase();
}
