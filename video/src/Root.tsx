import React from "react";
import { Composition } from "remotion";
import { Probe } from "./Probe";
import { AtharVideo, DURATION } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="Athar"
      component={AtharVideo}
      durationInFrames={DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
      <Composition id="Probe" component={Probe} durationInFrames={90} fps={30} width={1920} height={1080} />
    </>
  );
};
