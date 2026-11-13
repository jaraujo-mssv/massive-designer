/**
 * The brand images offered ready to paste into Gemini. All are public files, so
 * the kit works on the live site too. The logos are drawn on their own ground:
 * pasted with a transparent background, Gemini shows them on black, where the
 * ink logo disappears.
 */
export interface KitItem {
  id: string;
  label: string;
  src: string;
  /** Background behind the logo, and the logo's width as a share of the image. */
  ground?: string;
  fill?: number;
  /** How the prompt's reference list describes it. */
  describe: string;
}

const EXACT = "reproduce it exactly as given, never redraw or recolour it";

export const KIT: KitItem[] = [
  {
    id: "logo-dark",
    label: "Logo, dark",
    src: "/image-projects/_brand/logo-massive.svg",
    ground: "#0a0a0f",
    fill: 0.7,
    describe: `the Massive logo for dark surfaces: ${EXACT}`,
  },
  {
    id: "logo-light",
    label: "Logo, light",
    src: "/image-projects/_brand/logo-massive-positive.svg",
    ground: "#ffffff",
    fill: 0.7,
    describe: `the Massive logo for light surfaces: ${EXACT}`,
  },
  {
    id: "mark",
    label: "Mark",
    src: "/image-projects/_brand/icon-massive.svg",
    ground: "#0a0a0f",
    fill: 0.5,
    describe: `the Massive mark, the logo's symbol without the name: ${EXACT}`,
  },
  {
    id: "mark-white",
    label: "Mark, white",
    src: "/image-projects/_brand/icon-massive-white.svg",
    ground: "#0a0a0f",
    fill: 0.5,
    describe: `the all-white Massive mark: ${EXACT}`,
  },
  {
    id: "ground",
    label: "Dark ground",
    src: "/image-projects/_brand/bg-dark.jpg",
    describe: "Massive's dark background: near-black with a faint large grid and a red glow at the bottom",
  },
];

/** The width the logos are drawn at: big enough for Gemini to copy the letterforms. */
export const KIT_WIDTH = 2048;
