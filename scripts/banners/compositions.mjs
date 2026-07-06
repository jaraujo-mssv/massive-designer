// HTML compositions used in each banner's image slot.
// All vocabulary borrowed from massive-new-landing (site cards, world map, glow card, pulse dot).

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const landingRepo = "/Users/jochi/Code/Massive/massive-new-landing";

const iconDataUri = (filename) => {
  const buf = readFileSync(resolve(repoRoot, "public", "web-render-api", filename));
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
};

const worldMapSvg = (() => {
  const path = resolve(landingRepo, "public", "images", "brand-assets", "world-map.svg");
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8")
    .replace(/<\?xml[^?]*\?>/, "")
    .replace(/\swidth="\d+"/, "")
    .replace(/\sheight="\d+"/, "");
})();

// ------------------------------------------------------------
// Reusable site card (browser mock with "via Massive" pill)

const siteCard = ({ url, title, sub, accent = "#ff8163", body = "" }) => `
  <div class="site-card">
    <div class="site-chrome">
      <span class="dot red"></span>
      <span class="dot yellow"></span>
      <span class="dot green"></span>
      <div class="site-url">${url}</div>
    </div>
    <div class="site-body" style="--accent:${accent}">
      <div class="site-title">${title}</div>
      ${sub ? `<div class="site-subtitle">${sub}</div>` : ""}
      ${body}
    </div>
    <div class="site-foot">
      <span class="site-status"><span class="dot green tiny"></span>200 OK</span>
      <span class="via-massive">via Massive</span>
    </div>
  </div>
`;

// ------------------------------------------------------------

export const compositions = {
  // 1 — Flagship: one prominent browser card
  "flagship-browser": () =>
    `<div class="comp comp-flagship">
      ${siteCard({
        url: "amazon.com/dp/B0CRDC...",
        title: "Echo Dot (5th Gen)",
        sub: "Smart speaker with Alexa",
        accent: "#ff9900",
        body: `<div class="site-rows">
          <div class="site-row"></div>
          <div class="site-row short"></div>
          <div class="site-row"></div>
        </div>`,
      })}
    </div>`,

  // 2 — Vision: three cascading browser cards
  "three-browsers": () =>
    `<div class="comp comp-three">
      <div class="three-card three-back">
        ${siteCard({
          url: "youtube.com/results?...",
          title: "Top videos this week",
          accent: "#ff0033",
          body: '<div class="site-rows"><div class="site-row"></div><div class="site-row"></div></div>',
        })}
      </div>
      <div class="three-card three-mid">
        ${siteCard({
          url: "nytimes.com/section/...",
          title: "Live news feed",
          accent: "#faf4ec",
          body: '<div class="site-rows"><div class="site-row"></div><div class="site-row short"></div><div class="site-row"></div></div>',
        })}
      </div>
      <div class="three-card three-front">
        ${siteCard({
          url: "amazon.com/dp/B0CRDC...",
          title: "Echo Dot (5th Gen)",
          accent: "#ff9900",
          body: '<div class="site-rows"><div class="site-row"></div><div class="site-row short"></div></div>',
        })}
      </div>
    </div>`,

  // 3 — Scale: the world map from the landing repo
  "world-map": () =>
    `<div class="comp comp-world">${worldMapSvg ?? '<div class="comp-missing">world-map.svg not found</div>'}</div>`,

  // 4 — Built for AI: 6 AI icons orbiting a Massive glow card
  "ai-radial": () => {
    const icons = [
      { name: "Claude",     file: "claude-icon.jpg",     pos: "tl" },
      { name: "ChatGPT",    file: "chatgpt-icon.jpg",    pos: "tr" },
      { name: "Gemini",     file: "gemini-icon.jpg",     pos: "ml" },
      { name: "Perplexity", file: "perplexity-icon.jpg", pos: "mr" },
      { name: "Cursor",     file: "cursor-icon.jpg",     pos: "bl" },
      { name: "Copilot",    file: "copilot-icon.jpg",    pos: "br" },
    ];
    return `<div class="comp comp-radial">
      <div class="radial-grid">
        <div class="radial-cell radial-tl"><img src="${iconDataUri("claude-icon.jpg")}" alt="Claude"></div>
        <div class="radial-cell radial-tr"><img src="${iconDataUri("chatgpt-icon.jpg")}" alt="ChatGPT"></div>
        <div class="radial-center">
          <div class="glow-card-print">
            <div class="glow-card-logo">M</div>
            <div class="glow-card-name">Massive</div>
          </div>
        </div>
        <div class="radial-cell radial-bl"><img src="${iconDataUri("cursor-icon.jpg")}" alt="Cursor"></div>
        <div class="radial-cell radial-br"><img src="${iconDataUri("copilot-icon.jpg")}" alt="Copilot"></div>
        <div class="radial-cell radial-ml"><img src="${iconDataUri("gemini-icon.jpg")}" alt="Gemini"></div>
        <div class="radial-cell radial-mr"><img src="${iconDataUri("perplexity-icon.jpg")}" alt="Perplexity"></div>
      </div>
    </div>`;
  },

  // 5 — Freshness: LIVE badge + timestamp + 3 frozen page thumbnails
  "live-strip": () =>
    `<div class="comp comp-live">
      <div class="live-badge">
        <span class="pulse-dot"></span>
        <span class="live-word">LIVE</span>
      </div>
      <div class="live-timestamp">14:23:51 UTC</div>
      <div class="live-frames">
        <div class="live-frame">
          <div class="live-frame-label">T-3s</div>
          <div class="mini-card"></div>
        </div>
        <div class="live-frame">
          <div class="live-frame-label">T-1s</div>
          <div class="mini-card"></div>
        </div>
        <div class="live-frame">
          <div class="live-frame-label live-now">NOW</div>
          <div class="mini-card current"></div>
        </div>
      </div>
    </div>`,
};
