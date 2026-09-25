import type { DetailedHTMLProps, HTMLAttributes } from "react";

/** One storyboard frame, as written by scripts/video/build-index.mjs. */
export interface StoryboardFrame {
  index: number;
  title: string;
  status: "outline" | "built" | "animated";
  scene: string | null;
  voiceover: string | null;
  narrative: string;
  src: string | null;
  /** Seconds from the start of the video. */
  start: number;
  duration: number | null;
  poster: number | null;
  transitionIn: string | null;
}

export interface Storyboard {
  globals: {
    format?: string;
    message?: string;
    arc?: string;
    audience?: string;
    extra?: Record<string, unknown>;
  };
  frames: StoryboardFrame[];
  warnings: { message: string }[];
}

export interface VideoProject {
  id: string;
  title: string;
  group: "massive" | "templates";
  /** port = translated from Remotion, native = authored in HyperFrames, template = rebuilt SparkTray/BizTray example. */
  kind: "port" | "native" | "template";
  brand: string | null;
  status: string;
  source: string | null;
  compositionId: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  /** URL of the composition's index.html. */
  path: string;
  storyboard: Storyboard | null;
  script: string | null;
  /** Untracked media the project needs (assets/…), synced locally with `npm run video:media`. */
  media: string[];
}

export type VideoView = "script" | "storyboard" | "preview";

type HfPlayerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  width?: number | string;
  height?: number | string;
  controls?: string;
  muted?: string;
  loop?: string;
};

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "hyperframes-player": HfPlayerAttributes;
    }
  }
}
