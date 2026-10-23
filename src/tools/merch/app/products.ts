/**
 * What the Merch tab lists. The files are drawn in scripts/merch/merch.html and rendered into
 * public/merch-files/ by `npm run merch`: a design's `file` is its data-file there.
 */

export interface MerchDesign {
  file: string;
  name: string;
}

export interface MerchProduct {
  id: string;
  name: string;
  /** None yet for the stickers */
  vendor?: { name: string; url: string };
  /** One line each: size, process, files */
  specs: string[];
  /** What to tell the vendor when ordering */
  notes: string;
  /** Round products, in inches: the artwork square, the face (button) or cut (pin), and the safe line */
  guides?: { art: number; face: number; safe: number };
  /** 2:1 artwork, in wider cards */
  wide?: boolean;
  /** Also downloads as the source SVG (public/merch-files/svg/) */
  svg?: boolean;
  designs: MerchDesign[];
}

export const PROOF_PDF = "/merch-files/massive-merch-proof.pdf";

export const pdfUrl = (file: string) => `/merch-files/pdf/${file}.pdf`;
export const pngUrl = (file: string) => `/merch-files/png/${file}.png`;
export const svgUrl = (file: string) => `/merch-files/svg/${file}.svg`;
/** A product's desk photo, from `npm run merch:mockups` */
export const mockupUrl = (id: string) => `/merch-files/mockups/${id}.jpg`;

const DESIGNS = [
  { id: "logo", name: "Logo" },
  { id: "icon", name: "Icon" },
  { id: "tagline", name: "Tagline" },
];

/** Each design in both colourways, as merch.html names them: <product>-<design>-<colourway> */
function round(product: string): MerchDesign[] {
  return DESIGNS.flatMap((design) => [
    { file: `${product}-${design.id}-dark`, name: `${design.name} · Dark` },
    { file: `${product}-${design.id}-white`, name: `${design.name} · White` },
  ]);
}

export const PRODUCTS: MerchProduct[] = [
  {
    id: "button",
    name: '1" button',
    vendor: { name: "Affordable Buttons", url: "https://affordablebuttons.com/product/custom-round-button-438" },
    specs: ["1.31 in square, full bleed", "1 in face, the rest wraps round the edge", "Their r100 template"],
    notes:
      "Upload the PDF. They ask for CMYK and these files are RGB, so check the colours on their proof (or pay the $10 proof check).",
    guides: { art: 1.31, face: 1, safe: 0.94 },
    designs: round("button"),
  },
  {
    id: "pin",
    name: '1" round pin',
    vendor: { name: "Wizard Pins, USA Rush Printed", url: "https://wizardpins.com/products/usa-rush-pins" },
    specs: ["1.125 in square", "1 in circle, 1/16 in bleed", "Digital print"],
    notes:
      "Pick the 1 in circle, silver or gold tone. Their template is on request: ask for it and check the bleed before ordering.",
    guides: { art: 1.125, face: 1, safe: 0.875 },
    designs: round("pin"),
  },
  {
    id: "enamel",
    name: "Soft enamel pin",
    vendor: { name: "PinsFast", url: "https://pinsfast.com/soft-enamel-pins/" },
    specs: ["1.25 in wide", "Die-cut to the outline", "Colour mockup, vector"],
    notes:
      "Black nickel plating, cut to the outer outline. Enamel: orange #F38165 (the logo gradient’s midpoint, nearest Pantone) and white #FFFFFF. Their artist redraws the file and sends a proof.",
    designs: DESIGNS.map((design) => ({ file: `enamel-${design.id}`, name: design.name })),
  },
  {
    id: "sticker",
    name: "Sticker",
    specs: ["10 × 5 cm artboard", "Die-cut to the outline", "Vector PDF or SVG"],
    notes:
      "No vendor picked yet. Order a die-cut sticker at 10 × 5 cm and upload the PDF or SVG: everything outside the outline is transparent and gets cut away.",
    wide: true,
    svg: true,
    designs: [
      { file: "sticker-logo-black", name: "Logo · Black" },
      { file: "sticker-logo-white", name: "Logo · White" },
      { file: "sticker-halftone-black", name: "Halftone · Black" },
      { file: "sticker-halftone-white", name: "Halftone · White" },
    ],
  },
];
