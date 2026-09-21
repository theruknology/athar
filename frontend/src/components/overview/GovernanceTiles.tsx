import type { GovernanceMetrics } from "../../api/types";
import { formatInt } from "../../lib/format";
import { StatTile } from "../ui/StatTile";

/**
 * The governance KPI row (SPEC §14 Overview).
 *
 * These replace an accuracy-flavoured headline. Precision/recall against the generator's own
 * ground truth is a pipeline-recovery check, not an accuracy claim, so a 1.00 on the landing page
 * is the least informative number in the product — it says the simulator and the normaliser agree.
 * What a governance team is actually asked for is the shape of privilege in the estate: how much
 * of it there is, how much of it is unprotected, how far the worst account reaches, and whether
 * the problem is concentrated enough to fix this week.
 *
 * Every tile links to the rows behind it, so none of them is a number you have to take on trust.
 */
export function GovernanceTiles({ metrics }: { metrics: GovernanceMetrics }) {
  const mfaGap = metrics.privileged_without_mfa;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label="Privileged identities"
        value={formatInt(metrics.privileged_identities)}
        hint={`${metrics.privileged_pct}% of the estate holds control-plane privilege`}
        tone="accent"
        to="/identities?sort=-score"
      />
      <StatTile
        label="MFA on privileged"
        value={`${metrics.mfa_coverage_pct}%`}
        hint={
          mfaGap > 0
            ? `${formatInt(mfaGap)} privileged ${mfaGap === 1 ? "human has" : "humans have"} no second factor`
            : "Every privileged human enforces a second factor"
        }
        tone={mfaGap > 0 ? "danger" : "ok"}
        to="/findings?rule=R9"
      />
      <StatTile
        label="Blast radius p90"
        value={`${metrics.blast_radius_p90_pct}%`}
        hint={`Worst single identity reaches ${metrics.blast_radius_max_pct}% of the estate`}
        tone="warn"
        to="/identities?sort=-score"
      />
      <StatTile
        label="Risk concentration"
        value={`${metrics.risk_concentration_pct}%`}
        hint="Share of all measured blast radius held by the top 5% of identities"
        to="/identities?sort=-score"
      />
    </div>
  );
}

/**
 * The second, quieter row: the specific populations a remediation plan gets written against.
 * Split from the headline tiles because these are counts to work through, not posture to report.
 */
export function GovernanceDetailTiles({ metrics }: { metrics: GovernanceMetrics }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label="Cross-cloud privileged"
        value={formatInt(metrics.cross_cloud_privileged)}
        hint="Privileged in two or more clouds — invisible to any single provider console"
        tone={metrics.cross_cloud_privileged > 0 ? "danger" : "ok"}
        to="/findings?rule=R4"
      />
      <StatTile
        label="Dormant privilege"
        value={formatInt(metrics.dormant_privileged)}
        hint="Privileged and departed or on leave — access that outlived its purpose"
        tone={metrics.dormant_privileged > 0 ? "warn" : "ok"}
        to="/findings?rule=R3"
      />
      <StatTile
        label="Escalation paths"
        value={formatInt(metrics.escalation_paths)}
        hint="Identities that can reach admin through a chain, not just directly"
        tone={metrics.escalation_paths > 0 ? "warn" : "ok"}
        to="/findings?rule=R5"
      />
      <StatTile
        label="Privileged grants"
        value={formatInt(metrics.privileged_grants)}
        hint="admin, grant or impersonate at project scope or above, across every cloud"
        to="/identities?sort=-score"
      />
    </div>
  );
}
