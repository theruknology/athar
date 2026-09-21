import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

import { CloudPosturePanel } from "@app/components/overview/CloudPosturePanel";
import { GovernanceDetailTiles, GovernanceTiles } from "@app/components/overview/GovernanceTiles";
import { Card } from "@app/components/ui/Card";
import { StatTile } from "@app/components/ui/StatTile";
import { formatInt, formatScore } from "@app/lib/format";
import type { EstateSummary } from "@app/api/types";

import summaryData from "../data/summary.json";
import { Dim, Focus, LiveWindow, Reveal, Stage } from "../components/live";
import { ease } from "../components/tour";
import { C } from "../theme";

/**
 * Scenes built from the dashboard's own components.
 *
 * Every number below comes from `src/data/summary.json`, which is a captured response from the
 * running API — so the film cannot quote a figure the product does not actually produce. The
 * components are the shipped ones, imported through the `@app/*` alias.
 */
const summary = summaryData as unknown as EstateSummary;

/** The four headline tiles, assembling one at a time. */
export const HeadlineTiles: React.FC<{ at?: number }> = ({ at = 10 }) => {
  const frame = useCurrentFrame();
  const tiles = [
    {
      label: "Identities",
      value: formatInt(summary.identity_count),
      hint: `${formatInt(summary.humans)} people · ${formatInt(summary.services)} service accounts`,
      tone: undefined,
    },
    {
      label: "Open findings",
      value: formatInt(summary.findings_total),
      hint: "All rules, current scan",
      tone: undefined,
    },
    {
      label: "Critical",
      value: formatInt(summary.findings_by_severity.Critical ?? 0),
      hint: "Act this week",
      tone: "danger" as const,
    },
    {
      label: "Median risk score",
      value: formatScore(summary.median_score),
      hint: "0–100, blast-radius weighted",
      tone: undefined,
    },
  ];

  // Only the first tile is haloed, and only after the row has finished assembling: a highlight
  // on everything is a highlight on nothing.
  const focusAt = at + 4 * 7 + 16;
  return (
    <LiveWindow rise={340} tilt={16}>
      <Stage width={1560} style={{ background: "transparent" }}>
        <Dim at={focusAt} amount={0.42}>
          <div className="grid grid-cols-4 gap-4">
            {tiles.map((t, i) => (
              <Reveal
                key={t.label}
                at={at + i * 7}
                y={36}
                // `Reveal` animates a transform, which opens a stacking context — so the focused
                // tile has to be lifted here, not inside `Focus`, or the dim overlay covers it.
                style={i === 0 ? { position: "relative", zIndex: 3 } : undefined}
              >
                {i === 0 ? (
                  <Focus at={focusAt} tone={C.cyan}>
                    <StatTile label={t.label} value={t.value} hint={t.hint} tone={t.tone} />
                  </Focus>
                ) : (
                  <StatTile label={t.label} value={t.value} hint={t.hint} tone={t.tone} />
                )}
              </Reveal>
            ))}
          </div>
        </Dim>
      </Stage>
    </LiveWindow>
  );
};

/** The privilege-posture panel, assembling tile by tile. */
export const PosturePanel: React.FC<{ at?: number }> = ({ at = 12 }) => (
  <LiveWindow rise={320} tilt={15}>
    <Stage width={1580} style={{ background: "transparent" }}>
      <Reveal at={at} y={20}>
        <Card
          title="Privilege posture"
          subtitle="How much control the estate hands out, how much of it is unprotected, and how far the worst account reaches"
        >
          <div className="flex flex-col gap-3">
            <Reveal at={at + 12} y={26}>
              <GovernanceTiles metrics={summary.governance} />
            </Reveal>
            <Reveal at={at + 30} y={26}>
              <GovernanceDetailTiles metrics={summary.governance} />
            </Reveal>
          </div>
        </Card>
      </Reveal>
    </Stage>
  </LiveWindow>
);

/** The three provider cards, dealt left to right. */
export const CloudPanel: React.FC<{ at?: number }> = ({ at = 12 }) => {
  const frame = useCurrentFrame();
  return (
    <LiveWindow rise={320} tilt={15}>
      <Stage width={1560} style={{ background: "transparent" }}>
        <Reveal at={at} y={20}>
          <Card
            title="Clouds"
            subtitle="One card per provider — status is derived from the exports ingested, never configured"
          >
            {/* One panel per provider so each can be dealt in on its own beat. The panel lays
                its rows out in a three-column grid, so a single-row panel would render a
                one-third-width card; `[&>div]:!grid-cols-1` collapses that inner grid to one
                column and lets the card fill the slot this row gives it. */}
            <div className="grid gap-3 lg:grid-cols-3">
              {summary.clouds.map((row, i) => {
                const p = ease(frame, at + 14 + i * 9, at + 34 + i * 9);
                return (
                  <div
                    key={row.cloud}
                    className="[&>div]:!grid-cols-1"
                    style={{
                      opacity: p,
                      transform: `translateY(${(1 - p) * 30}px) scale(${0.97 + p * 0.03})`,
                    }}
                  >
                    <CloudPosturePanel rows={[row]} />
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>
      </Stage>
    </LiveWindow>
  );
};

/** Department cards with the "Never" half-life — the root-cause beat. */
export const Departments: React.FC<{ at?: number }> = ({ at = 12 }) => {
  const frame = useCurrentFrame();
  const rows = summary.findings_by_department.slice(0, 6);
  return (
    <LiveWindow rise={320} tilt={15}>
      <Stage width={1500} style={{ background: "transparent" }}>
        <Reveal at={at} y={20}>
          <Card
            title="Departments"
            subtitle="Findings and how long a permission survives after it stops being needed"
          >
            <div className="grid grid-cols-2 gap-3">
              {rows.map((row, i) => {
                const p = ease(frame, at + 12 + i * 6, at + 30 + i * 6);
                const never = row.offboarding_half_life === null;
                return (
                  <div
                    key={row.department}
                    style={{ opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}
                  >
                    <div className="rounded-md border border-border bg-surface px-4 py-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[15px] font-medium text-fg">{row.department}</span>
                        <span className="text-[13px] text-fg-muted">
                          {formatInt(row.identities)} identities
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[13px]">
                        <span className="text-fg-muted">Offboarding half-life:</span>
                        <span
                          className="font-semibold"
                          style={{ color: never ? "var(--danger)" : "var(--fg)" }}
                        >
                          {never ? "Never" : `${row.offboarding_half_life} months`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>
      </Stage>
    </LiveWindow>
  );
};

/** A single number, given the whole frame. Used where a card row would be too busy. */
export const BigNumber: React.FC<{
  value: string;
  label: string;
  note?: string;
  at?: number;
  tone?: string;
}> = ({ value, label, note, at = 8, tone = C.cyan }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, at, at + 22);
  const n = ease(frame, at + 6, at + 30);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", opacity: p }}>
        <div
          style={{
            font: `500 16px/1 "Cascadia Mono",monospace`,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: tone,
            marginBottom: 26,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 190,
            fontWeight: 200,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: C.fg,
            transform: `scale(${0.94 + n * 0.06})`,
            textShadow: `0 0 90px ${tone}55`,
          }}
        >
          {value}
        </div>
        {note && (
          <div
            style={{
              marginTop: 30,
              fontSize: 27,
              fontWeight: 300,
              color: C.muted,
              maxWidth: 1100,
            }}
          >
            {note}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
