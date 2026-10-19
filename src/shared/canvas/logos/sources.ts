/**
 * Where a company's logo can come from: the sheet's own logo cell, or a logo
 * service looked up by the company's domain. Services are asked to answer a
 * missing logo with an error (404), not a placeholder image, so the resolver
 * can tell a miss from a logo (see resolve.ts).
 */

/** A `logoUrl` meaning "show the initials logo", chosen on purpose. Round-trips through TSV as this text. */
export const INITIALS = 'initials';

export type LogoSourceId = 'logodev' | 'google' | 'unavatar' | 'duckduckgo' | 'iconhorse';

export interface LogoSource {
  id: LogoSourceId;
  label: string;
}

/**
 * Tried in this order after the sheet's own logo. Icon Horse isn't here: it
 * answers an unknown domain with a generated letter tile (200), so it would
 * always "win" over the initials logo. It's offered in the picker instead.
 */
export const AUTO_CHAIN: LogoSourceId[] = ['logodev', 'google', 'unavatar', 'duckduckgo'];

/** Offered in the edit popover's logo picker, in this order. */
export const PICKER_SOURCES: LogoSource[] = [
  { id: 'logodev', label: 'Logo.dev' },
  { id: 'google', label: 'Google favicon' },
  { id: 'unavatar', label: 'unavatar' },
  { id: 'duckduckgo', label: 'DuckDuckGo' },
  { id: 'iconhorse', label: 'Icon Horse' },
];

/** A source's logo URL for `domain`, or null when it can't be asked (Logo.dev without a token). */
export function sourceUrl(id: LogoSourceId, domain: string, logoDevToken: string | null): string | null {
  const d = encodeURIComponent(domain);
  switch (id) {
    case 'logodev':
      return logoDevToken
        ? `https://img.logo.dev/${d}?token=${encodeURIComponent(logoDevToken)}&size=256&format=png&fallback=404`
        : null;
    case 'google':
      return `https://www.google.com/s2/favicons?domain=${d}&sz=256`;
    case 'unavatar':
      return `https://unavatar.io/${d}?fallback=false`;
    case 'duckduckgo':
      return `https://icons.duckduckgo.com/ip3/${d}.ico`;
    case 'iconhorse':
      return `https://icon.horse/icon/${d}`;
  }
}

function parseUrl(text: string): URL | null {
  try {
    return new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
}

const bareHost = (host: string) => host.toLowerCase().replace(/^www\./, '');
const looksLikeDomain = (text: string) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(text);

/** The domain a logo-service URL is for, e.g. "meta.com" from an img.logo.dev URL. */
export function domainInLogoUrl(logoUrl: string): string | null {
  const url = parseUrl(logoUrl);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  const firstPath = decodeURIComponent(url.pathname.split('/').filter(Boolean)[0] ?? '');
  let found: string | null = null;
  if (host === 'img.logo.dev' || host === 'logo.clearbit.com' || host === 'unavatar.io') found = firstPath;
  else if (host.endsWith('google.com') && url.pathname.includes('favicon')) found = url.searchParams.get('domain');
  else if (host === 'icons.duckduckgo.com') found = (url.pathname.split('/').pop() ?? '').replace(/\.ico$/i, '');
  else if (host === 'icon.horse') found = decodeURIComponent(url.pathname.split('/').pop() ?? '');
  return found && looksLikeDomain(found) ? bareHost(found) : null;
}

/** Sites that host many companies' projects: their logo isn't the company's. */
const HOSTING_SITES = new Set([
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'apps.apple.com',
  'play.google.com',
  'chromewebstore.google.com',
  'chrome.google.com',
  'addons.mozilla.org',
  'microsoftedge.microsoft.com',
  'huggingface.co',
  'npmjs.com',
  'pypi.org',
  'x.com',
  'twitter.com',
  'linkedin.com',
  'youtube.com',
  'instagram.com',
  'facebook.com',
  'tiktok.com',
  'discord.com',
  'discord.gg',
  't.me',
  'producthunt.com',
  'wikipedia.org',
  'medium.com',
]);
/** Hosts whose every subdomain is someone's site (name.github.io, app.vercel.app…). */
const USER_CONTENT_SUFFIXES = [
  'github.io',
  'vercel.app',
  'netlify.app',
  'pages.dev',
  'notion.site',
  'substack.com',
  'webflow.io',
  'framer.website',
  'carrd.co',
];

/** True for a site that hosts other companies' projects (GitHub, app stores, social…). */
export function isHostingSite(host: string): boolean {
  const h = bareHost(host);
  // Subdomains count too: gist.github.com, en.wikipedia.org, m.youtube.com.
  return [...HOSTING_SITES, ...USER_CONTENT_SUFFIXES].some((site) => h === site || h.endsWith(`.${site}`));
}

/**
 * The domain to look a company's logo up by: the one its logo cell already
 * points at (the sheet author's choice), else its website, unless that's a
 * hosting site like GitHub, whose logo isn't the company's. Null: no lookups.
 */
export function lookupDomain(website: string | undefined, logoUrl: string | undefined): string | null {
  const fromLogo = logoUrl ? domainInLogoUrl(logoUrl) : null;
  if (fromLogo) return fromLogo;
  const fromWebsite = domainFrom(website, undefined);
  return fromWebsite && !isHostingSite(fromWebsite) ? fromWebsite : null;
}

/**
 * The domain a website cell names ("https://muse.meta.com", "stripe.com"),
 * else the one in a logo-service URL in the logo cell, else null. Taken as
 * typed: for lookups use `lookupDomain`, which skips hosting sites.
 */
export function domainFrom(website: string | undefined, logoUrl: string | undefined): string | null {
  if (website?.trim()) {
    const url = parseUrl(website.trim());
    if (url && looksLikeDomain(url.hostname)) return bareHost(url.hostname);
  }
  return logoUrl ? domainInLogoUrl(logoUrl) : null;
}

/** The first Logo.dev token in the sheet's logo URLs (a publishable `pk_…` key), or null. */
export function logoDevTokenFrom(urls: string[]): string | null {
  for (const u of urls) {
    if (!u.includes('img.logo.dev')) continue;
    const token = parseUrl(u)?.searchParams.get('token');
    if (token) return token;
  }
  return null;
}

/** Logo.dev answers a missing logo with a letter placeholder unless asked for a 404. */
export function normalizeLogoUrl(url: string): string {
  if (!url.includes('img.logo.dev')) return url;
  const parsed = parseUrl(url);
  if (!parsed || parsed.searchParams.has('fallback')) return url;
  parsed.searchParams.set('fallback', '404');
  return parsed.href;
}

/** Which picker source a logo URL came from, if any (to highlight it). */
export function sourceOf(logoUrl: string): LogoSourceId | null {
  const host = parseUrl(logoUrl)?.hostname.toLowerCase() ?? '';
  if (host === 'img.logo.dev') return 'logodev';
  if (host.endsWith('google.com') && logoUrl.includes('favicon')) return 'google';
  if (host === 'unavatar.io') return 'unavatar';
  if (host === 'icons.duckduckgo.com') return 'duckduckgo';
  if (host === 'icon.horse') return 'iconhorse';
  return null;
}
