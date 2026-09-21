import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import REGIONS from "../regions.json";
import { C, MONO, SANS } from "../theme";

/* ============================================================ easing */
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const SWIFT = Easing.bezier(0.33, 1, 0.68, 1);

export const ease = (frame: number, from: number, to: number, a = 0, b = 1, curve = EXPO) =>
  interpolate(frame, [from, to], [a, b], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: curve,
  });

/** Smooth 0→1→0 bump, for flashes and sweeps. */
const bump = (p: number) => Math.sin(Math.max(0, Math.min(1, p)) * Math.PI);

/* ============================================================ shot
 * Scenes cross-dissolve. All the movement lives in the 3D stage, so the cut
 * itself stays soft — no blur-flash between beats.
 */
export const Shot: React.FC<{ children: React.ReactNode; f?: number }> = ({ children, f = 13 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = Math.min(ease(frame, 0, f), 1 - ease(frame, durationInFrames - f, durationInFrames));
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/* ============================================================ light FX */

/** Anamorphic lens flare that sweeps across frame. Use sparingly, on beats. */
export const Flare: React.FC<{ at: number; len?: number; y?: number; power?: number }> = ({
  at,
  len = 44,
  y = 40,
  power = 1,
}) => {
  const frame = useCurrentFrame();
  const p = (frame - at) / len;
  if (p <= 0 || p >= 1) return null;
  const o = bump(p) * power;
  const x = interpolate(p, [0, 1], [-12, 112]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 30, mixBlendMode: "screen" }}>
      <div
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: 1700,
          height: 5,
          transform: "translate(-50%,-50%)",
          background:
            "linear-gradient(90deg,transparent,rgba(120,230,255,.45) 34%,rgba(255,255,255,.92) 50%,rgba(120,230,255,.45) 66%,transparent)",
          filter: "blur(7px)",
          opacity: o * 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: 260,
          height: 260,
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(190,245,255,.42), transparent 66%)",
          filter: "blur(16px)",
          opacity: o,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${x + 9}%`,
          top: `${y}%`,
          width: 90,
          height: 90,
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(39,198,223,.34), transparent 70%)",
          filter: "blur(10px)",
          opacity: o * 0.8,
        }}
      />
    </AbsoluteFill>
  );
};

/** Specular sweep across the glass of the screen. */
const Sweep: React.FC<{ at: number; len?: number }> = ({ at, len = 44 }) => {
  const frame = useCurrentFrame();
  const p = (frame - at) / len;
  if (p <= 0 || p >= 1) return null;
  const x = interpolate(p, [0, 1], [-45, 145]);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 6 }}>
      <div
        style={{
          position: "absolute",
          top: "-25%",
          bottom: "-25%",
          left: `${x}%`,
          width: "26%",
          background: "linear-gradient(104deg,transparent,rgba(255,255,255,.13),transparent)",
          transform: "skewX(-13deg)",
          opacity: bump(p),
        }}
      />
    </div>
  );
};

/* ============================================================ screen (3D) */

/**
 * Named regions measured from the live DOM by `scripts/capture_shots.mjs`.
 *
 * The film used to carry hand-measured percentages for every highlight, which went stale the
 * moment a panel moved and put the box over the wrong thing. Now the capture writes real
 * `getBoundingClientRect()` boxes and the composition looks them up by name, so a layout change
 * re-measures itself on the next capture instead of silently mis-highlighting.
 */
type Box = { x: number; y: number; w: number; h: number };
type PageRegions = { page: { w: number; h: number } } & Record<string, Box | { w: number; h: number }>;

export type ShotName = keyof typeof REGIONS;

export function region(shot: string, name: string): Box | null {
  const page = (REGIONS as Record<string, PageRegions>)[shot];
  const box = page?.[name];
  if (!box || !("x" in box)) return null;
  return box as Box;
}

function pageAspect(shot: string): number {
  const page = (REGIONS as Record<string, PageRegions>)[shot]?.page;
  return page ? page.w / page.h : 1.6;
}

/** The browser window the shot is composited into. */
const FRAME_W = 1720;
const CHROME_H = 38;
const VIEW_H = 908;

export type Focus = { x: number; y: number; z: number };

/**
 * Camera that frames a named region.
 *
 * `fill` is how much of the window the region should occupy, so a wide panel and a small tile
 * both land at a sensible size without anyone tuning a zoom by hand.
 */
function cameraFor(shot: string, name: string, fill: number, maxZoom: number): Focus | null {
  const r = region(shot, name);
  if (!r) return null;
  const aspect = pageAspect(shot);
  const imgH = FRAME_W / aspect; // rendered height of the full-page image
  // Zoom needed to make the region fill `fill` of the window, whichever axis binds first.
  const zx = (100 / r.w) * fill;
  const zy = (((VIEW_H / imgH) * 100) / r.h) * fill;
  // Capped, because a small tile would otherwise compute a 4–7× zoom and fill the screen with
  // two words. The spotlight is what says "look here"; the camera only has to get close enough
  // that the surrounding panel is still legible as context.
  return { x: r.x, y: r.y, z: Math.max(1, Math.min(zx, zy, maxZoom)) };
}

export const Screen: React.FC<{
  /** Shot name; also the PNG under `public/shots/<shot>.png`. */
  shot: string;
  /** Region to open on. Omit to open on the whole page. */
  from?: Focus | string;
  /** Region to settle on. Omit to hold `from`. */
  to?: Focus | string;
  /** How much of the window a named region should fill (0–1). */
  fill?: number;
  /** Upper bound on the computed zoom; context matters more than size. */
  maxZoom?: number;
  move?: [number, number];
  /** Dim everything but this region, from this frame. */
  spot?: { region: string; at: number; out?: number };
  rise?: number;
  tilt?: number;
  sweep?: number;
  children?: React.ReactNode;
}> = ({
  shot,
  from,
  to,
  fill = 0.82,
  maxZoom = 1.75,
  move,
  spot,
  rise = 300,
  tilt = 15,
  sweep,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const aspect = pageAspect(shot);
  const imgH = FRAME_W / aspect;
  /** An image-space y% maps into window-space by this factor. Derived, never hardcoded. */
  const yMap = imgH / VIEW_H;

  const resolve = (f: Focus | string | undefined, fallback: Focus): Focus =>
    typeof f === "string" ? (cameraFor(shot, f, fill, maxZoom) ?? fallback) : (f ?? fallback);

  const wide: Focus = { x: 50, y: 50 / yMap, z: 1 };
  const a0 = resolve(from, wide);
  const b0 = resolve(to, a0);

  const [ma, mb] = move ?? [0, durationInFrames];
  const t = ease(frame, ma, mb);
  const z = interpolate(t, [0, 1], [a0.z, b0.z]);
  const ox = interpolate(t, [0, 1], [a0.x, b0.x]);
  const oy = interpolate(t, [0, 1], [a0.y, b0.y]);

  const ent = ease(frame, 0, 38);
  const ty = interpolate(ent, [0, 1], [rise, 0]);
  const sc = interpolate(ent, [0, 1], [0.93, 1]);
  const rx = interpolate(ent, [0, 1], [tilt, 0]) + Math.sin(frame / 105) * 0.7;
  const ry = Math.sin(frame / 135 + 1.2) * 1.5;
  const breathe = 0.5 + 0.5 * Math.sin(frame / 70);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", perspective: 2300 }}>
      <div
        style={{
          position: "absolute",
          width: 2000,
          height: 1200,
          background: "radial-gradient(ellipse at center, rgba(39,198,223,.10), transparent 62%)",
          filter: `blur(${60 + breathe * 14}px)`,
          opacity: ent * (0.55 + breathe * 0.25),
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 40,
          width: 1500,
          height: 150,
          background: "radial-gradient(ellipse at center, rgba(39,198,223,.20), transparent 70%)",
          filter: "blur(40px)",
          opacity: ent * 0.9,
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
            boxShadow: `0 0 0 1px rgba(39,198,223,${0.18 + breathe * 0.1}), 0 0 46px rgba(39,198,223,${0.14 + breathe * 0.1})`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            width: FRAME_W,
            height: VIEW_H + CHROME_H,
            borderRadius: 24,
            overflow: "hidden",
            border: `1px solid ${C.border2}`,
            background: "#0a0f14",
            boxShadow:
              "0 70px 170px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04), inset 0 1px 0 rgba(255,255,255,.10)",
            position: "relative",
          }}
        >
          <div
            style={{
              height: CHROME_H,
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
            <span style={{ marginLeft: 16, font: `400 14px/1 ${MONO}`, color: C.faint }}>
              athar.gov · access governance
            </span>
          </div>
          <div style={{ position: "relative", height: VIEW_H, overflow: "hidden" }}>
            <Img
              src={staticFile(`shots/${shot}.png`)}
              style={{
                width: "100%",
                display: "block",
                transform: `scale(${z})`,
                transformOrigin: `${ox}% ${oy}%`,
              }}
            />
            {spot && (
              <Spotlight
                box={region(shot, spot.region)}
                anchor={{ x: ox, y: oy }}
                z={z}
                yMap={yMap}
                at={spot.at}
                out={spot.out}
              />
            )}
          </div>
          <AbsoluteFill style={{ pointerEvents: "none", boxShadow: "inset 0 0 170px 44px rgba(6,10,14,.34)" }} />
          {sweep !== undefined && <Sweep at={sweep} />}
        </div>
      </div>
      {children}
    </AbsoluteFill>
  );
};

/**
 * Spotlight: dim the page, leave one region lit, ring it in brand light.
 *
 * This replaces an outlined rectangle that sat on top of the UI and read as a screenshot
 * annotation. Dimming everything else is how a viewer's eye is actually directed — the lit
 * region needs no border to be the only thing you look at, and the glow reads as the product's
 * own focus state rather than a marker drawn over it.
 */
const Spotlight: React.FC<{
  box: Box | null;
  anchor: { x: number; y: number };
  z: number;
  yMap: number;
  at: number;
  out?: number;
}> = ({ box, anchor, z, yMap, at, out }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!box) return null;

  const end = out ?? durationInFrames;
  const p = ease(frame, at, at + 20) * (1 - ease(frame, end - 12, end));
  if (p <= 0.001) return null;

  // Project an image-space box into window space: the image is scaled by `z` about `anchor`,
  // so a point's offset from the anchor scales with it.
  const left = 50 + (box.x - anchor.x) * z;
  const top = (anchor.y + (box.y - anchor.y) * z) * yMap;
  const w = box.w * z;
  const h = box.h * yMap * z;
  const pad = 0.8;
  const breathe = 1 + Math.sin(Math.max(0, frame - at) / 13) * 0.006;

  return (
    <div
      style={{
        position: "absolute",
        left: `${left}%`,
        top: `${top}%`,
        width: `${w + pad * 2}%`,
        height: `${h + pad * 2}%`,
        transform: `translate(-50%,-50%) scale(${interpolate(p, [0, 1], [1.04, 1]) * breathe})`,
        borderRadius: 14,
        // The dim is the highlight: one huge spread shadow darkens everything outside the box.
        boxShadow: `0 0 0 9999px rgba(5,9,13,${0.68 * p}),
                    0 0 0 1px rgba(39,198,223,${0.5 * p}),
                    0 0 60px rgba(39,198,223,${0.45 * p}),
                    inset 0 0 40px rgba(39,198,223,${0.10 * p})`,
        pointerEvents: "none",
      }}
    />
  );
};

/* ============================================================ kinetic text */

export const Kinetic: React.FC<{
  text: string;
  at?: number;
  stagger?: number;
  size?: number;
  weight?: number;
  color?: string;
  accent?: string[];
  style?: React.CSSProperties;
}> = ({ text, at = 0, stagger = 2.2, size = 44, weight = 300, color = C.fg, accent = [], style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: `0 ${size * 0.26}px`, fontFamily: SANS, ...style }}>
      {text.split(" ").map((w, i) => {
        const p = ease(frame, at + i * stagger, at + i * stagger + 16);
        const hot = accent.includes(w.replace(/[.,—]/g, ""));
        return (
          <span key={i} style={{ overflow: "hidden", display: "inline-block", paddingBottom: size * 0.1 }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * size * 0.95}px)`,
                opacity: p,
                fontSize: size,
                fontWeight: hot ? 500 : weight,
                letterSpacing: "-0.02em",
                color: hot ? C.cyan : color,
                lineHeight: 1.12,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export const Counter: React.FC<{ to: number; at?: number; len?: number; decimals?: number }> = ({
  to,
  at = 0,
  len = 26,
  decimals = 0,
}) => {
  const frame = useCurrentFrame();
  const v = ease(frame, at, at + len, 0, to);
  return <>{v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
};

/* ============================================================ captions */

export const Caption: React.FC<{
  kicker?: string;
  text: string;
  accent?: string[];
  at?: number;
  out?: number;
  pos?: "bl" | "tl" | "tr" | "br";
  size?: number;
}> = ({ kicker, text, accent = [], at = 8, out, pos = "bl", size = 33 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const end = out ?? durationInFrames - 10;
  const inP = ease(frame, at, at + 15);
  const outP = ease(frame, end - 10, end);
  const o = Math.min(inP, 1 - outP);
  const edge: React.CSSProperties =
    pos === "bl"
      ? { left: 108, bottom: 78 }
      : pos === "br"
        ? { right: 108, bottom: 78 }
        : pos === "tl"
          ? { left: 108, top: 84 }
          : { right: 108, top: 84 };

  const bracket = ease(frame, at, at + 12);
  const scan = ease(frame, at + 4, at + 22);
  const blink = Math.floor(frame / 15) % 2 === 0;
  const corner = (cx: "l" | "r", cy: "t" | "b"): React.CSSProperties => ({
    position: "absolute",
    width: 13,
    height: 13,
    [cy === "t" ? "top" : "bottom"]: -13,
    [cx === "l" ? "left" : "right"]: -18,
    borderTop: cy === "t" ? `1.5px solid ${C.cyan}` : "none",
    borderBottom: cy === "b" ? `1.5px solid ${C.cyan}` : "none",
    borderLeft: cx === "l" ? `1.5px solid ${C.cyan}` : "none",
    borderRight: cx === "r" ? `1.5px solid ${C.cyan}` : "none",
    opacity: bracket * 0.85,
    transform: `scale(${interpolate(bracket, [0, 1], [0.5, 1])})`,
  });

  return (
    <div
      style={{
        position: "absolute",
        ...edge,
        opacity: o,
        transform: `translateY(${(1 - inP) * 22 + outP * -14}px)`,
        maxWidth: 980,
        zIndex: 20,
        padding: "14px 22px",
      }}
    >
      <div style={{ position: "relative" }}>
        <div style={corner("l", "t")} />
        <div style={corner("r", "t")} />
        <div style={corner("l", "b")} />
        <div style={corner("r", "b")} />
        {/* faint scrim so text sits legibly on any screenshot, no card edge */}
        <div
          style={{
            position: "absolute",
            inset: "-10px -18px",
            background: "linear-gradient(180deg, rgba(6,10,14,.02), rgba(6,10,14,.5) 42%, rgba(6,10,14,.62))",
            filter: "blur(2px)",
            zIndex: -1,
            borderRadius: 4,
          }}
        />
        {kicker && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
            <span
              style={{
                font: `500 14px/1 ${MONO}`,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: C.cyan,
                opacity: ease(frame, at, at + 10),
                textShadow: `0 0 16px rgba(39,198,223,.6)`,
              }}
            >
              {kicker}
              <span style={{ opacity: blink ? 1 : 0 }}>_</span>
            </span>
            <span
              style={{
                display: "inline-block",
                height: 1,
                width: 46,
                background: C.cyan,
                transform: `scaleX(${scan})`,
                transformOrigin: "left",
                boxShadow: `0 0 8px rgba(39,198,223,.7)`,
              }}
            />
          </div>
        )}
        <Kinetic text={text} at={at + 3} size={size} weight={300} accent={accent} />
      </div>
    </div>
  );
};

export const Callout: React.FC<{
  label: string;
  x: number;
  y: number;
  dir?: "left" | "right";
  at?: number;
  out?: number;
  len?: number;
}> = ({ label, x, y, dir = "right", at = 0, out, len = 130 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const end = out ?? durationInFrames - 10;
  const draw = ease(frame, at, at + 16);
  const chip = ease(frame, at + 8, at + 24);
  const o = 1 - ease(frame, end - 8, end);
  const sign = dir === "right" ? 1 : -1;
  const pulse = 1 + Math.sin(Math.max(0, frame - at) / 9) * 0.1;

  return (
    <div style={{ position: "absolute", left: (x / 100) * width, top: (y / 100) * height, opacity: o, zIndex: 22 }}>
      <div
        style={{
          position: "absolute",
          left: dir === "right" ? 0 : -len * draw,
          top: -1,
          width: len * draw,
          height: 2,
          background: `linear-gradient(90deg, ${C.cyan}, rgba(39,198,223,.25))`,
          boxShadow: `0 0 14px rgba(39,198,223,.7)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -5,
          top: -6,
          width: 11,
          height: 11,
          borderRadius: 999,
          background: C.cyan,
          boxShadow: `0 0 18px ${C.cyan}`,
          transform: `scale(${draw * pulse})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: sign === 1 ? len + 12 : -len - 12,
          top: -21,
          transform: `translateX(${sign * (1 - chip) * 18}px) ${sign === -1 ? "translateX(-100%)" : ""}`,
          opacity: chip,
          whiteSpace: "nowrap",
          background: "rgba(9,14,19,.88)",
          border: `1px solid rgba(39,198,223,.45)`,
          borderRadius: 10,
          padding: "10px 17px",
          font: `500 21px/1 ${MONO}`,
          color: C.cyan,
          backdropFilter: "blur(8px)",
          boxShadow: "0 10px 30px rgba(0,0,0,.45)",
        }}
      >
        {label}
      </div>
    </div>
  );
};

/* ============================================================ cursor */

export const Cursor: React.FC<{
  path: [number, number][];
  at?: number;
  step?: number;
  clickAt?: number[];
  hideAt?: number;
}> = ({ path, at = 0, step = 24, clickAt = [], hideAt }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const appear = ease(frame, at - 10, at + 4);
  const gone = hideAt ? ease(frame, hideAt, hideAt + 12) : 0;

  let x = path[0][0];
  let y = path[0][1];
  for (let i = 1; i < path.length; i++) {
    const s = at + (i - 1) * step;
    const p = ease(frame, s, s + step, 0, 1, SWIFT);
    x = interpolate(p, [0, 1], [path[i - 1][0], path[i][0]]);
    y = interpolate(p, [0, 1], [path[i - 1][1], path[i][1]]);
    if (frame < s + step) break;
  }

  // squash toward the direction of travel for a touch of life
  const press = clickAt.reduce((acc, c) => Math.max(acc, 1 - Math.abs(frame - c) / 6), 0);

  return (
    <div
      style={{
        position: "absolute",
        left: (x / 100) * width,
        top: (y / 100) * height,
        opacity: appear * (1 - gone),
        zIndex: 40,
      }}
    >
      {clickAt.map((c) => {
        const r = ease(frame, c, c + 22);
        if (r <= 0 || r >= 1) return null;
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: -22,
              top: -22,
              width: 44,
              height: 44,
              borderRadius: 999,
              border: `2px solid ${C.cyan}`,
              boxShadow: `0 0 20px rgba(39,198,223,${(1 - r) * 0.8})`,
              transform: `scale(${0.3 + r * 2})`,
              opacity: 1 - r,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: -16,
          top: -16,
          width: 32,
          height: 32,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(39,198,223,.34), transparent 70%)",
          filter: "blur(3px)",
        }}
      />
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,.75))", transform: `scale(${1 - press * 0.16})` }}
      >
        <path d="M4 2l6 16 2.5-6.5L19 9 4 2z" fill="#fff" stroke="#0a0f14" strokeWidth="1.2" />
      </svg>
    </div>
  );
};

/* ============================================================ multi-agent chat */

/** Fast blur wipe used only to hop between agent skins — a deliberate cut, not the default. */
export const Wipe: React.FC<{ at: number; len?: number }> = ({ at, len = 16 }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const p = (frame - at) / len;
  if (p <= 0 || p >= 1) return null;
  const x = interpolate(p, [0, 1], [-20, 120]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 50, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: `${x}%`,
          top: 0,
          bottom: 0,
          width: width * 0.5,
          transform: "translateX(-50%) skewX(-9deg)",
          background:
            "linear-gradient(90deg,transparent,rgba(39,198,223,.05) 30%,rgba(255,255,255,.9) 50%,rgba(39,198,223,.05) 70%,transparent)",
          filter: "blur(18px)",
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${x}%`,
          top: 0,
          bottom: 0,
          width: 4,
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,.95)",
          boxShadow: "0 0 60px 14px rgba(39,198,223,.8)",
          opacity: bumpP(p),
        }}
      />
    </AbsoluteFill>
  );
};
const bumpP = (p: number) => Math.sin(Math.min(1, Math.max(0, p)) * Math.PI);

export type ChatLine = { text: string; at: number };

/** One agent's chat window: types a prompt, calls the MCP tool, streams a reply. */
export const ChatSkin: React.FC<{
  name: string;
  tag: string;
  glyphColor: string;
  bornAt: number;
  outAt?: number;
  userText: string;
  typeAt: number;
  typeLen?: number;
  toolAt: number;
  toolLabel: string;
  toolDenied?: boolean;
  replyAt: number;
  replyLines: ChatLine[];
}> = ({
  name,
  tag,
  glyphColor,
  bornAt,
  outAt,
  userText,
  typeAt,
  typeLen = 26,
  toolAt,
  toolLabel,
  toolDenied,
  replyAt,
  replyLines,
}) => {
  const frame = useCurrentFrame();
  const born = ease(frame, bornAt, bornAt + 14);
  const gone = outAt !== undefined ? ease(frame, outAt, outAt + 10) : 0;
  const chars = Math.round(ease(frame, typeAt, typeAt + typeLen, 0, userText.length));
  const typed = userText.slice(0, chars);
  const caretOn = frame < typeAt + typeLen && Math.floor(frame / 8) % 2 === 0;
  const toolP = ease(frame, toolAt, toolAt + 12);
  const breathe = 0.5 + 0.5 * Math.sin(frame / 55);

  return (
    <div
      style={{
        position: "relative",
        opacity: born * (1 - gone),
        transform: `translateY(${(1 - born) * 26 + gone * -14}px) scale(${interpolate(born, [0, 1], [0.97, 1])})`,
      }}
    >
      {/* agent-tinted ambient glow, breathes so the card never sits dead-still */}
      <div
        style={{
          position: "absolute",
          inset: -80,
          background: `radial-gradient(ellipse at center, ${glyphColor}22, transparent 65%)`,
          filter: `blur(${50 + breathe * 12}px)`,
          zIndex: -1,
        }}
      />
      <div
        style={{
          width: 1180,
          borderRadius: 20,
          overflow: "hidden",
          border: `1px solid ${C.border2}`,
          background: "#0a0f14",
          boxShadow: `0 50px 130px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.03), 0 0 ${
            50 + breathe * 20
          }px ${glyphColor}22, inset 0 1px 0 rgba(255,255,255,.07)`,
        }}
      >
      <div
        style={{
          height: 52,
          background: "#0f1720",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 22px",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${glyphColor}, rgba(255,255,255,.15))`,
            boxShadow: `0 0 16px ${glyphColor}55`,
          }}
        />
        <span style={{ font: `500 18px/1 ${SANS}`, color: C.fg }}>{name}</span>
        <span style={{ font: `400 14px/1 ${MONO}`, color: C.faint }}>{tag}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: C.ok, boxShadow: `0 0 8px ${C.ok}` }} />
          <span style={{ font: `400 13px/1 ${MONO}`, color: C.faint }}>MCP connected</span>
        </div>
      </div>

      <div style={{ padding: "30px 34px 36px", minHeight: 300, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* user bubble, typed live */}
        <div style={{ alignSelf: "flex-end", maxWidth: "78%" }}>
          <div
            style={{
              background: "rgba(39,198,223,.14)",
              border: "1px solid rgba(39,198,223,.3)",
              borderRadius: "16px 16px 4px 16px",
              padding: "14px 20px",
              font: `400 22px/1.5 ${SANS}`,
              color: C.fg,
            }}
          >
            {typed}
            <span style={{ opacity: caretOn ? 1 : 0 }}>▌</span>
          </div>
        </div>

        {/* tool-call pill */}
        {toolP > 0 && (
          <div
            style={{
              alignSelf: "flex-start",
              opacity: toolP,
              transform: `translateX(${(1 - toolP) * -10}px)`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,.03)",
              border: `1px solid ${toolDenied ? "rgba(255,106,94,.4)" : "rgba(39,198,223,.28)"}`,
              borderRadius: 10,
              padding: "9px 16px",
              font: `500 16px/1 ${MONO}`,
              color: toolDenied ? C.crit : C.cyan,
            }}
          >
            <span style={{ opacity: 0.7 }}>{toolDenied ? "✕" : "⚙"}</span> {toolLabel}
          </div>
        )}

        {/* assistant reply, line by line */}
        <div style={{ alignSelf: "flex-start", maxWidth: "86%", display: "flex", flexDirection: "column", gap: 8 }}>
          {replyLines.map((l, i) => {
            const p = ease(frame, replyAt + l.at, replyAt + l.at + 10);
            if (p <= 0) return null;
            return (
              <div
                key={i}
                style={{
                  opacity: p,
                  transform: `translateY(${(1 - p) * 8}px)`,
                  font: `400 21px/1.55 ${SANS}`,
                  color: l.text.startsWith("✕") ? C.crit : C.muted,
                }}
              >
                {l.text}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
};
