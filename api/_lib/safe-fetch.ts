// Fetch an image from a URL someone else chose (a link's ?photo=, a sheet's logo column), safely:
// only http(s) on the standard ports, never to a private, loopback or link-local address (checked on the
// address actually connected to, and again after every redirect), at most 15 MB in 8 seconds, and only bytes
// that really are an image.
import { BlockList, isIP, type LookupFunction } from 'node:net';
import { lookup } from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { shrink } from './shrink.js';

const MAX_BYTES = 15 * 1024 * 1024;
const TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 3;
const USER_AGENT = 'MassiveDesigner/1.0 (+https://massive-designer.vercel.app)';

/** A fetch that failed for a reason worth telling the person whose link it was. */
export class ImageFetchError extends Error {
  /** 400: the URL itself is refused; 502: the host or its answer failed. */
  status: 400 | 502;
  constructor(message: string, status: 400 | 502) {
    super(message);
    this.status = status;
  }
}

const blocked = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 3],
] as const) {
  blocked.addSubnet(net, prefix, 'ipv4');
}
// IPv4-mapped addresses (::ffff:a.b.c.d) are matched by the IPv4 rules above; BlockList maps them itself.
for (const [net, prefix] of [
  ['::', 127],
  ['64:ff9b::', 96],
  ['100::', 64],
  ['2002::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blocked.addSubnet(net, prefix, 'ipv6');
}

const isBlocked = (address: string) => {
  const family = isIP(address);
  return family === 0 || blocked.check(address, family === 4 ? 'ipv4' : 'ipv6');
};

/** dns.lookup, refusing private addresses, so the address checked is the one connected to. */
const safeLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '', 0);
    const list = addresses as { address: string; family: number }[];
    if (!list.length || list.some((a) => isBlocked(a.address))) {
      return callback(Object.assign(new Error(`${hostname} is not a public host`), { code: 'EBLOCKED' }), '', 0);
    }
    if (options.all) return (callback as unknown as (e: null, a: typeof list) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

/** The image type from its first bytes, or null when it isn't one we accept. */
function sniff(bytes: Buffer, allowIcon: boolean): string | null {
  const ascii = (start: number, end: number) => bytes.subarray(start, end).toString('latin1');
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (ascii(0, 8) === '\x89PNG\r\n\x1a\n') return 'image/png';
  if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(4, 8) === 'ftyp' && /avi[fs]/.test(ascii(8, 32))) return 'image/avif';
  if (allowIcon && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0) return 'image/x-icon';
  const head = bytes.subarray(0, 1024).toString('utf8').replace(/^﻿/, '').trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!doctype svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return 'image/svg+xml';
  return null;
}

function get(url: URL): Promise<http.IncomingMessage> {
  const client = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.get(
      url,
      {
        lookup: safeLookup,
        headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
      resolve,
    );
    req.on('error', reject);
  });
}

async function readBody(res: http.IncomingMessage): Promise<Buffer> {
  const declared = Number(res.headers['content-length']);
  if (declared > MAX_BYTES) {
    res.destroy();
    throw new ImageFetchError('The image is over 15 MB.', 502);
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of res) {
    size += chunk.length;
    if (size > MAX_BYTES) {
      res.destroy();
      throw new ImageFetchError('The image is over 15 MB.', 502);
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** Refuse anything but http(s) to a public host on its standard port. */
function checkUrl(url: URL) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new ImageFetchError('Only http(s) links are allowed.', 400);
  if (url.port && url.port !== (url.protocol === 'https:' ? '443' : '80')) throw new ImageFetchError('Links on other ports are not allowed.', 400);
  if (url.username || url.password) throw new ImageFetchError('Links with a username or password are not allowed.', 400);
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) ? isBlocked(host) : host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
    throw new ImageFetchError(`${url.hostname} is not a public host.`, 400);
  }
}

/**
 * Download an image. `allowIcon` also accepts .ico (favicons, for the logo lookups).
 * Throws an ImageFetchError with a message for the person whose link it was.
 */
export async function fetchImage(raw: string, { allowIcon = false } = {}): Promise<{ bytes: Buffer; type: string }> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ImageFetchError('That is not a valid link.', 400);
  }
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    checkUrl(url);
    let res: http.IncomingMessage;
    try {
      res = await get(url);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'EBLOCKED') throw new ImageFetchError(`${url.hostname} is not a public host.`, 400);
      if (code === 'ABORT_ERR' || (err as Error).name === 'TimeoutError') throw new ImageFetchError(`${url.hostname} took too long to answer.`, 502);
      throw new ImageFetchError(`Couldn't reach ${url.hostname}.`, 502);
    }
    const status = res.statusCode ?? 0;
    if (status >= 300 && status < 400 && res.headers.location) {
      res.resume();
      url = new URL(res.headers.location, url);
      continue;
    }
    if (status !== 200) {
      res.resume();
      throw new ImageFetchError(`${url.hostname} answered ${status}.`, 502);
    }
    const bytes = await readBody(res);
    const type = sniff(bytes, allowIcon);
    if (!type) throw new ImageFetchError('That link is not an image (it may be a web page about the image).', 502);
    return { bytes, type };
  }
  throw new ImageFetchError('That link redirects too many times.', 502);
}

/** fetchImage as a data URL, ready to drop into a page; big photos are shrunk first. */
export async function fetchImageDataUrl(raw: string): Promise<string> {
  const fetched = await fetchImage(raw);
  const { bytes, type } = await shrink(fetched.bytes, fetched.type);
  return `data:${type};base64,${bytes.toString('base64')}`;
}
