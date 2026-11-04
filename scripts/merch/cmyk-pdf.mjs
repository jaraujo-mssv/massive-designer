// A print shop's PDF: one page per PNG, each a CMYK JPEG filling the page, with the trim and bleed boxes set.
// Being an image, it has no fonts left to outline, and a printer who asks for "locked or rasterized" takes it.
// Written by hand, as the file is only a few objects and this saves a dependency.
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

// macOS's own SWOP-like profile: our ground #0a0a0f comes out a cool rich black, 75/72/61/80, 288% of ink. sharp's
// built-in "cmyk" would do without it, but makes black 82% yellow, so the ground prints olive.
const MAC_PROFILE = "/System/Library/ColorSync/Profiles/Generic CMYK Profile.icc";

const mm = (value) => (value * 72) / 25.4;
const pt = (value) => value.toFixed(3);

export async function writeCmykPdf(path, pngs, { trimW, trimH, bleed, title }) {
  const profile = existsSync(MAC_PROFILE) ? MAC_PROFILE : "cmyk";
  if (profile === "cmyk") console.warn(`  ⚠ ${title}: no ${MAC_PROFILE}, so the dark ground will print olive. Render this on a Mac.`);
  const pageW = mm(trimW + 2 * bleed);
  const pageH = mm(trimH + 2 * bleed);
  const inset = mm(bleed);
  const media = `[0 0 ${pt(pageW)} ${pt(pageH)}]`;
  const trim = `[${pt(inset)} ${pt(inset)} ${pt(pageW - inset)} ${pt(pageH - inset)}]`;

  // Objects 1 and 2 are the catalog and the page tree, 3 the info; then a page, its content and its image, per PNG
  const pageIds = pngs.map((_, i) => 4 + i * 3);
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Count ${pngs.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
    `<< /Title (${title}) /Producer (scripts/merch/cmyk-pdf.mjs) >>`,
  ];
  for (const [i, png] of pngs.entries()) {
    const id = pageIds[i];
    // The profile converts to CMYK and isn't attached: a press takes DeviceCMYK as its own inks.
    const { data, info } = await sharp(png)
      .flatten({ background: "#ffffff" })
      .withIccProfile(profile, { attach: false })
      .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
      .toBuffer({ resolveWithObject: true });
    const draw = `q ${pt(pageW)} 0 0 ${pt(pageH)} 0 0 cm /Im0 Do Q`;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox ${media} /BleedBox ${media} /TrimBox ${trim} /Resources << /XObject << /Im0 ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`,
      { dict: `/Length ${draw.length}`, stream: Buffer.from(draw) },
      // libvips writes a CMYK JPEG inverted, as Photoshop does, so /Decode turns it back
      {
        dict: `/Type /XObject /Subtype /Image /Width ${info.width} /Height ${info.height} /ColorSpace /DeviceCMYK /BitsPerComponent 8 /Decode [1 0 1 0 1 0 1 0] /Filter /DCTDecode /Length ${data.length}`,
        stream: data,
      },
    );
  }

  const chunks = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")];
  const offsets = [];
  let length = chunks[0].length;
  const add = (chunk) => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, "latin1");
    chunks.push(buffer);
    length += buffer.length;
  };
  objects.forEach((object, i) => {
    offsets.push(length);
    if (typeof object === "string") add(`${i + 1} 0 obj\n${object}\nendobj\n`);
    else {
      add(`${i + 1} 0 obj\n<< ${object.dict} >>\nstream\n`);
      add(object.stream);
      add(`\nendstream\nendobj\n`);
    }
  });
  const xref = length;
  add(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets) add(`${String(offset).padStart(10, "0")} 00000 n \n`);
  add(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  await writeFile(path, Buffer.concat(chunks));
}
