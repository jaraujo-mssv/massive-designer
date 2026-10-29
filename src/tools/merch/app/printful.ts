/**
 * The Printful all-over print garments the pajama prints go on, and each one's print files, as Printful's File
 * guidelines list them. No imports: scripts/merch/printful.mjs reads this file too (through Node's type stripping).
 *
 * A placement is one file, in inches at 150 dpi: 30 × 35 in is 4500 × 5250 px. The panels are filled with the
 * print at actual size; the labels carry the logo.
 */

export interface PrintfulPlacement {
  /** As Printful names it in the Design Maker */
  name: string;
  w: number;
  h: number;
  label?: "branding" | "inside" | "outside";
}

export interface PrintfulGarment {
  /** merch.html names the flats after it: pajamas-<print>-<ground>-<id> */
  id: string;
  name: string;
  /** On the Merch tab's cards, which are narrow */
  short: string;
  /** Printful's catalog id */
  product: number;
  url: string;
  /** "piping": the pajamas (White on the dark ground, Black on white); "thread": the shirt and joggers (to match) */
  trim: "piping" | "thread";
  placements: PrintfulPlacement[];
}

const BRANDING: PrintfulPlacement = { name: "Branding", w: 7, h: 4, label: "branding" };
const INSIDE_LABEL: PrintfulPlacement = { name: "Inside label", w: 2.5, h: 1, label: "inside" };

export const PRINTFUL_DPI = 150;

export const PRINTFUL_GARMENTS: PrintfulGarment[] = [
  {
    id: "top-long",
    name: "Long-sleeve top",
    short: "Long top",
    product: 827,
    url: "https://www.printful.com/custom/womens/sleepwear/all-over-print-womens-long-sleeve-pajama-top",
    trim: "piping",
    placements: [
      { name: "Front", w: 30, h: 35 },
      { name: "Back", w: 30, h: 35 },
      { name: "Left sleeve", w: 30, h: 35 },
      { name: "Right sleeve", w: 30, h: 35 },
      { name: "Details", w: 30, h: 35 },
      { name: "Pocket", w: 30, h: 10 },
      BRANDING,
    ],
  },
  {
    id: "top-short",
    name: "Short-sleeve top",
    short: "Short top",
    product: 828,
    url: "https://www.printful.com/custom/womens/t-shirts/all-over-print-womens-short-sleeve-pajama-top",
    trim: "piping",
    placements: [
      { name: "Front", w: 30, h: 36 },
      { name: "Back", w: 30, h: 36 },
      { name: "Details", w: 30, h: 36 },
      { name: "Left sleeve", w: 30, h: 11 },
      { name: "Right sleeve", w: 30, h: 11 },
      { name: "Pocket", w: 30, h: 11 },
      BRANDING,
    ],
  },
  {
    id: "pants",
    name: "Pants",
    short: "Pants",
    product: 829,
    url: "https://www.printful.com/custom/womens/pants/all-over-print-womens-pajama-pants",
    trim: "piping",
    placements: [{ name: "Front", w: 62, h: 50 }, { name: "Back", w: 62, h: 50 }, BRANDING],
  },
  {
    id: "shorts",
    name: "Shorts",
    short: "Shorts",
    product: 830,
    url: "https://www.printful.com/custom/womens/shorts/all-over-print-womens-pajama-shorts",
    trim: "piping",
    placements: [{ name: "Front", w: 63.5, h: 23 }, { name: "Back", w: 63.5, h: 23 }, BRANDING],
  },
  {
    id: "shirt",
    name: "Button shirt",
    short: "Shirt",
    product: 659,
    url: "https://www.printful.com/custom/mens/all-over-shirts/all-over-print-unisex-hawaiian-shirt",
    trim: "thread",
    placements: [
      { name: "Front", w: 38, h: 50 },
      { name: "Back", w: 38, h: 50 },
      { name: "Details", w: 38, h: 50 },
      { name: "Left sleeve", w: 38, h: 20 },
      { name: "Right sleeve", w: 38, h: 20 },
      { name: "Inside yoke", w: 38, h: 20 },
      INSIDE_LABEL,
    ],
  },
  {
    id: "joggers",
    name: "Joggers",
    short: "Joggers",
    product: 400,
    url: "https://www.printful.com/custom/mens/sweatpants-joggers/all-over-print-recycled-mens-joggers",
    trim: "thread",
    // The waistband and the cuffs are cut from the legs' files
    placements: [{ name: "Right leg", w: 33, h: 50 }, { name: "Left leg", w: 33, h: 50 }, INSIDE_LABEL],
  },
  {
    id: "joggers-wide",
    name: "Wide-leg joggers",
    short: "Wide-leg",
    product: 784,
    url: "https://www.printful.com/custom/mens/sweatpants-joggers/all-over-print-unisex-wide-leg-joggers",
    trim: "thread",
    placements: [
      { name: "Front", w: 65, h: 54 },
      { name: "Back", w: 65, h: 54 },
      INSIDE_LABEL,
      { name: "Outside label", w: 3, h: 3, label: "outside" },
    ],
  },
];
