import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import { ease } from "./tour";

/**
 * Metric cards that fly in as objects, not as a screenshot of objects.
 *
 * A dashboard capture is evidence — it proves the product exists. It is a poor way to *land a
 * number*, because the number is 30px tall inside a 2000px page and the eye has to be told where
 * to go. These beats take the same values out of the UI and give each one the whole frame: a card
 * per number, in the product's own palette, arriving on a stagger so the row reads left to right
 * at the pace a sentence is spoken.
 *
 * Everything here is composed from the design tokens in `theme.ts`, which are the same tokens the
 * dashboard's CSS variables carry, so the cards are recognisably the product rather than a
 * marketing invention of it.
 */

export interface StatCard {
  /** Big number. Kept as a string so "100%", "35 → 0" and "507" all render identically. */
  value: string;
  label: string;
  note?: string;
  /** Accent used for the bottom bloom and the rim. Defaults to brand cyan. */
  tone?: string;
}

const RISE = 26;

/** A single card: rises, tilts upright, and lights its own floor. */
function Card({ card, at, index }: { card: StatCard; at: number; index: number }) {
  const frame = useCurrentFrame();
  const t = ease(frame, at, at + RISE);
  const tone = card.tone ?? C.cyan;

  // Each card keeps a slow, out-of-phase drift so a row of them never looks like a static image.
  const drift = Math.sin(frame / 62 + index * 1.7) * 3;
  const breathe = 0.5 + 0.5 * Math.sin(frame / 48 + index);

  return (
    <div
      style={{
        position: "relative",
        width: 360,
        height: 440,
        opacity: t,
        transform: `
          translateY(${interpolate(t, [0, 1], [150, 0]) + drift}px)
          rotateX(${interpolate(t, [0, 1], [18, 0])}deg)
          rotateY(${interpolate(t, [0, 1], [-10, 0])}deg)
          scale(${interpolate(t, [0, 1], [0.92, 1])})
        `,
        transformStyle: "preserve-3d",
      }}
    >
      {/* the bloom under the card — the inspo's signature move */}
      <div
        style={{
          position: "absolute",
          inset: "auto -14% -12% -14%",
          height: "48%",
          background: `radial-gradient(ellipse at center, ${tone}55, transparent 68%)`,
          filter: `blur(${34 + breathe * 10}px)`,
          opacity: t * (0.75 + breathe * 0.25),
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          borderRadius: 26,
          padding: "34px 30px",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(170deg, ${C.panel} 0%, ${C.panel2} 48%, ${tone}1f 100%)`,
          border: `1px solid ${tone}3d`,
          boxShadow: `0 40px 90px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08), 0 0 ${
            40 + breathe * 26
          }px ${tone}26`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            font: `500 14px/1 ${MONO}`,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: tone,
          }}
        >
          {card.label}
        </div>

        <div
          style={{
            marginTop: "auto",
            fontFamily: SANS,
            fontSize: card.value.length > 6 ? 62 : 82,
            fontWeight: 300,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: C.fg,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {card.value}
        </div>

        {card.note && (
          <div
            style={{
              marginTop: 16,
              font: `300 19px/1.45 ${SANS}`,
              color: C.muted,
            }}
          >
            {card.note}
          </div>
        )}

        {/* gradient floor inside the card, matching the inspo's lit base */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 6,
            background: `linear-gradient(90deg, transparent, ${tone}, transparent)`,
            opacity: 0.8 * t,
          }}
        />
      </div>
    </div>
  );
}

/** A row of metric cards, staggered so it reads at speaking pace. */
export const StatCards: React.FC<{
  cards: StatCard[];
  at?: number;
  stagger?: number;
  title?: string;
  kicker?: string;
}> = ({ cards, at = 10, stagger = 8, title, kicker }) => {
  const frame = useCurrentFrame();
  const titleP = ease(frame, at - 6, at + 12);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        perspective: 2200,
        fontFamily: SANS,
      }}
    >
      {(kicker || title) && (
        <div
          style={{
            textAlign: "center",
            marginBottom: 54,
            opacity: titleP,
            transform: `translateY(${(1 - titleP) * 16}px)`,
          }}
        >
          {kicker && (
            <div
              style={{
                font: `500 15px/1 ${MONO}`,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: C.cyan,
                marginBottom: 16,
              }}
            >
              {kicker}
            </div>
          )}
          {title && (
            <div style={{ fontSize: 44, fontWeight: 300, letterSpacing: "-0.02em", color: C.fg }}>
              {title}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 30, transformStyle: "preserve-3d" }}>
        {cards.map((card, i) => (
          <Card key={card.label} card={card} at={at + i * stagger} index={i} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
