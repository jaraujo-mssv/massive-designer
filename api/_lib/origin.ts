import type { IncomingMessage } from 'node:http';

/** This site's origin as the request reached it, for the links in answers (http on localhost in dev). */
export function originOf(req: IncomingMessage): string {
  const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? 'massive-designer.vercel.app');
  const proto = req.headers['x-forwarded-proto'] ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https');
  return `${proto}://${host}`;
}
