import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { MemoryRouter } from "react-router-dom";
import { C } from "../theme";
import { ease } from "./tour";

/**
 * The dashboard, rendered live — not photographed.
 *
 * Earlier cuts composited PNGs of the UI. That caps quality at whatever resolution the capture
 * happened to be, and it makes every "highlight this card" move a coordinate-guessing exercise
 * against a flat image. Here the film imports the product's own React components through the
 * `@app/*` alias (see `remotion.config.ts`) and renders them into the frame. Three consequences,
 * all of them the point:
 *
 *   - it is vector-crisp at any zoom, because it is real DOM;
 *   - individual elements can animate — a card can rise, a row can slide, a number can count —
 *     which a screenshot can never do;
 *   - it cannot drift. Change the dashboard and the film changes with it on the next render.
 *
 * `Stage` supplies the three things app components assume and Remotion does not: the router they
 * call `Link` against, the app's CSS scope, and a fixed layout width so type scale is stable
 * regardless of the composition size.
 */
export const Stage: React.FC<{
  children: React.ReactNode;
  /** Layout width the app renders at, before any cinematic scaling. */
  width?: number;
  /** Scale applied to the whole surface — this is the "camera", and it stays crisp. */
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, width = 1600, scale = 1, className, style }) => (
  <MemoryRouter>
    <div
      className={`athar-surface ${className ?? ""}`}
      style={{
        width,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        borderRadius: 18,
        padding: 28,
        ...style,
      }}
    >
      {children}
    </div>
  </MemoryRouter>
);

/**
 * A browser-chrome frame that rises into shot, tilts upright and keeps a slow parallax drift.
 * Same cinematic treatment the screenshot version had, now wrapped around live DOM.
 */
export const LiveWindow: React.FC<{
  children: React.ReactNode;
  width?: number;
  height?: number;
  rise?: number;
  tilt?: number;
  /** Frames over which the window settles. */
  enter?: number;
  label?: string;
}> = ({
  children,
  width = 1700,
  /** Omit to let the window hug its content. */
  height,
  rise = 300,
  tilt = 15,
  enter = 38,
  label = "athar.gov · access governance",
}) => {
  const frame = useCurrentFrame();
  const ent = ease(frame, 0, enter);
  const ty = interpolate(ent, [0, 1], [rise, 0]);
  const sc = interpolate(ent, [0, 1], [0.93, 1]);
  const rx = interpolate(ent, [0, 1], [tilt, 0]) + Math.sin(frame / 105) * 0.6;
  const ry = Math.sin(frame / 135 + 1.2) * 1.2;
  const breathe = 0.5 + 0.5 * Math.sin(frame / 70);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 2400 }}>
      <div
        style={{
          position: "absolute",
          width: width * 1.15,
          height: (height ?? 700) * 1.2,
          background: "radial-gradient(ellipse at center, rgba(39,198,223,.12), transparent 62%)",
          filter: `blur(${60 + breathe * 14}px)`,
          opacity: ent * (0.55 + breathe * 0.25),
        }}
      />
      <div
        style={{
          transform: `translateY(${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`,
          transformStyle: "preserve-3d",
          opacity: ent,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: 26,
            boxShadow: `0 0 0 1px rgba(39,198,223,${0.16 + breathe * 0.09}), 0 0 46px rgba(39,198,223,${0.13 + breathe * 0.09})`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            width,
            height,
            borderRadius: 24,
            overflow: "hidden",
            border: `1px solid ${C.border2}`,
            background: "#0a0f14",
            boxShadow: "0 70px 170px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.10)",
            position: "relative",
          }}
        >
          <div
            style={{
              height: 38,
              background: "#0f1720",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "0 18px",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 11, height: 11, borderRadius: 999, background: "#2a3a48" }} />
            ))}
            <span style={{ marginLeft: 16, font: "400 14px/1 'Cascadia Mono',monospace", color: C.faint }}>
              {label}
            </span>
          </div>
          <div
            style={{
              height: height ? height - 38 : undefined,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Reveal a child on a stagger: rise, fade, settle.
 *
 * This is what live DOM buys over a screenshot — the panel does not appear all at once, it
 * assembles, so the eye is walked through it at the pace the narrator is speaking.
 */
export const Reveal: React.FC<{
  at: number;
  children: React.ReactNode;
  /** Vertical travel in px. */
  y?: number;
  dur?: number;
  style?: React.CSSProperties;
}> = ({ at, children, y = 28, dur = 20, style }) => {
  const frame = useCurrentFrame();
  const p = ease(frame, at, at + dur);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * y}px) scale(${interpolate(p, [0, 1], [0.985, 1])})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Halo a live element without drawing a box on top of it.
 *
 * The earlier outlined rectangle read as an annotation stuck over a picture. Because the UI is
 * real here, the emphasis can be a property *of* the element: it lifts slightly and lights its
 * own edge, the way the product's own focus state would.
 */
/** `#rrggbb` + alpha → `rgba(...)`, so glow strength can be animated without string surgery. */
function hexA(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

export const Focus: React.FC<{
  at: number;
  children: React.ReactNode;
  out?: number;
  tone?: string;
}> = ({ at, children, out, tone = C.cyan }) => {
  const frame = useCurrentFrame();
  const inP = ease(frame, at, at + 18);
  const outP = out ? ease(frame, out, out + 12) : 0;
  const p = inP * (1 - outP);
  const breathe = 0.5 + 0.5 * Math.sin(Math.max(0, frame - at) / 16);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        transform: `scale(${1 + 0.02 * p})`,
        // A rim plus a soft outer bloom. Deliberately restrained: the surrounding UI is dimmed
        // by `Dim`, so the focused element only has to be *not dimmed* to win the eye.
        boxShadow:
          p > 0.01
            ? `0 0 0 2px ${hexA(tone, 0.85 * p)}, 0 14px 44px ${hexA(tone, 0.28 * p)}, 0 0 ${18 + breathe * 14}px ${hexA(tone, 0.22 * p)}`
            : undefined,
        zIndex: p > 0.01 ? 2 : undefined,
      }}
    >
      {children}
    </div>
  );
};

/** Dim everything except the focused child — the spotlight, applied to live DOM. */
export const Dim: React.FC<{ at: number; children: React.ReactNode; amount?: number; out?: number }> = ({
  at,
  children,
  amount = 0.55,
  out,
}) => {
  const frame = useCurrentFrame();
  const inP = ease(frame, at, at + 18);
  const outP = out ? ease(frame, out, out + 12) : 0;
  const p = inP * (1 - outP);
  return (
    <div style={{ position: "relative" }}>
      {children}
      <AbsoluteFill
        style={{
          background: `rgba(6,10,14,${amount * p})`,
          pointerEvents: "none",
          borderRadius: 12,
        }}
      />
    </div>
  );
};
