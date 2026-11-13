/**
 * The prompt as it's copied: what you wrote, then the lines the options add,
 * then the list of the images you're about to paste, in the order you'll paste them.
 */
export type Style = "off" | "dark" | "light";
export type Format = "any" | "1:1" | "4:5" | "16:9" | "9:16";

export interface PromptOptions {
  style: Style;
  format: Format;
  noBrands: boolean;
  listRefs: boolean;
}

export const DEFAULT_OPTIONS: PromptOptions = { style: "off", format: "any", noBrands: false, listRefs: true };

// From brand/BRAND.md: the two registers, one accent, Outfit, no new gradients, no shadows, no cream.
const STYLE_LINES: Record<Exclude<Style, "off">, string> = {
  dark:
    "Style: Massive's dark look, like a confident technical brief. A near-black ground (#0a0a0f), cream text (#faf4ec) and one red accent (#d74939, with #ff8163 for highlights and glows); no other hue. Clean, bold geometric sans-serif type like Outfit. No new gradients, no drop shadows, plenty of empty space.",
  light:
    "Style: Massive's light look, like a confident technical brief. A white or very faint orange ground (#fff7f2), near-black ink text (#171615) and one paper-red accent (#d54635); no other hue, and no cream or beige paper. Clean, bold geometric sans-serif type like Outfit. No new gradients, no drop shadows, plenty of empty space.",
};

// The sizes from BRAND.md's "Sizes by channel".
export const FORMATS: { id: Format; label: string; line?: string }[] = [
  { id: "any", label: "Any" },
  { id: "1:1", label: "1:1", line: "Format: square, 1:1 (1080×1080)." },
  { id: "4:5", label: "4:5", line: "Format: portrait, 4:5 (1080×1350), for a LinkedIn or Instagram feed post." },
  { id: "16:9", label: "16:9", line: "Format: landscape, 16:9 (1920×1080)." },
  { id: "9:16", label: "9:16", line: "Format: vertical, 9:16 (1080×1920), for a story or reel." },
];

// As the Content tab's photo prompts say it, without their sports props.
const NO_OTHER_BRANDS =
  "No other company's logos, brand names or readable signs; props, clothes and devices are plain and unmarked.";

/** An image in the set, as the reference list names it. */
export interface Attached {
  describe: string;
}

export function composePrompt(draft: string, options: PromptOptions, attached: Attached[]): string {
  const parts = [draft.trim()];
  if (options.style !== "off") parts.push(STYLE_LINES[options.style]);
  const format = FORMATS.find((f) => f.id === options.format)?.line;
  if (format) parts.push(format);
  if (options.noBrands) parts.push(NO_OTHER_BRANDS);
  if (options.listRefs && attached.length > 0) {
    parts.push(
      ["Reference images, in the order attached:", ...attached.map((a, i) => `${i + 1}. ${a.describe}.`)].join("\n"),
    );
  }
  return parts.filter(Boolean).join("\n\n");
}

/** A short title for a prompt: its first few words. */
export function titleOf(text: string, words = 6): string {
  const first = text.trim().split(/\s+/).slice(0, words).join(" ");
  return first.replace(/[.,;:!?]+$/, "") || "Untitled prompt";
}
