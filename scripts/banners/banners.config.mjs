// Content for the five 85x200cm trade-show banners.
//
// Unified layout: logo · headline · image · sub · URL.
// Each banner's `image` key picks a composition from compositions.mjs.
//
// Edit copy here, then `npm run banners:html` to preview in browser.
// When happy, `npm run banners` to write the print PDFs.

export const banners = [
  {
    slug: "01-flagship",
    image: "flagship-browser",
    headline: "Real-time web access for your AI.",
    sub: "One API. The entire internet. Always live.",
    cta: "joinmassive.com",
    gradient: { x: "85%", y: "82%", color: "#d74939", strength: 0.18 },
  },
  {
    slug: "02-vision",
    image: "three-browsers",
    headline: "Give your AI eyes on the live web.",
    sub: "Your agents see the web the way a real person does. Any page, any country, in real time.",
    cta: "joinmassive.com",
    gradient: { x: "12%", y: "18%", color: "#d74939", strength: 0.16 },
  },
  {
    slug: "03-scale",
    image: "world-map",
    headline: "195+ countries. One API.",
    sub: "Every market your AI needs to reach, through a single endpoint.",
    cta: "joinmassive.com",
    gradient: { x: "50%", y: "50%", color: "#d74939", strength: 0.20 },
  },
  {
    slug: "04-built-for-ai",
    image: "ai-radial",
    headline: "Built for AI. Not for browsers.",
    sub: "Purpose-built for the way agents read, parse, and act on the live web.",
    cta: "joinmassive.com",
    gradient: { x: "50%", y: "50%", color: "#d74939", strength: 0.18 },
  },
  {
    slug: "05-freshness",
    image: "live-strip",
    headline: "Always live. Never cached.",
    sub: "Fresh data on every request. Full browser rendering, in real time. No stale snapshots.",
    cta: "joinmassive.com",
    gradient: { x: "92%", y: "12%", color: "#d74939", strength: 0.18 },
  },
];
