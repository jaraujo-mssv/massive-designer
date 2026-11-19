/**
 * The backgrounds for the team's faces: pastel tints of Massive's colours (the logo gradient
 * #F69666 → #F16D65, red #d74939, red-light #ff8163, #f3a07a) and their neighbours, and a few
 * off-whites. No cream (#f1ead8, #f5ece0): brand/BRAND.md keeps it out of new designs.
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

/** "Mix": every tile its own colour, and no two tiles side by side or one above the other of the same family. */
export const MIX = "mix";
const byId = (id: string) => SWATCHES.find((s) => s.id === id)!;
const groupOf = (s: Swatch) => GROUPS.find((g) => g.swatches.includes(s))!;
/** The families Mix spreads (the off-whites only go to the teammates pinned to one). */
const MIX_GROUPS = GROUPS.filter((g) => g.name !== "Off-whites");
/** In the Mix, these teammates get this colour (José's picks). */
const MIX_PINS: Record<string, string> = {
  "Jason Grad": "white",
  "Josh Korol": "ground",
  "Chen Assayag": "mist",
  "Tatsiana Matlash": "stone",
  "Artem Shcherbatiuk": "tangerine",
};

export type Pick = typeof MIX | string;
export const PICKS: readonly Pick[] = [MIX, ...SWATCHES.map((s) => s.id)];

export const swatchById = (id: string): Swatch | undefined => SWATCHES.find((s) => s.id === id);

/**
 * Each tile's colour, in order, for a grid `cols` wide. A single pick is every tile's. Mix gives
 * pinned teammates their colour, and every other tile a family unlike the tiles left of and above
 * it and any pinned tile right of or below it, the families in a diagonal pattern where they can
 * be, each family's shades in turn. With three families no fixed sequence works for every column
 * count, which is why it needs `cols`.
 */
export function swatchesFor(pick: Pick, names: (string | undefined)[], cols: number): Swatch[] {
  if (pick !== MIX) {
    const one = swatchById(pick) ?? MIX_GROUPS[0].swatches[0];
    return names.map(() => one);
  }
  const pinned = names.map((name) => (name && MIX_PINS[name] ? byId(MIX_PINS[name]) : undefined));
  const used = new Map<SwatchGroup, number>();
  const out: Swatch[] = [];
  for (let i = 0; i < names.length; i++) {
    const pin = pinned[i];
    if (pin) {
      out.push(pin);
      continue;
    }
    const row = Math.floor(i / cols);
    const col = i % cols;
    const near = [
      col > 0 ? out[i - 1] : undefined,
      row > 0 ? out[i - cols] : undefined,
      col < cols - 1 ? pinned[i + 1] : undefined,
      pinned[i + cols],
    ];
    const avoid = new Set(near.filter((s): s is Swatch => !!s).map(groupOf));
    const n = MIX_GROUPS.length;
    const order = MIX_GROUPS.map((_, k) => MIX_GROUPS[(row + col + k) % n]);
    const group = order.find((g) => !avoid.has(g)) ?? order[0];
    const k = used.get(group) ?? 0;
    used.set(group, k + 1);
    out.push(group.swatches[k % group.swatches.length]);
  }
  return out;
}

/** The Mix swatch's own look: a wheel of the colours it spreads. */
const WHEEL = MIX_GROUPS[0].swatches.flatMap((_, k) => MIX_GROUPS.map((g) => g.swatches[k]));
export const MIX_BACKGROUND = `conic-gradient(${WHEEL.map((s) => s.hex).join(", ")}, ${WHEEL[0].hex})`;
