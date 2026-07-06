import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { compositions } from "./compositions.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

const logoSvg = readFileSync(resolve(repoRoot, "public", "logo.svg"), "utf8")
  .replace(/<\?xml[^?]*\?>/, "")
  .replace(/\swidth="\d+"/, "")
  .replace(/\sheight="\d+"/, "");

const gridSvgDataUri = () => {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">` +
    `<path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(250,244,236,0.07)" stroke-width="1.2"/>` +
    `</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

const hexAlpha = (hex, a) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const gradientBg = (g) =>
  `radial-gradient(ellipse 1100mm 1400mm at ${g.x} ${g.y}, ` +
  `${hexAlpha(g.color, g.strength)} 0%, ${hexAlpha(g.color, g.strength * 0.4)} 28%, transparent 65%)`;

// ------------------------------------------------------------
// Single unified layout: logo · headline · image · sub · URL

const renderInner = (banner) => {
  const composition = compositions[banner.image]
    ? compositions[banner.image]()
    : `<div class="comp-missing">unknown composition: ${banner.image}</div>`;
  return `
    <div class="logo">${logoSvg}</div>
    <div class="headline">${banner.headline}</div>
    <div class="banner-image">${composition}</div>
    <div class="footer">
      <div class="sub">${banner.sub}</div>
      <div class="rule"></div>
      <div class="cta">${banner.cta}</div>
    </div>
  `;
};

// ------------------------------------------------------------

export const BANNER_CSS = `
.banner-page {
  position: relative;
  width: 856mm; height: 2006mm;
  background-color: #0a0a0f;
  background-image: var(--gradient), var(--grid);
  background-size: auto, 100mm 100mm;
  background-position: 0 0, 0 0;
  background-repeat: no-repeat, repeat;
  color: #faf4ec;
  font-family: 'Outfit', sans-serif;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
}
.banner-page * { box-sizing: border-box; margin: 0; padding: 0; }

/* Crop marks */
.banner-page .crop { position: absolute; background: #faf4ec; opacity: 0.85; }
.banner-page .crop.h { width: 3mm; height: 0.5pt; }
.banner-page .crop.v { width: 0.5pt; height: 3mm; }
.banner-page .crop.tl-h { top: 3mm; left: 0; }
.banner-page .crop.tl-v { top: 0; left: 3mm; }
.banner-page .crop.tr-h { top: 3mm; right: 0; }
.banner-page .crop.tr-v { top: 0; right: 3mm; }
.banner-page .crop.bl-h { bottom: 3mm; left: 0; }
.banner-page .crop.bl-v { bottom: 0; left: 3mm; }
.banner-page .crop.br-h { bottom: 3mm; right: 0; }
.banner-page .crop.br-v { bottom: 0; right: 3mm; }

.banner-page .trim {
  position: absolute;
  top: 3mm; left: 3mm;
  width: 850mm; height: 2000mm;
}
.banner-page .safe {
  position: absolute;
  top: 15%; left: 15%;
  width: 70%; height: 70%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 50mm;
}

/* Logo */
.banner-page .logo {
  width: 280mm;
  flex-shrink: 0;
}
.banner-page .logo svg { width: 100%; height: auto; display: block; }

/* Headline */
.banner-page .headline {
  font-weight: 700;
  font-size: 200pt;
  line-height: 0.98;
  letter-spacing: -0.038em;
  color: #faf4ec;
  text-align: center;
  max-width: 100%;
}

/* Image slot — flex-grow so it fills the middle */
.banner-page .banner-image {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;
}
.banner-page .comp {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

/* Footer */
.banner-page .footer {
  flex: 0 0 auto;
  width: 100%;
  text-align: center;
}
.banner-page .sub {
  font-size: 100pt;
  font-weight: 400;
  line-height: 1.15;
  color: rgba(250, 244, 236, 0.78);
  letter-spacing: -0.01em;
}
.banner-page .rule { margin: 30mm auto; height: 1.2pt; background: #faf4ec; opacity: 0.14; max-width: 320mm; }
.banner-page .cta {
  font-size: 100pt;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #faf4ec;
}

/* macOS-style traffic light dots */
.banner-page .dot { width: 6mm; height: 6mm; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.banner-page .dot.red { background: #ff5f57; }
.banner-page .dot.yellow { background: #ffbd2e; }
.banner-page .dot.green { background: #28c840; }
.banner-page .dot.tiny { width: 4mm; height: 4mm; }

/* ============================================================ */
/* Site card (browser mock with "via Massive" pill)             */
/* ============================================================ */
.banner-page .site-card {
  width: 100%;
  background: #13121a;
  border-radius: 6mm;
  border: 0.8pt solid rgba(250, 244, 236, 0.08);
  box-shadow: 0 8mm 32mm rgba(0, 0, 0, 0.45);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.banner-page .site-chrome {
  display: flex;
  align-items: center;
  gap: 4mm;
  padding: 6mm 10mm;
  background: #1a1926;
  border-bottom: 0.6pt solid #222138;
}
.banner-page .site-url {
  flex: 1;
  margin-left: 6mm;
  background: #111019;
  padding: 4mm 8mm;
  border-radius: 2mm;
  font-family: 'JetBrains Mono', monospace;
  font-size: 18pt;
  color: rgba(250, 244, 236, 0.55);
  letter-spacing: -0.005em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.banner-page .site-body {
  flex: 1 1 auto;
  padding: 14mm 16mm;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent, #ff8163) 8%, transparent), transparent 60%),
    #0e0d14;
  display: flex;
  flex-direction: column;
  gap: 8mm;
  min-height: 120mm;
}
.banner-page .site-title {
  font-size: 30pt;
  font-weight: 600;
  color: #faf4ec;
  letter-spacing: -0.01em;
  line-height: 1.1;
}
.banner-page .site-subtitle {
  font-size: 20pt;
  color: rgba(250, 244, 236, 0.55);
  letter-spacing: -0.005em;
}
.banner-page .site-rows {
  display: flex;
  flex-direction: column;
  gap: 4mm;
  margin-top: 4mm;
}
.banner-page .site-row {
  height: 5mm;
  background: rgba(250, 244, 236, 0.08);
  border-radius: 1.5mm;
}
.banner-page .site-row.short { width: 60%; }
.banner-page .site-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6mm 10mm;
  background: #111019;
  border-top: 0.6pt solid #222138;
  font-family: 'JetBrains Mono', monospace;
  font-size: 18pt;
}
.banner-page .site-status {
  display: flex;
  align-items: center;
  gap: 4mm;
  color: rgba(250, 244, 236, 0.55);
  letter-spacing: 0.02em;
}
.banner-page .via-massive {
  color: rgba(215, 73, 57, 0.95);
  background: rgba(215, 73, 57, 0.14);
  padding: 2mm 6mm;
  border-radius: 1.5mm;
  font-weight: 500;
  letter-spacing: 0.04em;
}

/* Comp 1 — flagship single browser card */
.banner-page .comp-flagship { width: 100%; }
.banner-page .comp-flagship .site-card { max-width: 100%; }

/* Comp 2 — three cascading browser cards */
.banner-page .comp-three {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600mm;
}
.banner-page .three-card {
  position: absolute;
  width: 70%;
}
.banner-page .three-back  { top: 0;   left: 0;   transform: rotate(-3deg); opacity: 0.78; }
.banner-page .three-mid   { top: 18%; left: 30%; transform: rotate(2deg); }
.banner-page .three-front { top: 38%; left: 12%; transform: rotate(-1deg); z-index: 2; }

/* Comp 3 — world map */
.banner-page .comp-world {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.banner-page .comp-world svg {
  width: 100%;
  height: auto;
  max-height: 100%;
  display: block;
}

/* Comp 4 — AI icons radial around Massive glow card */
.banner-page .comp-radial {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.banner-page .radial-grid {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  max-height: 100%;
}
.banner-page .radial-cell {
  position: absolute;
  width: 22%;
  aspect-ratio: 1 / 1;
}
.banner-page .radial-cell img {
  width: 100%;
  height: 100%;
  border-radius: 14mm;
  object-fit: cover;
  border: 0.8pt solid rgba(250, 244, 236, 0.14);
  box-shadow: 0 6mm 18mm rgba(0, 0, 0, 0.4);
}
.banner-page .radial-tl { top: 4%;  left: 4%;  }
.banner-page .radial-tr { top: 4%;  right: 4%; }
.banner-page .radial-ml { top: 39%; left: -2%; }
.banner-page .radial-mr { top: 39%; right: -2%; }
.banner-page .radial-bl { bottom: 4%; left: 4%;  }
.banner-page .radial-br { bottom: 4%; right: 4%; }
.banner-page .radial-center {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 32%;
  aspect-ratio: 1 / 1;
}
.banner-page .glow-card-print {
  width: 100%;
  height: 100%;
  border: 1.2pt solid #d74939;
  border-radius: 14mm;
  background: rgba(18, 17, 23, 0.85);
  box-shadow:
    0 0 30pt rgba(215, 73, 57, 0.20),
    0 0 90pt rgba(215, 73, 57, 0.10),
    inset 0 0 40pt rgba(215, 73, 57, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12mm;
}
.banner-page .glow-card-logo {
  font-family: 'Outfit', sans-serif;
  font-size: 120pt;
  font-weight: 800;
  color: #d74939;
  line-height: 1;
}
.banner-page .glow-card-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 100pt;
  font-weight: 500;
  color: rgba(250, 244, 236, 0.85);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Comp 5 — LIVE badge + timestamp + frames */
.banner-page .comp-live {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30mm;
}
.banner-page .live-badge {
  display: flex;
  align-items: center;
  gap: 18mm;
  padding: 18mm 36mm;
  border: 1.5pt solid #d74939;
  border-radius: 999px;
  background: rgba(215, 73, 57, 0.10);
  box-shadow: 0 0 32pt rgba(215, 73, 57, 0.18);
}
.banner-page .pulse-dot {
  width: 28mm; height: 28mm;
  border-radius: 50%;
  background: #d74939;
  box-shadow:
    0 0 0 6mm rgba(215, 73, 57, 0.25),
    0 0 0 12mm rgba(215, 73, 57, 0.10);
}
.banner-page .live-word {
  font-family: 'JetBrains Mono', monospace;
  font-size: 140pt;
  font-weight: 700;
  color: #d74939;
  letter-spacing: 0.06em;
  line-height: 1;
}
.banner-page .live-timestamp {
  font-family: 'JetBrains Mono', monospace;
  font-size: 100pt;
  font-weight: 500;
  color: rgba(250, 244, 236, 0.85);
  letter-spacing: 0.02em;
}
.banner-page .live-frames {
  display: flex;
  gap: 12mm;
  width: 100%;
  justify-content: center;
}
.banner-page .live-frame {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8mm;
  flex: 1;
  max-width: 30%;
}
.banner-page .live-frame-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 100pt;
  color: rgba(250, 244, 236, 0.5);
  letter-spacing: 0.04em;
}
.banner-page .live-frame-label.live-now {
  color: #d74939;
  font-weight: 600;
}
.banner-page .mini-card {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 4mm;
  background:
    linear-gradient(180deg, rgba(255, 129, 99, 0.12), transparent 50%),
    #15141a;
  border: 0.8pt solid rgba(250, 244, 236, 0.10);
}
.banner-page .mini-card.current {
  border-color: rgba(215, 73, 57, 0.55);
  box-shadow: 0 0 18pt rgba(215, 73, 57, 0.20);
}

.banner-page .comp-missing {
  font-family: 'JetBrains Mono', monospace;
  font-size: 36pt;
  color: rgba(250, 244, 236, 0.4);
}
`;

export function renderBannerFragment(banner) {
  const inner = renderInner(banner);
  const style = `--gradient: ${gradientBg(banner.gradient)}; --grid: ${gridSvgDataUri()};`;
  return `<div class="banner-page" data-slug="${banner.slug}" style="${style}">
    <div class="crop h tl-h"></div><div class="crop v tl-v"></div>
    <div class="crop h tr-h"></div><div class="crop v tr-v"></div>
    <div class="crop h bl-h"></div><div class="crop v bl-v"></div>
    <div class="crop h br-h"></div><div class="crop v br-v"></div>
    <div class="trim"><div class="safe">${inner}</div></div>
  </div>`;
}

export function renderBannerHtml(banner) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${banner.slug}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  @page { size: 856mm 2006mm; margin: 0; }
  html, body { width: 856mm; height: 2006mm; margin: 0; background: #0a0a0f; }
  ${BANNER_CSS}
</style>
</head>
<body>${renderBannerFragment(banner)}</body>
</html>`;
}
