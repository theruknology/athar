import { useQuery } from "@tanstack/react-query";
import { Badge, type BadgeTone } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton, SkeletonTiles } from "../components/ui/Skeleton";
import { StatTile } from "../components/ui/StatTile";
import { formatInt } from "../lib/format";

/**
 * Real-export panel. The synthetic estate is graded against ground truth the
 * generator itself wrote, so precision/recall there is a pipeline-recovery check,
 * not an accuracy claim (see Evaluation). This page runs the SAME normaliser and
 * rule engine over a REAL `aws iam get-account-authorization-details` export, which
 * has no ground truth — so it reports what fired, not a self-graded score. The data
 * is produced offline by `real_exports/build_panel_json.py` and served as a static
 * asset; nothing here touches the live estate or its database.
 */
interface RuleRow {
  rule_id: string;
  name: string;
  severity: string;
  count: number;
}
interface Sample {
  rule_id: string;
  name: string;
}
interface TopPrincipal {
  name: string;
  score: number;
  blast_radius_pct: number;
  rules: string[];
}
interface RealExport {
  source: string;
  generated_at: string;
  file_bytes: number;
  principals: number;
  grants: number;
  unmapped_actions: number;
  actions_referenced: number;
  coverage_pct: number;
  coverage_before_pct: number;
  privileged_principals: number;
  privileged_grants: number;
  max_blast_radius_pct: number;
  grants_by_category: Record<string, number>;
  grants_by_verb: Record<string, number>;
  top_principals: TopPrincipal[];
  findings_total: number;
  identities_flagged: number;
  by_severity: Record<string, number>;
  rules: RuleRow[];
  samples: Sample[];
  r7_real: number;
  r7_synthetic: number;
}

const SEVERITY_TONE: Record<string, BadgeTone> = {
  Critical: "danger",
  High: "warn",
  Medium: "info",
  Low: "neutral",
};

/** Horizontal share bars. No chart library: this is a ranked list with a length cue. */
function Distribution({ counts, total }: { counts: Record<string, number>; total: number }) {
  const rows = Object.entries(counts).sort(([, a], [, b]) => b - a);
  const largest = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <div className="flex flex-col gap-2">
      {rows.map(([label, count]) => (
        <div key={label} className="grid grid-cols-[7rem_1fr_4.5rem] items-center gap-3">
          <span className="truncate text-[13px] capitalize text-fg">{label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-surface-2">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${Math.max(2, (count / largest) * 100)}%` }}
            />
          </span>
          <span className="tabular text-right text-[13px] text-fg-muted">
            {formatInt(count)}
            <span className="ml-1 text-[11px] text-fg-faint">
              {total > 0 ? `${Math.round((count / total) * 100)}%` : "—"}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

async function getRealExport(): Promise<RealExport> {
  const res = await fetch(`${import.meta.env.BASE_URL}real-export.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`real-export.json: ${res.status}`);
  return (await res.json()) as RealExport;
}

export function RealExportPage() {
  const query = useQuery({ queryKey: ["real-export"], queryFn: getRealExport });
  const data = query.data;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Real export"
        description="The same normaliser and rule engine, run over a real AWS get-account-authorization-details export instead of the synthetic estate. Real data has no ground truth, so this reports what fired — not a precision/recall score."
        meta={
          data && (
            <>
              <Badge tone="accent">Real AWS IAM export</Badge>
              <Badge tone="neutral" title="Where this export came from">
                Cloudsplaining fixture (sanitised)
              </Badge>
            </>
          )
        }
      />

      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      {query.isPending && (
        <>
          <SkeletonTiles />
          <Skeleton lines={6} />
        </>
      )}

      {data && (
        <>
          <p className="rounded-lg border border-ok/40 bg-ok-soft px-3 py-2 text-[13px] leading-6 text-fg">
            Ran ATHAR&rsquo;s pipeline over a <span className="font-semibold">real</span> AWS export
            ({formatInt(data.principals)} principals, {formatInt(data.grants)} canonical grants). Because
            there is no simulator to grade against, there is no self-graded 1.00 here &mdash; only the
            findings, checkable against the export&rsquo;s own genuinely over-privileged principals.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Action coverage"
              value={`${data.coverage_pct}%`}
              hint={`${formatInt(data.actions_referenced)} actions referenced, ${formatInt(data.unmapped_actions)} unmapped — was ${data.coverage_before_pct}%`}
              tone={data.coverage_pct >= 99 ? "ok" : "warn"}
            />
            <StatTile
              label="Findings"
              value={formatInt(data.findings_total)}
              hint={`across ${formatInt(data.identities_flagged)} of ${formatInt(data.principals)} real principals`}
            />
            <StatTile
              label="Privileged principals"
              value={formatInt(data.privileged_principals)}
              hint={`${formatInt(data.privileged_grants)} control-plane grants at project scope or above`}
              tone="danger"
            />
            <StatTile
              label="R7 on real data"
              value={`${formatInt(data.r7_real)} vs ${formatInt(data.r7_synthetic)}`}
              hint="Peer outlier: fires on real data, never on the synthetic estate"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              title="Where the privilege sits"
              subtitle="Canonical grants by service category — the shape of a real account, not a generated one"
            >
              <Distribution counts={data.grants_by_category} total={data.grants} />
            </Card>
            <Card title="What those grants do" subtitle="Canonical verbs across the same grants">
              <Distribution counts={data.grants_by_verb} total={data.grants} />
            </Card>
          </div>

          <Card
            title="Worst principals by measured blast radius"
            subtitle="Scored by the same formula the product uses on the synthetic estate — on real ARNs"
            flush
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-fg-muted">
                    <th className="px-3 py-2 font-medium">Principal</th>
                    <th className="px-3 py-2 text-right font-medium">Score</th>
                    <th className="px-3 py-2 text-right font-medium">Blast radius</th>
                    <th className="px-3 py-2 font-medium">Rules fired</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_principals.map((p) => (
                    <tr key={p.name} className="border-b border-border/50">
                      <td className="px-3 py-2 font-mono text-[12px]">{p.name}</td>
                      <td className="tabular px-3 py-2 text-right">{p.score}</td>
                      <td className="tabular px-3 py-2 text-right">{p.blast_radius_pct}%</td>
                      <td className="px-3 py-2">
                        <span className="flex flex-wrap gap-1">
                          {p.rules.map((r) => (
                            <Badge key={r} tone="neutral" mono>
                              {r}
                            </Badge>
                          ))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title="What fired"
            subtitle="One row per rule that produced a finding on the real export"
            flush
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-fg-muted">
                    <th className="px-3 py-2 font-medium">Rule</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Severity</th>
                    <th className="px-3 py-2 text-right font-medium">Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rules.map((r) => (
                    <tr key={r.rule_id} className="border-b border-border/50">
                      <td className="px-3 py-2 font-mono">{r.rule_id}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">
                        <Badge tone={SEVERITY_TONE[r.severity] ?? "neutral"}>{r.severity}</Badge>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatInt(r.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title="Sample high-risk principals"
            subtitle="Real ARNs from the export — genuinely administrative or escalation-capable"
            flush
          >
            <div className="flex flex-wrap gap-2 p-3">
              {data.samples.map((s) => (
                <Badge key={`${s.rule_id}:${s.name}`} tone="warn" mono title={s.rule_id}>
                  {s.name}
                </Badge>
              ))}
            </div>
          </Card>

          <p className="text-[12px] leading-5 text-fg-muted">
            Coverage moved from {data.coverage_before_pct}% to {data.coverage_pct}% when the service
            catalogue was derived from the published AWS, Azure and GCP permission surfaces rather
            than hand-written — {formatInt(data.unmapped_actions)} of{" "}
            {formatInt(data.actions_referenced)} referenced actions are now unmapped. R0 still fires
            where an action maps to no canonical verb, and R10 fires on every principal only because
            no HR/ownership feed was supplied here (<code>hr=None</code>). Source: {data.source}.
          </p>
        </>
      )}
    </div>
  );
}
