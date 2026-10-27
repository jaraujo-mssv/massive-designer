// Make a big photo small enough to send back: a Vercel function can't answer with more than 4.5 MB, and a
// phone photo is often more. Anything over 4 MB is turned upright, fitted inside 2400 px and saved as WebP
// (which keeps transparency); smaller files, SVGs and icons pass through untouched.
const LIMIT = 4 * 1024 * 1024;
const EDGE = 2400;

export async function shrink(bytes: Buffer, type: string): Promise<{ bytes: Buffer; type: string }> {
  if (bytes.length <= LIMIT || type === 'image/svg+xml' || type === 'image/x-icon') return { bytes, type };
  const { default: sharp } = await import('sharp');
  const out = await sharp(bytes, { animated: false })
    .rotate()
    .resize({ width: EDGE, height: EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  return { bytes: out, type: 'image/webp' };
}
