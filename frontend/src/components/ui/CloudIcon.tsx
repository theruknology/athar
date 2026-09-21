import { cn } from "../../lib/cn";
import { cloudLabel, isCloud, LOGO } from "./clouds";

export interface CloudIconProps {
  cloud: string;
  size?: number;
  className?: string;
  /** Render the provider name next to the logo. */
  withLabel?: boolean;
}

/**
 * Provider logo (SPEC §14). The official AWS, Azure and Google Cloud marks, served from
 * `public/logos/` — no CDN, so the dashboard still renders on an air-gapped demo machine.
 *
 * Used nominatively to identify whose estate a row came from; the marks remain the property of
 * their owners. An unrecognised cloud falls back to a neutral monogram rather than a broken
 * image, because `cloud` reaches here straight from a query string.
 */
export function CloudIcon({ cloud, size = 18, className, withLabel = false }: CloudIconProps) {
  const key = cloud.toLowerCase();
  const label = cloudLabel(key);

  return (
    <span className={cn("inline-flex items-center gap-1.5 align-middle", className)}>
      {isCloud(key) ? (
        <img
          src={LOGO[key]}
          alt={label}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="shrink-0 object-contain"
          style={{ width: size, height: size }}
        />
      ) : (
        <svg role="img" aria-label={label} width={size} height={size} viewBox="0 0 20 20">
          <title>{label}</title>
          <rect width="20" height="20" rx="4" fill="var(--border-strong)" />
          <text
            x="10"
            y="10.5"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontWeight="700"
            fontSize={11}
            fill="var(--fg)"
          >
            ?
          </text>
        </svg>
      )}
      {withLabel && <span className="text-xs text-fg-muted">{label}</span>}
    </span>
  );
}

/** Compact row of provider logos for table cells. */
export function CloudIcons({ clouds, size = 16 }: { clouds: readonly string[]; size?: number }) {
  if (clouds.length === 0) return <span className="text-fg-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      {clouds.map((c) => (
        <CloudIcon key={c} cloud={c} size={size} />
      ))}
    </span>
  );
}
