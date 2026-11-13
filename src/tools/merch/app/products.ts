/**
 * What the Merch tab lists. The files are drawn in scripts/merch/merch.html and rendered into
 * public/merch-files/ by `npm run merch`: a design's `file` is its data-file there.
 */

import { PRINTFUL_GARMENTS } from "./printful";

export interface MerchDesign {
  file: string;
  name: string;
  /** Shown on this colour (the shirt's) instead of the checkerboard */
  ground?: string;
  /** Its preview's width in the tile, for a design much taller than it is wide, so it stays in the square */
  previewWidth?: string;
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
  /** How to order, as numbered steps under the notes */
  steps?: string[];
  /** A table under the steps. A cell's lines after the first are set smaller, as a gloss. */
  table?: { title: string; caption?: string; head: string[]; rows: string[][] };
  /** Round products, in inches: the artwork square, the face (button) or cut (pin), and the safe line */
  guides?: { art: number; face: number; safe: number };
  /** 2:1 artwork, in wider cards */
  wide?: boolean;
  /** Also downloads as the source SVG (public/merch-files/svg/) */
  svg?: boolean;
  /** The one file to send the vendor, when it isn't a design's own: its name in public/merch-files/pdf/ */
  printFile?: string;
  designs: MerchDesign[];
  /** Its mockups, when there's more than the one named after the product: each a [data-mockup] in merch.html */
  mockups?: { id: string; name: string }[];
}

export const PROOF_PDF = "/merch-files/massive-merch-proof.pdf";

export const pdfUrl = (file: string) => `/merch-files/pdf/${file}.pdf`;
export const pngUrl = (file: string) => `/merch-files/png/${file}.png`;
/** A design's small preview for the sidebar, 160 px on a transparent ground (scripts/merch/thumbs.mjs) */
export const thumbUrl = (file: string) => `/merch-files/thumbs/${file}.webp`;
/** A mockup's small square preview for the sidebar, from its middle (scripts/merch/thumbs.mjs) */
export const mockupThumbUrl = (id: string) => `/merch-files/thumbs/mockup-${id}.webp`;
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

/** A pajama print on both grounds, then each Printful garment, as merch.html names them: pajamas-<print>-<ground>-<file> */
function pajamas(print: string): MerchDesign[] {
  return ["dark", "white"].flatMap((ground) => {
    const colour = ground === "dark" ? "Dark" : "White";
    return [
      { file: `pajamas-${print}-${ground}-print`, name: `Print · ${colour}` },
      ...PRINTFUL_GARMENTS.map((garment) => ({ file: `pajamas-${print}-${ground}-${garment.id}`, name: `${garment.short} · ${colour}` })),
    ];
  });
}

/** The T-shirt's colours and sides, as merch.html names their files and mockups: tee-<side>-<colour> */
const TEE_COLOURS = [
  { id: "black", name: "Black", ground: "#1b1b1c" },
  { id: "orange", name: "Terracotta", ground: "#ff9364" },
  { id: "white", name: "White", ground: "#ffffff" },
];
const TEE_SIDES = [
  { id: "front", name: "Front" },
  { id: "back-mountain", name: "Back · Mountain" },
  { id: "back-404", name: "Back · 404" },
];

/** A tote's two files, as merch.html names them: <product>-<ground>. Dark is the ground printed; white, the bare fabric. */
function totes(product: string, previewWidth: string): MerchDesign[] {
  return [
    { file: `${product}-dark`, name: "Dark", ground: "#0a0a0f", previewWidth },
    { file: `${product}-white`, name: "White", ground: "#ffffff", previewWidth },
  ];
}
const TOTE_STEPS = [
  "On Printful, pick Black handles and Black stitching.",
  "Upload the Dark or the White PNG to the all-over print area.",
  "Leave it where it lands: it’s the whole strip the bag is sewn from, both sides, with the designs in place. In the mockup, check that the back is the right way up too.",
];
const TOTE_CAPTION =
  "The file is the whole strip, folded at its middle into the bag’s bottom: the front is its top half, the back its bottom half, upside down. The design is the white halftone sticker, centred on each side’s safe area.";

const PRINTFUL = { name: "Printful", url: "https://www.printful.com/custom-pajamas" };
const PAJAMA_SPECS = [
  `${PRINTFUL_GARMENTS.length} all-over print garments`,
  "Dark: White trim · White: Black trim",
  "npm run merch:printful",
];
const PAJAMA_NOTES =
  "Printful prints the fabric for each order, then cuts and sews it. npm run merch:printful writes every garment’s print files to output/printful/<print>-<ground>/<garment>/, one per placement: open the garment on Printful, upload each file into the placement of the same name, and pick the trim (White on dark, Black on white; the shirt’s and joggers’ thread matches the ground). The Design Maker then makes the mockups. The dark ground is printed onto white fabric, so a stretched seam can show a little white.";

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
  {
    id: "tee",
    name: "T-shirt",
    vendor: {
      name: "Printful, Comfort Colors 1717",
      url: "https://www.printful.com/custom/mens/t-shirts/unisex-garment-dyed-heavyweight-shirt-comfort-colors-1717",
    },
    specs: ["Black, Terracotta or White, S–4XL", "Front and back, 12 × 16 in (30.5 × 40.6 cm)", "PNG at 300 dpi, DTG"],
    notes: "Heavyweight garment-dyed cotton. The front print is included in the price; a back adds $5.95 a shirt.",
    steps: [
      "On Printful, pick the colour: Black, Terracotta (the logo’s coral) or White.",
      "Upload that colour’s Front PNG to Front print, and one of its two backs, Mountain or 404, to Back print.",
      "Leave each file where it lands: it’s the whole print area, with the design already in place.",
    ],
    table: {
      title: "Sizes",
      caption: "The canvas is the file: the whole print area, at 300 dpi. The design is the artwork on it, centred across it, the backs over www.joinmassive.com.",
      head: ["Print", "Canvas", "Design", "From top"],
      rows: [
        [
          "Front\nThe halftone sticker, without its outline",
          "12 × 16 in\n30.5 × 40.6 cm\n3600 × 4800 px",
          "10.5 × 4.1 in\n26.6 × 10.5 cm",
          "1.2 in\n3.1 cm",
        ],
        [
          "Back · Mountain\nThe mountain in the same halftone, over the address",
          "12 × 16 in\n30.5 × 40.6 cm\n3600 × 4800 px",
          "4.7 × 2.7 in\n12 × 6.8 cm",
          "1 in\n2.5 cm",
        ],
        [
          "Back · 404\nExcuse not found over the mountain, then the address",
          "12 × 16 in\n30.5 × 40.6 cm\n3600 × 4800 px",
          "4.7 × 3 in\n12 × 7.6 cm",
          "1 in\n2.5 cm",
        ],
      ],
    },
    designs: TEE_COLOURS.flatMap(({ id, name, ground }) =>
      TEE_SIDES.map((side) => ({ file: `tee-${side.id}-${id}`, name: `${side.name} · ${name}`, ground })),
    ),
    mockups: TEE_COLOURS.flatMap(({ id, name }) =>
      TEE_SIDES.map((side) => ({ id: `tee-${side.id}-${id}`, name: `${side.name} · ${name}` })),
    ),
  },
  {
    id: "tote",
    name: "Tote bag",
    vendor: { name: "Printful, All-Over Print Tote", url: "https://www.printful.com/custom/bags/totes/all-over-print-tote" },
    specs: ["15.75 × 15.35 in, Black handles", "Dark or white, both sides", "PNG at 150 dpi, all-over print"],
    notes:
      "Polyester, printed before it’s cut and sewn, so the dark ground runs to every edge. White doesn’t print: on the white bag, the sticker’s white is the fabric. About $17.60 a bag from Printful, before shipping.",
    steps: TOTE_STEPS,
    table: {
      title: "Sizes",
      caption: TOTE_CAPTION,
      head: ["Side", "Canvas", "Design", "Centre"],
      rows: [
        ["Front\nTop half", "17 × 33 in\n43.2 × 83.8 cm\n2550 × 4950 px", "10 × 3.6 in\n25.4 × 9.2 cm", "8.75 in from the top\n22.2 cm"],
        ["Back\nBottom half, upside down", "17 × 33 in\n43.2 × 83.8 cm\n2550 × 4950 px", "10 × 3.6 in\n25.4 × 9.2 cm", "8.75 in from the bottom\n22.2 cm"],
      ],
    },
    designs: totes("tote", "52%"),
  },
  {
    id: "tote-large",
    name: "Tote bag, large",
    vendor: {
      name: "Printful, All-Over Print Large Tote Bag",
      url: "https://www.printful.com/custom/bags/totes/all-over-print-large-tote-bag",
    },
    specs: ["19.7 × 17.3 in, tapered, Black handles", "Dark or white, both sides", "PNG at 150 dpi, all-over print"],
    notes:
      "The bigger bag: tapered to 13.8 in at the bottom, with an inside pocket, which these files leave blank. Polyester, printed before it’s cut and sewn; on the white bag, the sticker’s white is the fabric. About $23.88 a bag from Printful, before shipping.",
    steps: TOTE_STEPS,
    table: {
      title: "Sizes",
      caption: TOTE_CAPTION,
      head: ["Side", "Canvas", "Design", "Centre"],
      rows: [
        ["Front\nTop half", "21 × 37 in\n53.3 × 94 cm\n3150 × 5550 px", "12 × 4.3 in\n30.5 × 11 cm", "9.85 in from the top\n25 cm"],
        ["Back\nBottom half, upside down", "21 × 37 in\n53.3 × 94 cm\n3150 × 5550 px", "12 × 4.3 in\n30.5 × 11 cm", "9.85 in from the bottom\n25 cm"],
      ],
    },
    designs: totes("tote-large", "57%"),
  },
  {
    id: "mug",
    name: "Mug",
    vendor: { name: "Printful, Ceramic Mug with Color Inside", url: "https://www.printful.com/custom/mugs/personalized/ceramic-mug" },
    specs: ["11 oz, white, orange inside and handle", "The sticker on both sides", "PNG at 300 dpi, sublimation"],
    notes:
      "White ceramic with an orange rim, inside and handle: the print goes on the white. The sticker is on both sides, so it faces you with the handle in either hand. About $8.11 a mug from Printful, before shipping.",
    steps: [
      "On Printful, pick Orange, 11 oz (Orange only comes in 11 oz).",
      "Upload the PNG and leave it where it lands: its two ends meet at the handle.",
      "Check both sides in the mockup.",
    ],
    table: {
      title: "Sizes",
      caption: "The canvas is the file: the whole print area, at 300 dpi, wrapped round the mug.",
      head: ["Print", "Canvas", "Design", "Centre"],
      rows: [
        [
          "Both sides\nEach side of the handle",
          "9 × 3.5 in\n22.9 × 8.9 cm\n2700 × 1050 px",
          "3.15 × 1.1 in\n8 × 2.9 cm, each",
          "2.55 in from the middle\n6.5 cm, either side",
        ],
      ],
    },
    wide: true,
    designs: [{ file: "mug", name: "Both sides", ground: "#ffffff" }],
  },
  {
    id: "bottle",
    name: "Water bottle",
    vendor: {
      name: "Printful, Stainless Steel Water Bottle with a Straw Lid",
      url: "https://www.printful.com/custom/drinkware/water-bottles/stainless-steel-water-bottle-with-a-straw-lid",
    },
    specs: ["32 oz stainless steel, white, straw lid", "The sticker on the front", "PNG at 300 dpi, sublimation"],
    notes:
      "Double-walled and insulated, with a black straw lid. It comes only in white and 32 oz. The print wraps all the way round, its two ends meeting at the back. About $21.80 a bottle from Printful, before shipping.",
    steps: [
      "On Printful, open the bottle (White, 32 oz).",
      "Upload the PNG and leave it where it lands: the sticker is in the middle, opposite the seam.",
    ],
    table: {
      title: "Sizes",
      caption: "The canvas is the file: the whole wrap, at 300 dpi, a little longer than the bottle is round so its ends overlap.",
      head: ["Print", "Canvas", "Design", "Centre"],
      rows: [
        [
          "Front\nOpposite the seam",
          "11.34 × 6.97 in\n28.8 × 17.7 cm\n3402 × 2091 px",
          "3.15 × 1.1 in\n8 × 2.9 cm",
          "In the middle\nAcross and down",
        ],
      ],
    },
    wide: true,
    designs: [{ file: "bottle", name: "Front", ground: "#ffffff", previewWidth: "78%" }],
  },
  {
    id: "bucket-hat",
    name: "Bucket hat",
    vendor: { name: "Rush Order Tees, Sportsman Bucket Hat", url: "https://www.rushordertees.com/catalog/sportsman/bucket-hat/?color=50" },
    specs: ["Black, one size, cotton twill", "The logo on the front, 3.5 in wide", "Vector PDF, embroidery or print"],
    notes:
      "Unstructured, bio-washed cotton chino twill. Embroidered (6 hats at least) or printed (no minimum): the two files are the same logo, one for each order. Thread and screen ink can’t do the logo’s gradient, so the mountain is one orange, #F38165 (the gradient’s midpoint, as on the enamel pin), and the letters are white.",
    steps: [
      "On Rush Order Tees, open the bucket hat and pick Black.",
      "Embroidery: upload the Embroidery PDF and ask for two threads, white and the one closest to #F38165. Their team digitizes it and sends a proof: check the letters and the notch in the mountain held.",
      "Printing: upload the Print PDF, on the front only, in two colours, white and #F38165.",
      "Set it 3.5 in wide, centred on the front of the crown.",
    ],
    table: {
      title: "Sizes",
      caption: "The file is the logo alone, at actual size, on a transparent ground: they place it. Their hat guide puts the most a hat takes at about 4 × 1.75 in.",
      head: ["Method", "Design", "Colours", "Minimum"],
      rows: [
        ["Embroidery\nStitched, digitized by their team", "3.5 × 0.4 in\n8.9 × 1 cm", "White, coral thread\nThe closest to #F38165", "6 hats"],
        ["Print\nFront only", "3.5 × 0.4 in\n8.9 × 1 cm", "White, coral ink\n#F38165", "None"],
      ],
    },
    wide: true,
    designs: [
      { file: "bucket-hat-embroidery", name: "Embroidery", ground: "#1b151a", previewWidth: "88%" },
      { file: "bucket-hat-print", name: "Print", ground: "#1b151a", previewWidth: "88%" },
    ],
  },
  {
    id: "hip-pack",
    name: "Hip pack",
    vendor: {
      name: "Rush Order Tees, Port Authority BG936",
      url: "https://www.rushordertees.com/catalog/port-authority/matte-hip-pack/?color=d57e",
    },
    specs: ["Deep Black, 8 × 5 × 1.7 in", "The logo on the front, 3.5 in wide", "Vector PDF, screen print"],
    notes:
      "Matte polyester, with a 4 × 4 in print area on the front panel (SanMar’s spec), printed in low-cure inks, which the printer handles. The back panel is left blank, as it faces the body. The logo is in two colours, white and #F38165, as on the hat.",
    steps: [
      "On Rush Order Tees, open the hip pack and pick Deep Black.",
      "Upload the PDF to the front, in two colours, white and #F38165.",
      "Set it 3.5 in wide, centred on the front panel.",
    ],
    table: {
      title: "Sizes",
      caption: "The file is the logo alone, at actual size, on a transparent ground: they place it.",
      head: ["Print", "Area", "Design", "Colours"],
      rows: [["Front\nThe top panel", "4 × 4 in\n10.2 × 10.2 cm", "3.5 × 0.4 in\n8.9 × 1 cm", "White, coral\n#F38165"]],
    },
    wide: true,
    designs: [{ file: "hip-pack", name: "Front", ground: "#1d1d1d", previewWidth: "88%" }],
  },
  {
    id: "glass-pc",
    name: "Wooden glass · Prague Crawl afterparty",
    vendor: { name: "Etsy, NieVerblassen", url: "https://www.etsy.com/listing/4424839315" },
    specs: ["8.5 × 9 cm, 300 ml, wood", "Laser engraved, one colour", "6 × 5 cm a side (to confirm)", "Vector PDF"],
    notes:
      "For the Prague Crawl 2027 afterparty, two options to quote: Prague Crawl 2027 on one side and Massive × NodeMaven on the other, or Prague Crawl 2027 by Massive & NodeMaven on one side. The engraving is one colour, so the wordmark loses its gradient W and 3D edges, and the logos their gradients; black in the files is the burn. The listing gives no engraving area, so 6 × 5 cm a side is our guess from its photo. It’s listed from €22 a glass (on sale at €11 when we looked) and made in 5–7 business days.",
    steps: [
      "On Etsy, message NieVerblassen with both mockups and the three PDFs (the PNGs too, if they’d rather have those).",
      "Ask for a price per glass for each option at the quantity you need, whether a second side costs more, and the largest engraving they can do on a side.",
      "Ask whether the small logos in option 2 hold: their thinnest lines are about 0.3 mm. Then ask for a proof before they engrave.",
    ],
    table: {
      title: "Sizes",
      caption: "Each file is the art alone, at actual size, centred on the side it goes on.",
      head: ["Engraving", "Size"],
      rows: [
        ["Option 1 · Side A\nPrague Crawl 2027", "6 × 4.5 cm\n2.36 × 1.77 in"],
        ["Option 1 · Side B\nMassive × NodeMaven", "6 × 2.95 cm\n2.36 × 1.16 in"],
        ["Option 2 · One side\nPrague Crawl 2027 by Massive & NodeMaven", "5.95 × 4.95 cm\n2.34 × 1.95 in"],
      ],
    },
    designs: [
      { file: "glass-pc-side-a", name: "Option 1 · Side A", ground: "#b8643a" },
      { file: "glass-pc-side-b", name: "Option 1 · Side B", ground: "#b8643a" },
      { file: "glass-pc-one-side", name: "Option 2 · One side", ground: "#b8643a" },
    ],
    mockups: [
      { id: "glass-pc-two-sides", name: "Option 1 · Two sides" },
      { id: "glass-pc-one-side", name: "Option 2 · One side" },
    ],
  },
  {
    id: "card",
    name: "Promo card · Darts night",
    vendor: { name: "Reads, Promo Cards", url: "https://reads.ie/products/promo-cards" },
    specs: ["A6, 105 × 148 mm, 3 mm bleed", "Double-sided, 350 gsm silk", "CMYK PDF, 600 dpi"],
    notes:
      "For the darts night before Extract Summit, Mon 9 Nov. Pick A6, double-sided, 350 gsm silk, and upload the print file (two pages, front then back). Cut corners are square, as Reads lists no rounded option. Scan the QR on the final file before ordering, as Reads recharges reprints from file errors at full price, and their page asks you to review AI images yourself.",
    printFile: "card-darts-print",
    designs: [
      { file: "card-darts-front", name: "Front" },
      { file: "card-darts-back", name: "Back" },
    ],
  },
  {
    id: "card-cabinet",
    name: "Cabinet card · Darts night",
    vendor: { name: "Reads, Promo Cards", url: "https://reads.ie/products/promo-cards" },
    specs: ["A6 flat, A7 folded, 3 mm bleed", "Gatefold: 36.5 | 75 | 36.5 mm", "CMYK PDF, 600 dpi"],
    notes:
      "The same card as a fold-out: two doors close over the dartboard, with the QR on the back. Pick A6, double-sided, 350 gsm silk, upload the print file (outside, then inside) and ask for it to flip on the short edge. Reads doesn’t list folding, so confirm it with them and ask for it to be creased, as 350 gsm can crack along the dark print. The folds are 36.5 mm in from each side; by hand, line up with the hinge pins. Print one on paper at 100% and fold it before ordering.",
    printFile: "card-cabinet-print",
    designs: [
      { file: "card-cabinet-closed", name: "Closed (preview)" },
      { file: "card-cabinet-outside", name: "Outside" },
      { file: "card-cabinet-inside", name: "Inside" },
    ],
  },
  {
    id: "brochure-cabinet",
    name: "Tri-fold brochure · Darts night",
    vendor: { name: "Reads, Brochures Tri-fold", url: "https://reads.ie/products/brochures-tri-fold" },
    specs: ["A4 flat, DL folded, 3 mm bleed", "Three equal panels, 99 mm each", "CMYK PDF, 400 dpi"],
    notes:
      "The cabinet card at A4. The doors are as wide as the cabinet, so one closes over the other: the cover opens onto the chalkboard and the flap, then the flap opens onto the board, with the QR on the back. Pick A4 and upload the print file (outside, then inside), and ask for it to flip on the short edge. The flap folds in first, so the cover ends up on top. Reads doesn’t mention creasing, so ask for it, as dark print can crack along a fold. Equal panels leave the flap no room inside the fold, so it can make the closed brochure bow a little: print one on paper at 100% and fold it before ordering.",
    printFile: "brochure-cabinet-print",
    designs: [
      { file: "brochure-cabinet-closed", name: "Closed (preview)", previewWidth: "47%" },
      { file: "brochure-cabinet-opened", name: "Cover opened (preview)", previewWidth: "94%" },
      { file: "brochure-cabinet-outside", name: "Outside" },
      { file: "brochure-cabinet-inside", name: "Inside" },
    ],
  },
  {
    id: "pajamas-mountain",
    name: "Pajamas · Mountain",
    vendor: PRINTFUL,
    specs: PAJAMA_SPECS,
    notes: `The logo’s mountain, in a checkerboard. ${PAJAMA_NOTES}`,
    designs: pajamas("mountain"),
  },
  {
    id: "pajamas-sleepy",
    name: "Pajamas · Sleepy",
    vendor: PRINTFUL,
    specs: PAJAMA_SPECS,
    notes: `The four sleepy mountains: a dream, a zzzZ, a nightcap and a sheep. ${PAJAMA_NOTES}`,
    designs: pajamas("sleepy"),
  },
];
