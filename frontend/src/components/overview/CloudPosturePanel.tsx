import { Link } from "react-router-dom";
import type { CloudPosture } from "../../api/types";
import { formatInt } from "../../lib/format";
import { Badge, type BadgeTone } from "../ui/Badge";
import { CloudIcon } from "../ui/CloudIcon";

const STATUS: Record<CloudPosture["status"], { tone: BadgeTone; label: string; title: string }> = {
  current: {
    tone: "ok",
    label: "Current",
    title: "Grants in this cloud are from the snapshot month being viewed",
  },
  stale: {
    tone: "warn",
    label: "Stale",
    title: "The newest grant here predates the snapshot month — this cloud was not re-exported",
  },
  absent: {
    tone: "neutral",
    label: "No data",
    title: "No export has been ingested for this cloud",
  },
};

/** A metric and its evidence link; the unit is separated so the number stays scannable. */
function Metric({
  label,
  value,
  unit,
  tone,
  to,
  title,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "danger" | "warn";
  to?: string;
  title?: string;
}) {
  const colour = tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-fg";
  const body = (
    <>
      <dt className="text-[11px] uppercase tracking-wide text-fg-muted">{label}</dt>
      <dd className={`tabular text-lg font-light leading-none ${colour}`}>
        {value}
        {unit && <span className="ml-0.5 text-[11px] text-fg-muted">{unit}</span>}
      </dd>
    </>
  );
  return to ? (
    <Link
      to={to}
      title={title}
      className="flex flex-col gap-1 rounded-sm transition-colors hover:text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      {body}
    </Link>
  ) : (
    <div className="flex flex-col gap-1" title={title}>
      {body}
    </div>
  );
}

/**
 * Per-provider posture (SPEC §14 Overview).
 *
 * The point of the panel is that "multi-cloud" is a claim ATHAR has to *show*: one card per
 * provider, each carrying the same five numbers so they can be compared at a glance, and a status
 * that is derived from the data rather than configured. A cloud nobody exported says "No data"
 * instead of quietly rendering zeros that read like a clean bill of health.
 */
export function CloudPosturePanel({ rows }: { rows: CloudPosture[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => {
        const status = STATUS[row.status];
        const empty = row.status === "absent";
        return (
          <div
            key={row.cloud}
            data-region={`cloud-${row.cloud}`}
            className={`flex flex-col gap-3 rounded-md border bg-surface p-4 shadow-card ${
              empty ? "border-dashed border-border opacity-70" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <CloudIcon cloud={row.cloud} size={20} />
                <span className="text-sm font-semibold uppercase tracking-wide text-fg">{row.cloud}</span>
              </span>
              <Badge tone={status.tone} title={status.title}>
                {status.label}
              </Badge>
            </div>

            {empty ? (
              <p className="text-[13px] leading-5 text-fg-muted">
                No export ingested. ATHAR reports on the clouds it has actually been given —
                it does not assume a provider is clean because it is missing.
              </p>
            ) : (
              <>
                <dl className="grid grid-cols-3 gap-y-3">
                  <Metric
                    label="Identities"
                    value={formatInt(row.identities)}
                    to={`/identities?cloud=${row.cloud}`}
                    title={`${formatInt(row.principals)} principals resolve to these identities`}
                  />
                  <Metric
                    label="Grants"
                    value={formatInt(row.grants)}
                    title="Active canonical grants — open the identities that hold them"
                    to={`/identities?cloud=${row.cloud}`}
                  />
                  <Metric
                    label="Findings"
                    value={formatInt(row.findings)}
                    to={`/findings?cloud=${row.cloud}`}
                  />
                  <Metric
                    label="Critical"
                    value={formatInt(row.critical)}
                    tone={row.critical > 0 ? "danger" : undefined}
                    to={`/findings?cloud=${row.cloud}&severity=Critical`}
                  />
                  <Metric
                    label="Privileged"
                    value={formatInt(row.privileged)}
                    title="Identities holding admin, grant or impersonate at project scope or above here"
                    to={`/identities?cloud=${row.cloud}&sort=-score`}
                  />
                  <Metric
                    label="No MFA"
                    value={formatInt(row.privileged_without_mfa)}
                    tone={row.privileged_without_mfa > 0 ? "danger" : undefined}
                    title="Privileged humans here with no MFA enforced"
                    to={`/findings?cloud=${row.cloud}&rule=R9`}
                  />
                </dl>
                <Link
                  to={`/identities?cloud=${row.cloud}&sort=-score`}
                  title="The identities holding control-plane privilege in this cloud"
                  className="border-t border-border pt-2 text-[12px] text-fg-muted transition-colors hover:text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {formatInt(row.privileged_grants)} privileged grants (project scope or above)
                  {row.last_grant_month_label && ` · newest ${row.last_grant_month_label}`}
                </Link>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
