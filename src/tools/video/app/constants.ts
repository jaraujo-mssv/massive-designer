import type { VideoView } from "./types";

export const INDEX_URL = "/video-projects/index.json";

export const VIEWS: { id: VideoView; label: string }[] = [
  { id: "script", label: "Script" },
  { id: "storyboard", label: "Storyboard" },
  { id: "preview", label: "Preview" },
];

export const BRAND_LABELS: Record<string, string> = {
  sparktray: "SparkTray",
  biztray: "BizTray",
};

export const KIND_LABELS: Record<string, string> = {
  native: "New",
  port: "Ported from Remotion",
  template: "Templates",
};
