import React from "react";
import { AbsoluteFill } from "remotion";
import { HeadlineTiles } from "./scenes/dashboard";
export const Probe: React.FC = () => (
  <AbsoluteFill style={{ background: "#0b1016" }}>
    <HeadlineTiles at={0} />
  </AbsoluteFill>
);
