/*
 * machine-kit: draws an infographic "machine" for a portrait GIF (1080×1350, light register: white
 * ground, ink line art, one red accent) from a config, and returns render(p) for LoopKit.drive.
 * Projects opt in with meta.json "kits": ["machine"]; load lib/machine-kit.js after lib/loop-kit.js
 * and link lib/machine.css. Keep the loop short (data-duration="3").
 *
 *   const render = MachineKit.build(document.getElementById("stage"), {
 *     title: "Keep every version<br />of a terms page.",
 *     why: "One sentence on why this archive is worth having.",
 *     stack: [                                            // the parts, in the dashed card in the footer
 *       { icon: "assets/brand/partner-app.png", name: "Lightpanda", role: "Browser for AI agents" },
 *       { icon: "assets/brand/massive-app.png", name: "Massive", role: "Residential IPs, 195+ countries" },
 *       { icon: "code", name: "Your agent", role: "Schedule, diff, storage" },
 *     ],
 *     room: "proxy",                                      // or "api" (see below)
 *     ticker: [{ cc: "US" }, { cc: "DE" }],               // optional; {cc} etc. in any text step through it
 *     stations: [
 *       { kind: "clock", label: "Schedule", value: "Every day, 06:00 UTC<br /><code>0 6 * * *</code>" },
 *       { kind: "terminal", lines: ["$ lightpanda fetch \\", ...] },
 *       { kind: "engine", label: "Lightpanda", value: "Runs the page's JavaScript" },
 *       { kind: "network", label: "Massive", value: "A residential IP in <b>{cc}</b>" },
 *       { kind: "diff", label: "Your diff", value: "<code>git diff --word-diff</code>" },
 *       { kind: "alert", label: "Notify", value: "Webhook when it changes" },
 *     ],
 *     archive: { label: "<code>terms/&lt;date&gt;.md</code>", note: "one dated copy a day", card: "doc",
 *                slots: ["today", "−1 d", "−2 d", "−3 d", "−4 d"] },
 *   });
 *
 * Rooms:
 *  - "proxy": Lightpanda's own requests go out through Massive. The network station is a side loop
 *    off the engine: the request leaves as a red packet and the page comes back as an ink sheet.
 *    Main line, in a snake: trigger → command ↓ engine ↓ output ← extra, then the archive.
 *  - "api": Massive answers first (Web Search, /ai), then Lightpanda opens what it returned.
 *    Main line: trigger → command ↓ network ← engine ↓ output → extra, then the archive.
 *
 * The stations run in parallel, like a production line: each pipe's packet leaves a beat after the
 * previous one, so several are in flight at once, each station lights as its packet lands, and the
 * archive files a new card while the others step back one slot. Every motion is periodic in p and
 * the archive cards are identical apart from the "new" tab, so the last frame flows into the first.
 * Nothing here shows a screenshot: neither Lightpanda ("no graphical rendering") nor Massive's Web
 * Render API returns one; pages come back as HTML or Markdown.
 * Station kinds: clock, hook, terminal, panel, network, engine, extract, diff, list, alert, search, ai, render.
 *  - terminal: { lines: [...] }, a command in mono.
 *  - panel: { label: "Request", rows: [["proxy", "<code>…</code>"], ...] }, settings or API parameters on the
 *    ink card; keys and values are HTML, so wrap code in <code> (the mono rule).
 * Stack items: { icon, name, role }, or { logo, role } for a wordmark that already spells the name.
 * Archive cards: doc, table, chat, file, shot (only for partners that really return screenshots).
 */
(function () {
  const { frac, clamp, lerp, ease, since, env, TAU } = window.LoopKit;
  const NS = "http://www.w3.org/2000/svg";
  const INK = "#171615";
  const RED = "#d54635";
  const FILL = "#ffffff";
  const WELL = "#fff6f1"; // insets: gear holes, the clock face
  const DIM = "rgba(23, 22, 21, 0.38)";

  // Layout, in stage pixels: three rows of two cards, then the archive cabinet.
  const COL = [80, 580];
  const ROW = [340, 530, 720];
  const W = 420;
  const H = 160;
  const ARCH = { x: 80, y: 910, w: 920 }; // keep in step with .mk-arch top in machine.css
  const CARD = { w: 150, gap: 31.5 };
  const SLOTS = 5;
  const ROOMS = {
    proxy: { line: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 0]], side: [1, 0] },
    api: { line: [[0, 0], [0, 1], [1, 1], [1, 0], [2, 0], [2, 1]], side: null },
  };

  // Timing, as loop phases. Pipe k's packet leaves at A0 + k·STEP and lands TRAVEL later, so with
  // STEP < TRAVEL two or three are in flight at once. The rest of the loop holds on the still.
  const A0 = 0.02;
  const STEP = 0.09;
  const TRAVEL = 0.22;
  const SIDE = { travel: 0.14, stay: 0.04 }; // the engine's round trip through Massive
  const SHIFT = 0.12;
  const DASH = 14; // pipe dash period; the dashes scroll a whole number of periods per loop

  const KIND_LABEL = {
    clock: "Trigger",
    hook: "Trigger",
    terminal: "Command",
    network: "Network",
    engine: "Browser",
    extract: "Extract",
    diff: "Compare",
    list: "Compare",
    alert: "Notify",
    search: "Search",
    ai: "Ask",
    render: "Render",
  };

  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs || {}) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function div(cls, parent, html) {
    const node = document.createElement("div");
    if (cls) node.className = cls;
    if (html !== undefined) node.innerHTML = html;
    if (parent) parent.appendChild(node);
    return node;
  }
  const pad2 = (n) => String(n).padStart(2, "0");

  function gearPath(teeth, r) {
    const depth = r * 0.2;
    const hp = Math.PI / teeth;
    const pts = [];
    for (let t = 0; t < teeth; t++) {
      const a = t * 2 * hp;
      pts.push([r - depth, a - 0.55 * hp], [r, a - 0.3 * hp], [r, a + 0.3 * hp], [r - depth, a + 0.55 * hp]);
    }
    return "M" + pts.map(([rr, aa]) => `${(rr * Math.cos(aa)).toFixed(2)} ${(rr * Math.sin(aa)).toFixed(2)}`).join(" L") + " Z";
  }
  function gear(parent, x, y, teeth, r, fill) {
    const g = el("g", { transform: `translate(${x} ${y})` }, parent);
    const spin = el("g", {}, g);
    el("path", { d: gearPath(teeth, r), fill, stroke: INK, "stroke-width": 2.5, "stroke-linejoin": "round" }, spin);
    el("circle", { r: r * 0.3, fill: WELL, stroke: INK, "stroke-width": 2.5 }, spin);
    el("line", { x1: 0, y1: -r * 0.3, x2: 0, y2: -r * 0.62, stroke: INK, "stroke-width": 2.5 }, spin);
    el("line", { x1: 0, y1: r * 0.3, x2: 0, y2: r * 0.62, stroke: INK, "stroke-width": 2.5 }, spin);
    return spin;
  }
  const docLines = (parent, x, y, w, widths, color) =>
    widths.map((f, i) => el("rect", { x, y: y + i * 9, width: w * f, height: 4, rx: 2, fill: color || DIM }, parent));

  // Each part draws into a 108×108 box and returns update(p, s, e): s = seconds since the job
  // reached this station, e = its 0–1 pulse.
  const PARTS = {
    clock(svg, fire) {
      const spin = gear(svg, 54, 54, 10, 46, FILL);
      el("circle", { cx: 54, cy: 54, r: 28, fill: WELL, stroke: INK, "stroke-width": 2.5 }, svg);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        const r1 = i % 3 ? 23 : 20;
        el("line", { x1: 54 + r1 * Math.sin(a), y1: 54 - r1 * Math.cos(a), x2: 54 + 26 * Math.sin(a), y2: 54 - 26 * Math.cos(a), stroke: INK, "stroke-width": i % 3 ? 1.5 : 2.5 }, svg);
      }
      const hand = el("line", { x1: 54, y1: 54, x2: 54, y2: 34, stroke: RED, "stroke-width": 3.5, "stroke-linecap": "round" }, svg);
      el("circle", { cx: 54, cy: 54, r: 4, fill: INK }, svg);
      return (p) => {
        spin.setAttribute("transform", `rotate(${-360 * p})`);
        hand.setAttribute("transform", `rotate(${360 * frac(p - fire)} 54 54)`); // passes 12 as the job fires
      };
    },
    hook(svg) {
      // A deploy: commits ride a branch line into the hook.
      el("line", { x1: 10, y1: 54, x2: 74, y2: 54, stroke: INK, "stroke-width": 3 }, svg);
      [14, 36, 58].forEach((x) => el("circle", { cx: x, cy: 54, r: 7, fill: FILL, stroke: INK, "stroke-width": 2.5 }, svg));
      el("path", { d: "M74 54 C92 54 96 30 80 26 C70 24 66 34 70 40", fill: "none", stroke: INK, "stroke-width": 3.5, "stroke-linecap": "round" }, svg);
      const dot = el("circle", { cx: 58, cy: 54, r: 7, fill: RED }, svg);
      return (p, s, e) => dot.setAttribute("opacity", 0.35 + 0.65 * e);
    },
    network(svg) {
      el("circle", { cx: 54, cy: 54, r: 48, fill: "none", stroke: INK, "stroke-opacity": 0.3, "stroke-width": 2, "stroke-dasharray": "4 6" }, svg);
      el("circle", { cx: 54, cy: 54, r: 34, fill: FILL, stroke: INK, "stroke-width": 2.5 }, svg);
      el("ellipse", { cx: 54, cy: 54, rx: 14, ry: 34, fill: "none", stroke: INK, "stroke-width": 2 }, svg);
      el("line", { x1: 20, y1: 54, x2: 88, y2: 54, stroke: INK, "stroke-width": 2 }, svg);
      el("path", { d: "M25 38 Q54 46 83 38 M25 70 Q54 62 83 70", fill: "none", stroke: INK, "stroke-width": 1.5 }, svg);
      const orbit = el("g", {}, svg);
      el("circle", { cx: 54, cy: 6, r: 6, fill: RED }, orbit);
      el("circle", { cx: 54, cy: 102, r: 4, fill: INK }, orbit);
      return (p) => orbit.setAttribute("transform", `rotate(${360 * p} 54 54)`);
    },
    engine(svg) {
      const big = gear(svg, 42, 60, 12, 38, FILL);
      const small = gear(svg, 84, 28, 6, 19, RED);
      // Six teeth pass per loop on both gears: the big one turns half a turn (it looks the same after
      // 180°), the small one a whole turn. Slow enough not to strobe on a short loop.
      return (p) => {
        big.setAttribute("transform", `rotate(${180 * p})`);
        small.setAttribute("transform", `rotate(${30 - 360 * p})`);
      };
    },
    extract(svg) {
      el("path", { d: "M12 14 H96 L68 56 H40 Z", fill: FILL, stroke: INK, "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
      el("rect", { x: 44, y: 56, width: 20, height: 10, fill: FILL, stroke: INK, "stroke-width": 2.5 }, svg);
      const rows = [0, 1, 2].map((i) => el("rect", { x: 22, y: 76 + i * 10, width: 64, height: 6, rx: 3, fill: DIM }, svg));
      const bits = [0, 1, 2].map((i) => el("rect", { x: 36 + i * 14, y: 0, width: 9, height: 9, rx: 2, fill: RED, opacity: 0 }, svg));
      return (p, s, e) => {
        bits.forEach((b, i) => {
          const t = (s - i * 0.1) / 0.3;
          b.setAttribute("opacity", t > 0 && t < 1 ? 1 : 0);
          b.setAttribute("y", lerp(-6, 44, clamp(t)));
        });
        rows[2].setAttribute("fill", RED);
        rows[2].setAttribute("opacity", 0.3 + 0.7 * e);
      };
    },
    diff(svg) {
      el("rect", { x: 4, y: 12, width: 44, height: 84, rx: 5, fill: FILL, stroke: INK, "stroke-width": 2.5 }, svg);
      el("rect", { x: 60, y: 12, width: 44, height: 84, rx: 5, fill: FILL, stroke: INK, "stroke-width": 2.5 }, svg);
      docLines(svg, 12, 24, 28, [1, 0.8, 0.95, 0.6, 0.9, 0.7, 0.85]);
      docLines(svg, 68, 24, 28, [1, 0.8, 0.95, 0.6, 0.9, 0.7, 0.85]);
      const strike = el("rect", { x: 9, y: 40, width: 34, height: 6, rx: 2, fill: RED }, svg);
      const add = el("rect", { x: 65, y: 40, width: 34, height: 15, rx: 2, fill: RED }, svg);
      return (p, s, e) => {
        strike.setAttribute("opacity", 0.3 + 0.7 * e);
        add.setAttribute("opacity", 0.22 + 0.6 * e);
      };
    },
    list(svg) {
      el("rect", { x: 6, y: 10, width: 96, height: 88, rx: 6, fill: FILL, stroke: INK, "stroke-width": 2.5 }, svg);
      const marks = [];
      [0, 1, 2, 3].forEach((i) => {
        const y = 24 + i * 19;
        const sign = i === 1 ? "+" : i === 3 ? "−" : "";
        // 22px bold counts as large text, so the red sign passes contrast.
        if (sign) marks.push(el("text", { x: 14, y: y + 8, "font-family": "Outfit, sans-serif", "font-size": 22, "font-weight": 800, fill: RED }, svg));
        if (sign) marks[marks.length - 1].textContent = sign;
        el("rect", { x: 32, y, width: 60 - (i % 2) * 14, height: 6, rx: 3, fill: DIM }, svg);
      });
      return (p, s, e) => marks.forEach((m) => m.setAttribute("opacity", 0.4 + 0.6 * e));
    },
    alert(svg) {
      const bell = el("g", {}, svg);
      el("path", { d: "M30 70 C34 66 34 60 34 48 C34 34 44 26 54 26 C64 26 74 34 74 48 C74 60 74 66 78 70 Z", fill: FILL, stroke: INK, "stroke-width": 2.5, "stroke-linejoin": "round" }, bell);
      el("path", { d: "M47 76 C49 84 59 84 61 76", fill: "none", stroke: INK, "stroke-width": 2.5 }, bell);
      el("circle", { cx: 54, cy: 22, r: 4, fill: INK }, bell);
      const waves = el("path", { d: "M20 40 Q14 50 20 60 M88 40 Q94 50 88 60", fill: "none", stroke: RED, "stroke-width": 3, "stroke-linecap": "round", opacity: 0 }, svg);
      return (p, s, e) => {
        bell.setAttribute("transform", `rotate(${Math.sin(TAU * 2.5 * s) * 14 * e} 54 22)`);
        waves.setAttribute("opacity", e);
      };
    },
    search(svg) {
      el("rect", { x: 6, y: 10, width: 96, height: 88, rx: 6, fill: FILL, stroke: INK, "stroke-width": 2.5 }, svg);
      const rows = [0, 1, 2, 3].map((i) => el("rect", { x: 16, y: 24 + i * 18, width: 76 - i * 8, height: 6, rx: 3, fill: DIM }, svg));
      el("circle", { cx: 74, cy: 72, r: 14, fill: WELL, stroke: INK, "stroke-width": 3 }, svg);
      el("line", { x1: 84, y1: 82, x2: 98, y2: 96, stroke: INK, "stroke-width": 4, "stroke-linecap": "round" }, svg);
      return (p, s, e) => rows.forEach((r, i) => r.setAttribute("fill", e > 0.05 && i === Math.min(3, Math.floor(s / 0.12)) ? RED : DIM));
    },
    ai(svg) {
      el("rect", { x: 4, y: 14, width: 70, height: 40, rx: 10, fill: FILL, stroke: INK, "stroke-width": 2.5 }, svg);
      el("rect", { x: 34, y: 60, width: 70, height: 40, rx: 10, fill: FILL, stroke: INK, "stroke-width": 2.5 }, svg);
      docLines(svg, 14, 26, 50, [1, 0.7]);
      const reply = docLines(svg, 44, 72, 50, [1, 0.85]);
      return (p, s, e) => reply.forEach((r) => r.setAttribute("fill", e > 0.05 ? RED : DIM));
    },
    render(svg) {
      // A page goes in as markup and comes out as text (Web Render returns HTML or Markdown).
      el("rect", { x: 4, y: 14, width: 44, height: 80, rx: 5, fill: FILL, stroke: INK, "stroke-width": 2.5 }, svg);
      const tags = el("text", { x: 10, y: 34, "font-family": "Outfit, sans-serif", "font-size": 12, "font-weight": 700, fill: INK }, svg);
      tags.textContent = "</>";
      docLines(svg, 10, 46, 30, [1, 0.7, 0.9, 0.6, 0.8]);
      el("path", { d: "M52 54 L60 54 M56 50 L60 54 L56 58", fill: "none", stroke: INK, "stroke-width": 2.5 }, svg);
      el("rect", { x: 64, y: 14, width: 40, height: 80, rx: 5, fill: FILL, stroke: INK, "stroke-width": 2.5 }, svg);
      const md = docLines(svg, 70, 26, 28, [0.6, 1, 0.8, 1, 0.7, 0.9, 0.5]);
      return (p, s, e) => md.forEach((r, i) => r.setAttribute("fill", e > 0.05 && i < Math.floor(s / 0.06) + 1 ? RED : DIM));
    },
  };

  // Archive cards: identical apart from the "new" tab, so the stack can step back one slot per loop.
  const CARDS = {
    doc(svg) {
      docLines(svg, 14, 38, 120, [0.7, 1, 0.9, 1, 0.55]);
    },
    table(svg) {
      el("rect", { x: 12, y: 36, width: 122, height: 10, rx: 3, fill: INK, opacity: 0.55 }, svg);
      [0, 1, 2, 3].forEach((i) => {
        el("rect", { x: 12, y: 54 + i * 10, width: 60, height: 5, rx: 2, fill: DIM }, svg);
        el("rect", { x: 96, y: 54 + i * 10, width: 38, height: 5, rx: 2, fill: DIM }, svg);
      });
    },
    chat(svg) {
      el("rect", { x: 12, y: 34, width: 86, height: 22, rx: 8, fill: "none", stroke: DIM, "stroke-width": 2 }, svg);
      el("rect", { x: 48, y: 62, width: 86, height: 28, rx: 8, fill: "none", stroke: DIM, "stroke-width": 2 }, svg);
      docLines(svg, 20, 42, 66, [1]);
      docLines(svg, 56, 70, 70, [1, 0.6]);
    },
    shot(svg) {
      // A screenshot: browser chrome over a page with an image block.
      el("rect", { x: 12, y: 30, width: 122, height: 64, rx: 4, fill: "none", stroke: DIM, "stroke-width": 2 }, svg);
      el("line", { x1: 12, y1: 40, x2: 134, y2: 40, stroke: DIM, "stroke-width": 2 }, svg);
      [0, 1, 2].forEach((i) => el("circle", { cx: 19 + i * 6, cy: 35, r: 1.6, fill: DIM }, svg));
      el("rect", { x: 20, y: 47, width: 48, height: 38, rx: 3, fill: RED, opacity: 0.22 }, svg);
      docLines(svg, 76, 50, 50, [1, 0.8, 0.9, 0.6]);
    },
    file(svg) {
      el("path", { d: "M14 34 H96 L114 52 V92 H14 Z", fill: "none", stroke: DIM, "stroke-width": 2 }, svg);
      docLines(svg, 24, 58, 80, [1, 0.8, 0.9]);
    },
  };

  // "Your code" in the stack card: a terminal glyph, since it's whatever runs the schedule and diff.
  const CODE_ICON =
    '<svg viewBox="0 0 52 52" width="52" height="52"><rect width="52" height="52" rx="12" fill="#171615" />' +
    '<path d="M14 20 L21 26 L14 32" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />' +
    '<line x1="25" y1="33" x2="38" y2="33" stroke="#f3a07a" stroke-width="3.5" stroke-linecap="round" /></svg>';

  function build(stage, cfg) {
    const room = ROOMS[cfg.room] || ROOMS.proxy;
    const ticker = cfg.ticker && cfg.ticker.length ? cfg.ticker : [{}];
    const fill = (text, t) => String(text || "").replace(/\{(\w+)\}/g, (_, k) => (t[k] !== undefined ? t[k] : `{${k}}`));
    const dynamic = []; // [element, template, suffix]: text that steps with the ticker

    // In the proxy room the network station is a side loop off the engine.
    const sideCfg = cfg.room !== "api" ? cfg.stations.find((s) => s.kind === "network") : null;
    const line = cfg.stations.filter((s) => s !== sideCfg).slice(0, room.line.length);
    const engineAt = line.findIndex((s) => s.kind === "engine");
    const pos = (rc) => ({ x: COL[rc[1]], y: ROW[rc[0]] });

    // Pipe k leaves station k at leave[k] and lands TRAVEL later; a station lights when its pipe lands.
    // The last pipe runs into the archive. The engine's round trip through Massive starts when it lights.
    const leave = line.map((s, k) => A0 + k * STEP);
    const lightAt = line.map((s, k) => (k === 0 ? A0 : leave[k - 1] + TRAVEL));
    const archiveAt = leave[line.length - 1] + TRAVEL;
    const sideGo = sideCfg ? lightAt[engineAt] : 0;
    const sideBack = sideGo + SIDE.travel + SIDE.stay;
    if (Math.max(archiveAt + SHIFT, sideCfg ? sideBack + SIDE.travel : 0) > 0.95) {
      console.warn("[machine-kit] the machine doesn't settle before the loop ends");
    }

    // The cabinet fills from the side the last station is on.
    const lastRC = room.line[line.length - 1];
    const fromRight = lastRC[1] === 1;
    const slotX = (s) => (fromRight ? ARCH.w - 22 - CARD.w - s * (CARD.w + CARD.gap) : 22 + s * (CARD.w + CARD.gap));
    const dropX = ARCH.x + slotX(0) + CARD.w / 2;

    div("mk-title", stage, cfg.title);
    div("mk-why", stage, cfg.why);

    // The stack: who does what, as a card like the stations.
    if (cfg.stack) {
      const card = div("mk-stack", stage);
      const parts = div("parts", card);
      for (const it of cfg.stack) {
        if (it.logo) {
          // A wordmark already spells the name: show it whole, with the role under it.
          div("part wm", parts, `<div><img class="wm" src="${it.logo}" alt="${it.name || ""}" /><div class="role">${it.role}</div></div>`);
          continue;
        }
        const part = div("part", parts);
        div("ic", part, it.icon === "code" ? CODE_ICON : `<img src="${it.icon}" alt="" />`);
        div("", part, `<div class="name">${it.name}</div><div class="role">${it.role}</div>`);
      }
    }

    // Pipes and packets, under the cards.
    const pipes = el("svg", { class: "mk-pipes", width: 1080, height: 1350, viewBox: "0 0 1080 1350" }, stage);
    const join = (aRC, bRC) => {
      const a = pos(aRC);
      const b = pos(bRC);
      if (a.y === b.y) {
        const y = a.y + H / 2;
        return a.x < b.x ? [[a.x + W, y], [b.x, y]] : [[a.x, y], [b.x + W, y]];
      }
      const x = a.x + W / 2;
      return [[x, a.y + H], [x, b.y]];
    };
    const segments = line.map((s, k) => (k < line.length - 1 ? join(room.line[k], room.line[k + 1]) : [[dropX, pos(lastRC).y + H], [dropX, ARCH.y]]));
    const sideSeg = sideCfg ? join(room.line[engineAt], room.side) : null;

    const flows = [];
    function pipe([[x1, y1], [x2, y2]]) {
      const horiz = y1 === y2;
      const [lx, ly] = [Math.min(x1, x2), Math.min(y1, y2)];
      const len = Math.abs(x2 - x1) + Math.abs(y2 - y1);
      el("rect", horiz ? { x: lx, y: ly - 11, width: len, height: 22, fill: FILL } : { x: lx - 11, y: ly, width: 22, height: len, fill: FILL }, pipes);
      const edge = { stroke: INK, "stroke-opacity": 0.45, "stroke-width": 2 };
      if (horiz) {
        el("line", { x1: lx, y1: ly - 11, x2: lx + len, y2: ly - 11, ...edge }, pipes);
        el("line", { x1: lx, y1: ly + 11, x2: lx + len, y2: ly + 11, ...edge }, pipes);
      } else {
        el("line", { x1: lx - 11, y1: ly, x2: lx - 11, y2: ly + len, ...edge }, pipes);
        el("line", { x1: lx + 11, y1: ly, x2: lx + 11, y2: ly + len, ...edge }, pipes);
      }
      for (const [fx, fy] of [[x1, y1], [x2, y2]]) {
        el("rect", horiz ? { x: fx - 3, y: fy - 16, width: 6, height: 32, rx: 2, fill: INK } : { x: fx - 16, y: fy - 3, width: 32, height: 6, rx: 2, fill: INK }, pipes);
      }
      flows.push(el("line", { x1, y1, x2, y2, stroke: INK, "stroke-opacity": 0.35, "stroke-width": 3, "stroke-dasharray": `6 ${DASH - 6}` }, pipes));
    }
    segments.forEach(pipe);
    if (sideSeg) pipe(sideSeg);
    const packet = () => el("rect", { width: 16, height: 16, rx: 3, fill: RED, opacity: 0 }, pipes);
    const packets = segments.map(packet);
    const request = sideCfg ? packet() : null;
    const sheet = el("rect", { width: 14, height: 18, rx: 2, fill: INK, opacity: 0 }, pipes);

    // Stations.
    function station(st, rc, number) {
      const { x, y } = pos(rc);
      const card = div(`mk-st ${st.kind}`, stage);
      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
      const lit = div("lit", card);
      let update = () => {};
      // The step number sits with the title; no eyebrow repeating it.
      const title = `<span class="n">${number}</span> ${st.label || KIND_LABEL[st.kind] || st.kind}`;
      if (st.kind === "panel") {
        div("label", card, title);
        const rows = div("rows", card);
        for (const [k, v] of st.rows || []) {
          const row = div("row", rows);
          div("k", row, k);
          dynamic.push([div("v", row), v]);
        }
      } else if (st.kind === "terminal") {
        div("label", card, title);
        const pre = document.createElement("pre");
        card.appendChild(pre);
        dynamic.push([pre, (st.lines || []).join("\n"), '<span class="caret"></span>']);
        update = (p) => {
          const c = pre.querySelector(".caret");
          if (c) c.style.opacity = frac(p * 3) < 0.5 ? 1 : 0;
        };
      } else {
        const svg = el("svg", { class: "part", viewBox: "0 0 108 108" }, card);
        update = (PARTS[st.kind] || PARTS.engine)(svg, A0);
        const txt = div("txt", card);
        div("label", txt, title);
        dynamic.push([div("value", txt), st.value || ""]);
      }
      return { lit, update };
    }
    const stations = line.map((st, k) => station(st, room.line[k], pad2(k + 1)));
    const side = sideCfg ? station(sideCfg, room.side, "⇄") : null;

    // The archive cabinet.
    const a = cfg.archive || {};
    const arch = div(fromRight ? "mk-arch" : "mk-arch flip", stage);
    const archLit = div("lit", arch);
    // One header line, on the side away from the drop.
    const note = a.note ? ` <span class="nt">· ${a.note}</span>` : "";
    div("head", arch, `<span class="n">${pad2(line.length + 1)}</span> Archive <span class="path">${a.label || ""}${note}</span>`).setAttribute(
      "data-layout-allow-overlap",
      "",
    );
    const slots = a.slots || ["now", "−1 d", "−2 d", "−3 d", "−4 d"];
    slots.slice(0, SLOTS).forEach((label, s) => {
      div("mk-slot", arch, label).style.left = `${slotX(s)}px`;
    });
    const drawCard = CARDS[a.card] || CARDS.doc;
    const cards = Array.from({ length: SLOTS + 1 }, () => {
      const c = div("mk-card", arch);
      c.setAttribute("data-layout-allow-overlap", ""); // the new card drops past the cabinet's label
      const svg = el("svg", { width: 146, height: 100, viewBox: "0 0 146 100" }, c);
      drawCard(svg);
      el("rect", { x: 12, y: 14, width: 54, height: 8, rx: 3, fill: INK, opacity: 0.6 }, svg);
      return { c, tab: div("new", c, a.tab || "NEW") };
    });


    const ride = (node, [[x1, y1], [x2, y2]], u, w, h) => {
      const on = u >= 0 && u <= 1;
      node.setAttribute("opacity", on ? 1 : 0);
      if (!on) return;
      const v = ease.inOut(u);
      node.setAttribute("x", lerp(x1, x2, v) - w / 2);
      node.setAttribute("y", lerp(y1, y2, v) - h / 2);
    };

    return function render(p) {
      p = frac(p);
      // Ticker text (country codes, models) steps evenly through the loop.
      const tk = ticker[Math.floor(p * ticker.length) % ticker.length];
      for (const [node, tpl, extra] of dynamic) node.innerHTML = fill(tpl, tk) + (extra || "");

      flows.forEach((f) => f.setAttribute("stroke-dashoffset", -DASH * 6 * p));

      // Every pipe carries its own packet; their windows overlap, so several move at once.
      segments.forEach((seg, k) => ride(packets[k], seg, (p - leave[k]) / TRAVEL, 16, 16));

      // The engine's round trip through Massive: a red request out, the page back as an ink sheet.
      let sideE = 0;
      if (sideCfg) {
        ride(request, sideSeg, (p - sideGo) / SIDE.travel, 16, 16);
        ride(sheet, [sideSeg[1], sideSeg[0]], (p - sideBack) / SIDE.travel, 14, 18);
        sideE = env(since(p, sideGo + SIDE.travel), 0.4);
      }

      stations.forEach((st, k) => {
        const s = since(p, lightAt[k]);
        const e = env(s, 0.4);
        st.lit.style.opacity = e;
        st.update(p, s, e);
      });
      if (side) {
        side.lit.style.opacity = sideE;
        side.update(p, since(p, sideGo + SIDE.travel), sideE);
      }

      // Archive: the new card drops into slot 0 while the rest step back one slot.
      archLit.style.opacity = env(since(p, archiveAt), 0.4);
      const u = ease.inOut(clamp((p - archiveAt) / SHIFT));
      cards.forEach(({ c, tab }, i) => {
        const incoming = i === SLOTS;
        const s = incoming ? 0 : i + u;
        c.style.left = `${slotX(s)}px`;
        c.style.top = `${incoming ? lerp(-60, 48, ease.out(u)) : 48}px`;
        c.style.opacity = incoming ? clamp(u * 3) : 1 - clamp(s - (SLOTS - 1));
        tab.style.opacity = incoming ? 1 : clamp(1 - s);
      });
    };
  }

  window.MachineKit = { build, PARTS, CARDS };
})();
