interface UserAgentData {
  brands?: { brand: string }[];
}

/**
 * True in Chromium-based browsers (Chrome, Edge, Brave, Arc, Opera…).
 *
 * The canvas tools export through the browser's SVG foreignObject rendering,
 * which Safari and Firefox handle differently (blur filters, fonts), so those
 * get a warning. Chrome on iOS reports "CriOS" and runs on WebKit, so it counts
 * as not Chromium.
 */
export function isChromium(): boolean {
  if (typeof navigator === 'undefined') return true;
  const brands = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData?.brands;
  if (brands) return brands.some((b) => b.brand === 'Chromium');
  const ua = navigator.userAgent;
  return /(Chrome|Chromium|Edg)\//.test(ua) && !/(Firefox|FxiOS)\//.test(ua);
}

/**
 * True on iPhone and iPad, where every browser (Chrome included) runs on
 * WebKit, so "use Chrome" can't be followed. iPadOS reports itself as a Mac,
 * so a Mac with a touch screen counts too.
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
