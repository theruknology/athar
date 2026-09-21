import React from "react";
import { AbsoluteFill, Loop, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import "./fonts";
import "./app.css";
import { C, MONO, SANS } from "./theme";
import { Brand } from "./components/kit";
import { StatCards } from "./components/cards";
import { BigNumber, CloudPanel, Departments, HeadlineTiles, PosturePanel } from "./scenes/dashboard";
import { Callout, Caption, ChatSkin, Cursor, Flare, Kinetic, Screen, Shot, Wipe, ease } from "./components/tour";

/* ------------------------------------------------------------- backdrop
 * A slow-drifting silk/aurora loop replaces the flat gradient — the whole
 * film sits on a living surface instead of a static plane. Dimmed hard and
 * vignetted so it reads as atmosphere, never competes with the UI in front.
 */
const Backdrop: React.FC<{ tint?: string }> = ({ tint }) => {
  const frame = useCurrentFrame();
  const d = Math.sin(frame / 150) * 12;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Loop durationInFrames={1200}>
        <OffthreadVideo
          src={staticFile("bg/stock.mp4")}
          muted
          playbackRate={0.5}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(.34) saturate(1.2) contrast(1.06)",
            opacity: 0.85,
          }}
        />
      </Loop>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1500px 820px at ${80 + d / 10}% -10%, rgba(39,198,223,.14), transparent 60%),
                       radial-gradient(1300px 1000px at 50% 55%, rgba(6,10,14,.28), rgba(6,10,14,.86) 76%),
                       ${tint ?? ""}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: `linear-gradient(90deg,${C.cyanDeep},#1596b0 45%,${C.cyan})`,
          boxShadow: `0 0 24px rgba(39,198,223,.6)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(circle at 50% 40%, black, transparent 82%)",
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- open */
const Open: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = ease(frame, 2, 28);
  const ring = ease(frame, 6, 46);
  const ring2 = ease(frame, 16, 58);
  const lift = ease(frame, 16, 40);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
      <div style={{ position: "relative" }}>
        {[ring, ring2].map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 320,
              height: 320,
              marginLeft: -160,
              marginTop: -160,
              borderRadius: 999,
              border: `1px solid rgba(39,198,223,${0.4 - i * 0.12})`,
              transform: `scale(${0.35 + r * (1.2 + i * 0.5)})`,
              opacity: (1 - r) * 0.9,
            }}
          />
        ))}
        <svg
          width="96"
          height="96"
          viewBox="0 0 24 24"
          fill="none"
          style={{ transform: `scale(${0.85 + draw * 0.15})`, filter: "drop-shadow(0 0 26px rgba(39,198,223,.55))" }}
        >
          <circle cx="8" cy="12" r="2.4" fill={C.cyan} />
          <path d="M13 6.5a8 8 0 0 1 0 11" stroke={C.cyan} strokeWidth="1.6" strokeLinecap="round" opacity={0.9 * draw} />
          <path d="M16.5 4a12 12 0 0 1 0 16" stroke={C.cyan} strokeWidth="1.6" strokeLinecap="round" opacity={0.5 * draw} />
        </svg>
      </div>
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <div
          style={{
            fontSize: 52,
            fontWeight: 300,
            letterSpacing: `${interpolate(lift, [0, 1], [0.55, 0.36])}em`,
            color: C.fg,
            opacity: lift,
            textIndent: "0.36em",
          }}
        >
          ATHAR
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
          <Kinetic text="Multi-cloud access governance." at={34} size={26} weight={300} color={C.muted} />
        </div>
        <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 12 }}>
          {[
            { label: "AWS", color: "#F5A623" },
            { label: "Azure", color: "#3E8EED" },
            { label: "GCP", color: "#34A853" },
            { label: "MCP", color: C.cyan },
          ].map((chip, i) => {
            const at = 58 + i * 6;
            const p = ease(frame, at, at + 16);
            return (
              <div
                key={chip.label}
                style={{
                  opacity: p,
                  transform: `translateY(${(1 - p) * 10}px)`,
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: `1px solid ${chip.color}55`,
                  background: `${chip.color}14`,
                  boxShadow: `0 0 20px ${chip.color}33`,
                  font: `500 15px/1 ${MONO}`,
                  color: C.fg,
                  letterSpacing: "0.02em",
                }}
              >
                {chip.label}
              </div>
            );
          })}
        </div>
      </div>
      <Flare at={22} len={52} y={46} power={0.85} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- MCP terminal */
/**
 * Same MCP server, three different chat agents. A fast blur wipe hops between
 * them — the point is that switching clients takes nothing on ATHAR's side.
 */
const Mcp: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ChatSkin
          name="Claude"
          tag="claude.ai"
          glyphColor="#27C6DF"
          bornAt={0}
          outAt={96}
          userText="Show me the riskiest identity right now."
          typeAt={6}
          typeLen={30}
          toolAt={38}
          toolLabel="athar-mcp → explain_finding(R4)"
          replyAt={52}
          replyLines={[
            { text: "Hamad Al Ketbi — score 100, admin in all 3 clouds.", at: 0 },
            { text: "Reach 70% of the estate. Open since Sep 2025.", at: 10 },
          ]}
        />
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ChatSkin
          name="ChatGPT"
          tag="chatgpt.com"
          glyphColor="#19C37D"
          bornAt={100}
          outAt={168}
          userText="draft a fix for the cross-cloud superuser finding"
          typeAt={104}
          typeLen={22}
          toolAt={130}
          toolLabel="athar-mcp → propose_remediation"
          replyAt={142}
          replyLines={[{ text: "Plan drafted — blast radius 69.9% → 0.0%. Awaiting approval.", at: 0 }]}
        />
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ChatSkin
          name="Gemini"
          tag="gemini.google.com · viewer"
          glyphColor="#4285F4"
          bornAt={172}
          userText="apply that remediation plan now"
          typeAt={176}
          typeLen={22}
          toolAt={202}
          toolLabel="✕ propose_remediation — 403 requires role analyst"
          toolDenied
          replyAt={216}
          replyLines={[{ text: "✕ I can't approve or apply changes — only read and propose.", at: 0 }]}
        />
      </div>
      <Wipe at={92} />
      <Wipe at={166} />
      <Flare at={92} len={26} y={50} power={0.6} />
      <Flare at={166} len={26} y={50} power={0.6} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- close */
const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const r = ease(frame, 4, 26);
  const askP = ease(frame, 46, 66);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: SANS, textAlign: "center" }}>
      <div style={{ opacity: r, transform: `translateY(${(1 - r) * 16}px)` }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22, filter: "drop-shadow(0 0 22px rgba(39,198,223,.5))" }}>
          <Brand size={62} />
        </div>
        <div style={{ fontSize: 48, fontWeight: 300, letterSpacing: "0.36em", color: C.fg, textIndent: "0.36em" }}>
          ATHAR
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <Kinetic text="Every permission leaves a trace." at={20} size={28} weight={300} color={C.muted} />
      </div>
      <div
        style={{
          marginTop: 44,
          opacity: askP,
          transform: `translateY(${(1 - askP) * 18}px)`,
          border: `1px solid rgba(39,198,223,.4)`,
          background: C.cyanSoft,
          borderRadius: 16,
          padding: "20px 34px",
          fontSize: 27,
          fontWeight: 300,
          color: C.fg,
        }}
      >
        Give us the exports — ATHAR gives you the record.
      </div>
      <Flare at={12} len={54} y={44} power={0.75} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- beats */
const D = {
  open: 96,
  ovWide: 152,
  ovStats: 150,
  ovNever: 142,
  ovPosture: 150,
  ovClouds: 150,
  idWide: 168,
  idScore: 152,
  idCloud: 122,
  drHero: 144,
  drFormula: 192,
  drCausal: 150,
  tlWide: 162,
  tlHalf: 132,
  reWide: 142,
  reStats: 176,
  reCoverage: 155,
  reRules: 132,
  evalHonest: 165,
  proofCards: 200,
  ledger: 142,
  mcp: 250,
  close: 140,
};
/** Beats overlap so every cut is a dissolve, never a flash. */
const LAP = 11;
export const DURATION =
  Object.values(D).reduce((a, b) => a + b, 0) - LAP * (Object.keys(D).length - 1);

export const AtharVideo: React.FC = () => {
  let t = 0;
  const seq = (d: number) => {
    const from = t;
    t += d - LAP;
    return from;
  };

  return (
    <AbsoluteFill>
      <Backdrop />

      {/* 1 · open */}
      <Sequence from={seq(D.open)} durationInFrames={D.open}>
        <Shot><Open /></Shot>
      </Sequence>

      {/* 2 · overview — the screen rises in */}
      <Sequence from={seq(D.ovWide)} durationInFrames={D.ovWide}>
        <Shot>
          <Screen shot="overview" to={{ x: 50, y: 34, z: 1.06 }} rise={360} tilt={17} sweep={34} />
          <Cursor path={[[52, 96], [46, 62], [44, 58]]} at={40} step={20} hideAt={132} />
          <Caption kicker="Overview" text="One government estate. Three different clouds." accent={["Three"]} />
          <Flare at={6} len={46} y={54} power={0.7} />
        </Shot>
      </Sequence>

      {/* 3 · headline tiles — the real components, assembling one by one */}
      <Sequence from={seq(D.ovStats)} durationInFrames={D.ovStats}>
        <Shot>
          <HeadlineTiles at={10} />
          <Caption text="Five hundred and seven people and machines. One list." accent={["One"]} at={70} size={30} />
        </Shot>
      </Sequence>

      {/* 4 · departments — where the root cause shows up */}
      <Sequence from={seq(D.ovNever)} durationInFrames={D.ovNever}>
        <Shot>
          <Departments at={10} />
          <Caption text="Access gets granted. It never gets taken back." accent={["never"]} at={58} size={30} />
        </Shot>
      </Sequence>

      {/* 4b · privilege posture */}
      <Sequence from={seq(D.ovPosture)} durationInFrames={D.ovPosture}>
        <Shot>
          <PosturePanel at={8} />
          <Caption
            kicker="Privilege posture"
            text="Not how many alerts. How much power."
            accent={["power."]}
            at={62}
            size={30}
          />
        </Shot>
      </Sequence>

      {/* 4c · one card per cloud, dealt left to right */}
      <Sequence from={seq(D.ovClouds)} durationInFrames={D.ovClouds}>
        <Shot>
          <CloudPanel at={8} />
          <Caption text="Three clouds. One page. Same questions of each." accent={["One"]} at={62} size={30} />
        </Shot>
      </Sequence>

      {/* 5 · identities */}
      <Sequence from={seq(D.idWide)} durationInFrames={D.idWide}>
        <Shot>
          <Screen shot="identities" to={{ x: 50, y: 22, z: 1.12 }} rise={330} tilt={16} sweep={30} />
          <Cursor path={[[80, 88], [58, 48], [55, 42], [55, 42]]} at={26} step={20} clickAt={[86]} />
          <Caption kicker="Identities" text="Everyone who holds access, ranked by risk." accent={["ranked"]} />
          <Flare at={4} len={44} y={50} power={0.7} />
        </Shot>
      </Sequence>

      {/* 6 · score column */}
      <Sequence from={seq(D.idScore)} durationInFrames={D.idScore}>
        <Shot>
          <Screen
            shot="identities"
            from={{ x: 50, y: 22, z: 1.12 }}
            to="scoreColumn"
            fill={0.55}
            move={[0, 48]}
            spot={{ region: "scoreColumn", at: 46 }}
            rise={110}
            tilt={5}
          />
          <Caption text="How much of the estate this account can reach." accent={["reach."]} at={22} size={30} pos="br" />
        </Shot>
      </Sequence>

      {/* 7 · cross-cloud */}
      <Sequence from={seq(D.idCloud)} durationInFrames={D.idCloud}>
        <Shot>
          <Screen
            shot="identities"
            from="scoreColumn"
            to="cloudsColumn"
            fill={0.45}
            move={[0, 42]}
            spot={{ region: "cloudsColumn", at: 38 }}
            rise={90}
            tilt={4}
          />
          <Caption text="Full admin in all three clouds. At the same time." accent={["all", "three"]} at={14} />
        </Shot>
      </Sequence>

      {/* 8 · drill-down */}
      <Sequence from={seq(D.drHero)} durationInFrames={D.drHero}>
        <Shot>
          <Screen shot="identity-detail" to={{ x: 45, y: 40, z: 1.18 }} rise={340} tilt={16} sweep={28} />
          <Cursor path={[[24, 78], [20, 30]]} at={22} step={22} hideAt={110} />
          <Caption kicker="Why a 100" text="Open it — the score is in the open." accent={["open."]} />
          <Flare at={4} len={46} y={48} power={0.8} />
        </Shot>
      </Sequence>

      {/* 9 · the formula */}
      <Sequence from={seq(D.drFormula)} durationInFrames={D.drFormula}>
        <Shot>
          <Screen
            shot="identity-detail"
            from={{ x: 45, y: 40, z: 1.18 }}
            to="score"
            fill={0.9}
            move={[0, 52]}
            spot={{ region: "score", at: 50 }}
            rise={110}
            tilt={5}
          />
          <Caption text="Every number shows its working." accent={["working."]} at={20} />
        </Shot>
      </Sequence>

      {/* 10 · causal history */}
      <Sequence from={seq(D.drCausal)} durationInFrames={D.drCausal}>
        <Shot>
          <Screen
            shot="identity-detail"
            from="score"
            to="history"
            fill={0.88}
            move={[0, 48]}
            spot={{ region: "history", at: 44 }}
            rise={100}
            tilt={5}
          />
          <Caption text="And exactly which permissions caused it." accent={["which"]} at={14} />
        </Shot>
      </Sequence>

      {/* 11 · timeline */}
      <Sequence from={seq(D.tlWide)} durationInFrames={D.tlWide}>
        <Shot>
          <Screen shot="timeline" to="chart" fill={0.9} move={[0, 60]} rise={340} tilt={16} sweep={30} />
          <Cursor path={[[70, 90], [40, 44], [40, 44]]} at={26} step={22} clickAt={[74]} hideAt={140} />
          <Caption kicker="Timeline" text="A full year, replayed." accent={["year,"]} />
          <Flare at={4} len={46} y={52} power={0.7} />
        </Shot>
      </Sequence>

      {/* 12 · half-life curve */}
      <Sequence from={seq(D.tlHalf)} durationInFrames={D.tlHalf}>
        <Shot>
          <Screen
            shot="timeline"
            from="chart"
            to="halflife"
            fill={0.9}
            move={[0, 44]}
            spot={{ region: "halflife", at: 42 }}
            rise={90}
            tilt={4}
          />
          <Caption text="This is a broken process. Not twelve careless people." accent={["process."]} at={14} size={30} />
        </Shot>
      </Sequence>

      {/* 13 · real export */}
      <Sequence from={seq(D.reWide)} durationInFrames={D.reWide}>
        <Shot>
          <Screen shot="realexport" to={{ x: 50, y: 30, z: 1.1 }} rise={350} tilt={17} sweep={30} />
          <Cursor path={[[75, 90], [30, 34]]} at={24} step={22} hideAt={116} />
          <Caption kicker="Real export" text="Now the same system, on a real AWS account." accent={["real"]} />
          <Flare at={4} len={48} y={50} power={0.85} />
        </Shot>
      </Sequence>

      {/* 14 · real numbers */}
      <Sequence from={seq(D.reStats)} durationInFrames={D.reStats}>
        <Shot>
          <Screen
            shot="realexport"
            from={{ x: 50, y: 30, z: 1.1 }}
            to="headline"
            fill={0.94}
            move={[0, 52]}
            spot={{ region: "r7Tile", at: 58 }}
          />
          <Caption text="283 findings. On data we did not write." accent={["283"]} at={30} size={30} pos="br" />
        </Shot>
      </Sequence>

      {/* 14b · the coverage number, given the whole frame */}
      <Sequence from={seq(D.reCoverage)} durationInFrames={D.reCoverage}>
        <Shot>
          <BigNumber
            label="Of a real AWS export"
            value="100%"
            note="of the permissions were understood. Our first attempt managed thirty-one."
            at={10}
            tone={C.ok}
          />
          <Flare at={6} len={50} y={46} power={0.7} />
        </Shot>
      </Sequence>

      {/* 15 · rule table */}
      <Sequence from={seq(D.reRules)} durationInFrames={D.reRules}>
        <Shot>
          <Screen
            shot="realexport"
            from="coverageTile"
            to="worst"
            fill={0.9}
            move={[0, 44]}
            spot={{ region: "worst", at: 42 }}
            rise={90}
            tilt={4}
          />
          <Caption text="And it lands on the genuinely dangerous accounts." accent={["dangerous"]} at={14} size={30} />
        </Shot>
      </Sequence>

      {/* 15b · the evaluation says what it cannot prove */}
      <Sequence from={seq(D.evalHonest)} durationInFrames={D.evalHonest}>
        <Shot>
          <Screen
            shot="evaluation"
            from="headline"
            to="strength"
            fill={0.9}
            move={[10, 70]}
            spot={{ region: "strength", at: 66 }}
            rise={330}
            tilt={15}
            sweep={30}
          />
          <Caption
            kicker="Evaluation"
            text="We score 100%. Here is why you should not just take our word."
            accent={["not"]}
            at={20}
            size={29}
          />
          <Flare at={4} len={46} y={50} power={0.75} />
        </Shot>
      </Sequence>

      {/* 15c · the three numbers we want a judge to leave with */}
      <Sequence from={seq(D.proofCards)} durationInFrames={D.proofCards}>
        <Shot>
          <StatCards
            kicker="What we would rather be judged on"
            title="Results on data we did not write"
            at={16}
            stagger={10}
            cards={[
              { value: "100%", label: "Understood", note: "of the permissions in a real AWS account", tone: C.ok },
              { value: "283", label: "Findings", note: "on 122 real accounts, with no answer key to mark ourselves against" },
              { value: "35", label: "Caught for real", note: "by a rule that finds nothing at all in our own test data", tone: C.high },
            ]}
          />
          <Flare at={8} len={52} y={48} power={0.8} />
        </Shot>
      </Sequence>

      {/* 16 · ledger */}
      <Sequence from={seq(D.ledger)} durationInFrames={D.ledger}>
        <Shot>
          <Screen shot="ledger" to="table" fill={0.9} move={[0, 60]} rise={330} tilt={16} sweep={28} />
          <Cursor path={[[68, 86], [40, 46], [40, 46]]} at={24} step={22} clickAt={[74]} hideAt={132} />
          <Caption kicker="Ledger" text="Sealed on-chain. Check it without trusting us." accent={["without"]} />
          <Flare at={4} len={46} y={50} power={0.75} />
        </Shot>
      </Sequence>

      {/* 17 · MCP */}
      <Sequence from={seq(D.mcp)} durationInFrames={D.mcp}>
        <Shot>
          <Mcp />
          <Caption kicker="ATHAR-MCP" text="Any AI can ask. None of them can act." accent={["None"]} at={228} out={D.mcp - 12} size={29} />
        </Shot>
      </Sequence>

      {/* 18 · close */}
      <Sequence from={seq(D.close)} durationInFrames={D.close}>
        <Shot><Close /></Shot>
      </Sequence>
    </AbsoluteFill>
  );
};
