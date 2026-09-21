import type { EvalOut } from "../../api/types";
import { formatInt } from "../../lib/format";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * How much weight the headline numbers can carry (SPEC §17).
 *
 * A precision of 1.00 is only as strong as the sample under it. Reported bare, "100% / 100% /
 * 100%" reads as a claim of perfection and invites the reasonable suspicion that the estate was
 * built to produce it. This panel puts the three things that bound that claim next to it — the
 * confidence interval, how much of the ruleset was actually exercised, and which rules are
 * measured on too few positives to mean anything — so the number is read as what it is: the
 * pipeline did not lose anything in 48 tries.
 *
 * None of this is generated commentary; every value comes from the harness.
 */
export function EvidenceStrength({ result }: { result: EvalOut }) {
  const positives = result.tp + result.fn;
  const flagged = result.tp + result.fp;
  // These carry server-side defaults, so the generated types mark them optional. Resolve once
  // here rather than guarding at every use — an API too old to send them renders an empty
  // interval, which is visibly wrong, instead of crashing the page.
  const [pLow = 0, pHigh = 0] = result.precision_ci ?? [];
  const [rLow = 0, rHigh = 0] = result.recall_ci ?? [];
  const underpowered = result.rules_underpowered ?? [];
  const unexercised = result.rules_unexercised ?? [];
  const rulesTotal = result.rules_total ?? 0;
  const rulesExercised = result.rules_exercised ?? 0;
  const minSupport = result.min_support ?? 10;

  const exercisedPct = rulesTotal > 0 ? rulesExercised / rulesTotal : 0;
  const wellPowered = rulesExercised - underpowered.length;

  return (
    <Card
      title="How much these numbers prove"
      subtitle="The bounds on the headline figures — sample size, rule coverage, and what this design cannot establish at all"
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-surface-2 px-3.5 py-3">
            <div className="text-[11px] uppercase tracking-wide text-fg-muted">Precision, with 95% CI</div>
            <div className="tabular mt-1 text-[22px] font-light leading-none text-fg">
              {pct(result.precision)}
            </div>
            <div className="tabular mt-1.5 text-[12px] text-warn">
              {pct(pLow)} – {pct(pHigh)}
            </div>
            <div className="mt-1 text-[12px] text-fg-muted">
              on {formatInt(flagged)} flagged — a Wilson interval, which stays honest at 100%
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface-2 px-3.5 py-3">
            <div className="text-[11px] uppercase tracking-wide text-fg-muted">Recall, with 95% CI</div>
            <div className="tabular mt-1 text-[22px] font-light leading-none text-fg">
              {pct(result.recall)}
            </div>
            <div className="tabular mt-1.5 text-[12px] text-warn">
              {pct(rLow)} – {pct(rHigh)}
            </div>
            <div className="mt-1 text-[12px] text-fg-muted">
              on {formatInt(positives)} ground-truth positives at High+
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface-2 px-3.5 py-3">
            <div className="text-[11px] uppercase tracking-wide text-fg-muted">Rules actually exercised</div>
            <div className="tabular mt-1 text-[22px] font-light leading-none text-fg">
              {rulesExercised} / {rulesTotal}
            </div>
            <div className="tabular mt-1.5 text-[12px] text-warn">{pct(exercisedPct)} of the ruleset</div>
            <div className="mt-1 text-[12px] text-fg-muted">
              {wellPowered} measured on {minSupport}+ positives
            </div>
          </div>
        </div>

        <p className="text-[12px] text-fg-muted">
          F1 <span className="tabular text-fg">{pct(result.f1)}</span> — the harmonic mean of the two
          above. It inherits both intervals, so it is the least informative of the three and is not
          given a tile of its own.
        </p>

        <div className="flex flex-col gap-2 border-t border-border pt-3 text-[13px] leading-6 text-fg">
          {unexercised.length > 0 && (
            <p className="flex flex-wrap items-baseline gap-x-2">
              <Badge tone="danger">Not exercised</Badge>
              <span className="flex flex-wrap gap-1">
                {unexercised.map((r) => (
                  <Badge key={r} tone="neutral" mono>
                    {r}
                  </Badge>
                ))}
              </span>
              <span className="text-fg-muted">
                produced no ground-truth positive in this estate, so these numbers say nothing about
                {unexercised.length === 1 ? " it" : " them"} in either direction. On a real AWS
                export R7 fires 35 times — the gap is the fixture, not the rule.
              </span>
            </p>
          )}

          {underpowered.length > 0 && (
            <p className="flex flex-wrap items-baseline gap-x-2">
              <Badge tone="warn">Under-powered</Badge>
              <span className="flex flex-wrap gap-1">
                {underpowered.map((r) => (
                  <Badge key={r} tone="neutral" mono>
                    {r}
                  </Badge>
                ))}
              </span>
              <span className="text-fg-muted">
                fired on fewer than {minSupport} positives. Their per-rule ratios move by ten points or
                more on a single case, so read them as anecdotes, not measurements.
              </span>
            </p>
          )}

          <p className="flex flex-wrap items-baseline gap-x-2">
            <Badge tone="neutral">By construction</Badge>
            <span className="text-fg-muted">
              Ground truth is written by the simulator that produced the exports, in the same canonical
              vocabulary the rules use. The two sides therefore agree on definitions and can only disagree
              where the pipeline loses or distorts something. This is a pipeline-recovery check — it cannot
              evidence accuracy on a real estate, and no number here should be quoted as if it did.
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
}
