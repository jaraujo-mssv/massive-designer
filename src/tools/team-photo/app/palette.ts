/**
 * The backgrounds for the team's faces: pastel tints of Massive's colours (the logo gradient
 * #F69666 → #F16D65, red #d74939, red-light #ff8163, #f3a07a) and their neighbours, the purples
 * from the dark surfaces' violet, and a few off-whites. No cream (#f1ead8, #f5ece0): brand/BRAND.md
 * keeps it out of new designs.
 */
export interface Swatch {
  id: string;
  name: string;
  hex: string;
}

export interface SwatchGroup {
  name: string;
  swatches: Swatch[];
}

export const GROUPS: SwatchGroup[] = [
  {
    name: "Oranges",
    swatches: [
      { id: "peach", name: "Peach", hex: "#FFD6C2" },
      { id: "apricot", name: "Apricot", hex: "#FFE1C9" },
      { id: "tangerine", name: "Tangerine", hex: "#FFC6A5" },
    ],
  },
  {
    name: "Yellows",
    swatches: [
      { id: "butter", name: "Butter", hex: "#FFEBB0" },
      { id: "lemon", name: "Lemon", hex: "#FFF2C4" },
      { id: "honey", name: "Honey", hex: "#FADF9E" },
    ],
  },
  {
    name: "Reds",
    swatches: [
      // Warm, toward red-light #ff8163, not pink: green stays above blue.
      { id: "coral", name: "Coral", hex: "#FFB4A0" },
      { id: "poppy", name: "Poppy", hex: "#FFA48E" },
      { id: "brick", name: "Brick", hex: "#EFA191" },
    ],
  },
  {
    name: "Purples",
    swatches: [
      { id: "lavender", name: "Lavender", hex: "#DCD5F2" },
      { id: "lilac", name: "Lilac", hex: "#E8D5F0" },
      { id: "periwinkle", name: "Periwinkle", hex: "#D5DAF5" },
    ],
  },
  {
    name: "Off-whites",
    swatches: [
      { id: "white", name: "White", hex: "#FFFFFF" },
      { id: "ground", name: "Massive ground", hex: "#FFF7F2" },
      { id: "mist", name: "Mist", hex: "#F5F4F8" },
      { id: "stone", name: "Stone", hex: "#F2F0ED" },
    ],
  },
];

export const SWATCHES = GROUPS.flatMap((g) => g.swatches);

/** "Mix": every tile its own colour, the families taken in turn so no two neighbours match. */
export const MIX = "mix";
const byId = (id: string) => SWATCHES.find((s) => s.id === id)!;
const MIX_ORDER = ["peach", "butter", "coral", "lavender", "apricot", "lemon", "poppy", "lilac", "tangerine", "honey", "brick", "periwinkle"];
const MIX_SWATCHES = MIX_ORDER.map(byId);
/** In the Mix, these teammates get an off-white each instead of a colour (José's pick). */
const MIX_PINS: Record<string, string> = {
  "Jason Grad": "white",
  "Josh Korol": "ground",
  "Chen Assayag": "mist",
  "Tatsiana Matlash": "stone",
};

export type Pick = typeof MIX | string;
export const PICKS: readonly Pick[] = [MIX, ...SWATCHES.map((s) => s.id)];

/** The colour of the tile at `index` (whose teammate is `name`) for a pick. */
export function swatchFor(pick: Pick, index: number, name?: string): Swatch {
  if (pick === MIX) {
    const pinned = name && MIX_PINS[name];
    return pinned ? byId(pinned) : MIX_SWATCHES[index % MIX_SWATCHES.length];
  }
  return SWATCHES.find((s) => s.id === pick) ?? MIX_SWATCHES[0];
}

/** The Mix swatch's own look: a wheel of the colours it spreads. */
export const MIX_BACKGROUND = `conic-gradient(${MIX_SWATCHES.map((s) => s.hex).join(", ")}, ${MIX_SWATCHES[0].hex})`;
