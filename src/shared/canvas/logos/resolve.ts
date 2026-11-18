import { useEffect, useState } from 'react';
import { primeImageCache, proxyUrl } from '@/shared/utils/imageDataUrl';
import { useLogoSources } from './LogoSourcesContext';
import { AUTO_CHAIN, domainInLogoUrl, INITIALS, lookupDomain, normalizeLogoUrl, sourceUrl } from './sources';

/** A logo at least this wide is sharp enough to stop looking. */
const SHARP_WIDTH = 64;
/**
 * At or below this a logo is a plain favicon: used only when nothing sharper is
 * found, and flagged as low-res (useLowResLogos). Not a placeholder: every
 * service answers a missing logo with an error, which the proxy passes on.
 */
export const LOW_RES_WIDTH = 16;
/** Probes running at once. */
const MAX_PROBES = 6;

export interface LogoProbe {
  ok: boolean;
  /** Natural width in pixels (SVGs without one count as sharp). */
  width: number;
}

// --- Probing: does a logo URL give a real image, and how big? ---

const probes = new Map<string, Promise<LogoProbe>>();
let running = 0;
const waiting: (() => void)[] = [];

async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_PROBES) await new Promise<void>((resolve) => waiting.push(resolve));
  running++;
  try {
    return await task();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

/** Loads `src` (same-origin or data:), measures it, and draws it to a PNG data URL for the export. */
function decode(src: string): Promise<{ width: number; dataUrl: string | null } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 512;
      let dataUrl: string | null = null;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 256;
        canvas.height = img.naturalHeight || 256;
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/png');
      } catch {
        // Not needed to judge the logo; the export converts it again.
      }
      resolve({ width, dataUrl });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function runProbe(url: string): Promise<LogoProbe> {
  // Uploaded and local images can be measured directly.
  if (!/^https?:\/\//i.test(url)) {
    const decoded = await decode(url);
    return { ok: decoded !== null, width: decoded?.width ?? 0 };
  }
  try {
    // Through the proxy: it answers any upstream error (the services' 404 for
    // "no logo", even when they attach a placeholder image) with a 502.
    const res = await fetch(proxyUrl(url));
    if (!res.ok) return { ok: false, width: 0 };
    const objectUrl = URL.createObjectURL(await res.blob());
    try {
      const decoded = await decode(objectUrl);
      if (!decoded) return { ok: false, width: 0 };
      if (decoded.dataUrl) {
        primeImageCache(url, decoded.dataUrl);
        // The page draws it through the proxy (shownLogoUrl), so the export looks it up by that.
        primeImageCache(proxyUrl(url), decoded.dataUrl);
      }
      return { ok: true, width: decoded.width };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return { ok: false, width: 0 };
  }
}

/**
 * The address to draw a checked logo from: a remote one through the proxy, the
 * way it was checked. Loaded directly, a service can answer the browser
 * differently (unavatar rate-limits browsers with a 429), and a logo that
 * passed its check would fall back to initials.
 */
export function shownLogoUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? proxyUrl(url) : url;
}

/** Checks a logo URL, once per session. */
export function probeLogo(url: string): Promise<LogoProbe> {
  let probe = probes.get(url);
  if (!probe) {
    probe = limited(() => runProbe(url));
    probes.set(url, probe);
  }
  return probe;
}

// --- Resolution: the best logo for a company, or null for initials ---

const resolutions = new Map<string, Promise<string | null>>();
const resolved = new Map<string, string | null>();
const pending = new Set<Promise<unknown>>();

const keyOf = (logoUrl: string, website: string | undefined, token: string | null) =>
  `${logoUrl}|${website ?? ''}|${token ?? ''}`;

const isInitials = (logoUrl: string) => logoUrl.trim().toLowerCase() === INITIALS;

/** The services' logo URLs for `domain`, in AUTO_CHAIN order. */
function chainFor(domain: string | null, token: string | null): string[] {
  if (!domain) return [];
  return AUTO_CHAIN.flatMap((id) => {
    const url = sourceUrl(id, domain, token);
    return url ? [url] : [];
  });
}

/**
 * Probes `urls` in order: the first at least SHARP_WIDTH wide wins outright,
 * else the widest that works (a 16px favicon only when nothing is wider), else
 * null. `known` is a logo already found, which a candidate has to beat.
 */
async function bestOf(urls: string[], known: { url: string; width: number } | null = null): Promise<string | null> {
  let best = known;
  if (best && best.width >= SHARP_WIDTH) return best.url;
  for (const url of new Set(urls)) {
    const probe = await probeLogo(url);
    if (!probe.ok) continue;
    if (probe.width >= SHARP_WIDTH) return url;
    if (!best || probe.width > best.width) best = { url, width: probe.width };
  }
  return best?.url ?? null;
}

/**
 * The logo to show for a company, or null for its initials logo. Never
 * another company's logo:
 *
 * - The sheet's logo is tried first. If it works, it stays, unless it's small
 *   (under SHARP_WIDTH): then only a sharper copy of the same logo is looked
 *   for, from the services, for the domain the logo itself is for.
 * - If it fails (or there is none), the services are asked for the company's
 *   domain (`lookupDomain`: the logo cell's, else its website unless that's a
 *   hosting site like GitHub).
 * - A sheet's logo that's only a favicon (LOW_RES_WIDTH) is asked about as a
 *   failed one, but stays if no service has anything sharper.
 * - `logoUrl === INITIALS` is a choice, not a miss: always null.
 */
export function resolveLogo(logoUrl: string, website: string | undefined, token: string | null): Promise<string | null> {
  const key = keyOf(logoUrl, website, token);
  const known = resolutions.get(key);
  if (known) return known;

  const promise = (async () => {
    if (isInitials(logoUrl)) return null;
    const own = logoUrl.trim();
    if (own) {
      const url = normalizeLogoUrl(own);
      const probe = await probeLogo(url);
      if (probe.ok && probe.width > LOW_RES_WIDTH) {
        // It works. Only a sharper copy of the same logo may replace it: from the
        // domain the logo is for, never the website's (a GitHub repo, an app store).
        // A logo from no known service (a company's CDN, an upload) stays as it is.
        return bestOf(chainFor(domainInLogoUrl(own), token), { url, width: probe.width });
      }
      if (probe.ok) {
        // Only a favicon: anything sharper for the company wins, else it stays.
        return bestOf(chainFor(lookupDomain(website, logoUrl), token), { url, width: probe.width });
      }
    }
    return bestOf(chainFor(lookupDomain(website, logoUrl), token));
  })();

  resolutions.set(key, promise);
  pending.add(promise);
  void promise.then((src) => {
    resolved.set(key, src);
    pending.delete(promise);
  });
  return promise;
}

/** Resolves once every logo lookup started so far has finished (Download JPG waits for this). */
export async function whenLogosSettled(): Promise<void> {
  while (pending.size > 0) await Promise.allSettled([...pending]);
}

/**
 * The logo a finished lookup settled on, for writing the sheet back out: the
 * working URL, or the original cell when it's still running or found nothing.
 */
export function resolvedLogoSync(logoUrl: string, website: string | undefined, token: string | null): string {
  return resolved.get(keyOf(logoUrl, website, token)) ?? logoUrl;
}

/**
 * The logo to draw for a company, or null for its initials logo. Shows the
 * sheet's logo right away (or initials when there is none) and switches once
 * the lookup settles, to the logo it found, through the proxy (shownLogoUrl).
 */
export function useResolvedLogo(logoUrl: string, website: string | undefined): string | null {
  const { logoDevToken } = useLogoSources();
  const key = keyOf(logoUrl, website, logoDevToken);
  const settled = resolved.has(key) ? resolved.get(key)! : undefined;
  const optimistic = logoUrl.trim() && !isInitials(logoUrl) ? logoUrl : null;
  const shown = (found: string | null) => (found ? shownLogoUrl(found) : null);
  const [src, setSrc] = useState<string | null>(settled !== undefined ? shown(settled) : optimistic);

  useEffect(() => {
    let live = true;
    if (!resolved.has(key)) setSrc(optimistic);
    void resolveLogo(logoUrl, website, logoDevToken).then((found) => {
      if (live) setSrc(shown(found));
    });
    return () => {
      live = false;
    };
    // `key` covers logoUrl, website and the token; `optimistic` follows logoUrl.
  }, [key]);

  return src;
}

export interface LogoOwner {
  name: string;
  logoUrl: string;
  website?: string;
}

/**
 * The names of the companies whose logo, once found, is only a favicon
 * (LOW_RES_WIDTH or less), in `companies` order, for a warning above Download.
 * Tools call it beside their LogoSourcesProvider, so they pass the token.
 */
export function useLowResLogos(companies: LogoOwner[], token: string | null): string[] {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    let live = true;
    void Promise.all(
      companies.map(async (c) => {
        const src = await resolveLogo(c.logoUrl, c.website, token);
        if (!src) return null;
        // Already probed by the lookup, so this is the cached answer.
        const { width } = await probeLogo(src);
        return width <= LOW_RES_WIDTH ? c.name : null;
      }),
    ).then((found) => {
      if (live) setNames(found.filter((n): n is string => n !== null));
    });
    return () => {
      live = false;
    };
  }, [companies, token]);

  return names;
}
