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

/** One LinkedIn check from gif/stats.json (limits in scripts/video/lib/gif-spec.mjs). */
export interface GifCheck {
  label: string;
  value: string;
  limit: string;
  ok: boolean;
}

/** A rendered GIF, from gif/stats.json as written by `npm run gif:render`. */
export interface GifInfo {
  bytes: number;
  frames: number;
  fps: number;
  width: number;
  height: number;
  duration: number;
  colors: number;
  dither: string;
  renderedAt: string;
  checks: GifCheck[];
  /** Cache-busted URLs of the GIF and its first frame. */
  url: string;
  firstFrameUrl: string;
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
  /** Media files the project needs (assets/… outside brand/ and template/), committed with it. */
  media: string[];
  /** "gif" = a looping LinkedIn GIF (meta.json "output": "gif"), shown in the GIFs section. */
  output: "mp4" | "gif";
  /** A set of GIFs that belong together, e.g. "Archive machines" (meta.json "series"). */
  series: string | null;
  /** LinkedIn alt text (GIFs). */
  alt: string | null;
  /** The rendered GIF, or null before the first `npm run gif:render`. */
  gif: GifInfo | null;
}

/** One person's version of a template: its composition variables, from a local JSON file (dev server only). */
export interface VideoVariant {
  id: string;
  projectId: string;
  title: string;
  subtitle: string | null;
  variables: Record<string, unknown>;
  /** e.g. output/hires/maria.json */
  file: string;
  /** Output name for `video:render --name`. */
  renderName: string;
}

export type VideoView = "script" | "storyboard" | "preview";

type HfPlayerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  width?: number | string;
  height?: number | string;
  controls?: string;
  muted?: string;
  loop?: string;
  autoplay?: string;
};

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "hyperframes-player": HfPlayerAttributes;
    }
  }
}
