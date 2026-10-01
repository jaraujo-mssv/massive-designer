/** Logo.dev serves at most this many logos per minute; past it, requests fail. */
export const LOGO_DEV_PER_MINUTE = 100;

/** How many distinct logos in `urls` come from Logo.dev (img.logo.dev). */
export function countLogoDevUrls(urls: string[]): number {
  const unique = new Set<string>();
  for (const url of urls) {
    try {
      if (new URL(url).hostname === "img.logo.dev") unique.add(url);
    } catch {
      // Not a URL (empty cell, typo): not a Logo.dev logo.
    }
  }
  return unique.size;
}
