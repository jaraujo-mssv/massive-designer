// The code-reviews-* images' charts, drawn from data.js into the page's .cr-chart svg (load data.js first).
//
//   codeReviews.cumulative(svg, { from: "2025-08-04" })  running totals since a week, humans and the bot as two lines
//   codeReviews.weekly(svg)                              reviews per week, bot and humans stacked
//   codeReviews.fitTitle(el)                             steps the title down until it fits on three lines
//
// The chart fills the frame. Its data ends in a steep climb on the right, so the title and the numbers (.cr-text)
// sit over its empty top-left corner: the vertical scale is set so every point under that text stays below it.
// Humans are the neutral series and the bot is the red one: the one accent marks the story (brand/BRAND.md).
// Both charts mark the two dates from the brief, each with a line and a label at its top: human reviews stopped at
// the end of May 2026, and the review bot launched on July 2, 2026.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const DAY = 864e5;
  const HUMAN = "#a8a5a1"; // cream at about 65% on the ground; checked against the red with the dataviz validator
  const BOT = "#d74939"; // --m-red
  const GROUND = "#0a0a0f";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const CLEAR = 40; // px between the text over the chart and the data under it

  const rows = window.CODE_REVIEWS_CSV.trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [week, human, bot, humanTotal, botTotal] = line.split(",");
      return { start: Date.parse(`${week}T00:00:00Z`), human: +human, bot: +bot, humanTotal: +humanTotal, botTotal: +botTotal };
    });
  const END = rows.at(-1).start + 7 * DAY;
  const EVENTS = [
    { at: Date.parse("2026-05-25T00:00:00Z"), label: "Human reviews stop · end of May" },
    { at: Date.parse("2026-07-02T00:00:00Z"), label: "Review bot launches · July 2" },
  ];

  const fmt = (n) => n.toLocaleString("en-US");
  function el(parent, tag, attrs = {}, text) {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text !== undefined) node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  // The text over the chart, as boxes in the svg's coordinates: one per title line, and the numbers.
  function textBoxes(svg) {
    const s = svg.getBoundingClientRect();
    const text = svg.parentElement.querySelector(".cr-text");
    const rects = [];
    const title = text?.querySelector(".cr-title");
    if (title) {
      const range = document.createRange();
      range.selectNodeContents(title);
      rects.push(...range.getClientRects());
    }
    const stats = text?.querySelector(".cr-stats");
    if (stats) rects.push(stats.getBoundingClientRect());
    return rects
      .filter((r) => r.width && r.height)
      .map((r) => ({ left: r.left - s.left, right: r.right - s.left, top: r.top - s.top, bottom: r.bottom - s.top }));
  }

  // The plot and the time scale. The vertical scale comes from fitY, once the data is known.
  function frame(svg, { from, right }) {
    svg.replaceChildren();
    const { width, height } = svg.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const plot = { left: 0, right: width - right, top: 0, bottom: height - 44 };
    const x = (t) => plot.left + ((t - from) / (END - from)) * (plot.right - plot.left);
    return { svg, plot, x, from, width, boxes: textBoxes(svg) };
  }

  // The vertical scale: the tallest mark `headroom` px under the top, and every mark that runs under the text (spans
  // as [x0, x1, value]) at least CLEAR px below it.
  function fitY(f, spans, headroom) {
    const h = f.plot.bottom - f.plot.top;
    let max = (Math.max(...spans.map((s) => s[2])) * h) / (h - headroom);
    for (const b of f.boxes) {
      const room = f.plot.bottom - b.bottom - CLEAR;
      if (room <= 0) continue;
      for (const [x0, x1, v] of spans) if (x1 >= b.left - CLEAR && x0 <= b.right + CLEAR) max = Math.max(max, (v * h) / room);
    }
    return (v) => f.plot.bottom - (v / max) * h;
  }

  // The baseline and the months under it: every quarter over a long range, every month over a short one. January
  // and the first tick carry the year.
  function axis({ svg, plot, x, from }) {
    el(svg, "line", { x1: plot.left, x2: plot.right, y1: plot.bottom, y2: plot.bottom, class: "cr-base" });
    const quarterly = (END - from) / DAY > 600;
    const first = new Date(from);
    let labelled = false;
    for (let m = Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1); m < END; ) {
      const d = new Date(m);
      const mo = d.getUTCMonth();
      if (!quarterly || mo % 3 === 0) {
        const withYear = mo === 0 || !labelled;
        el(svg, "line", { x1: x(m), x2: x(m), y1: plot.bottom, y2: plot.bottom + 8, class: "cr-base" });
        el(
          svg,
          "text",
          { x: x(m), y: plot.bottom + 36, "text-anchor": "middle", class: withYear ? "cr-tick is-year" : "cr-tick" },
          withYear ? `${MONTHS[mo]} ${d.getUTCFullYear()}` : MONTHS[mo],
        );
        labelled = true;
      }
      m = Date.UTC(d.getUTCFullYear(), mo + 1, 1);
    }
  }

  // The two dates: a line at each, the weeks between shaded (no human reviews and no bot yet; AI tools on laptops,
  // not counted), and a label at the top of each line. The labels stack in two rows, so neither crosses the other's
  // line: run left of the lines, the later date's label is the upper one; run right, the earlier one's. They take the
  // first spot, from the top down, that clears the text over the chart, the other labels (`taken`) and the data
  // (`spans`, as [x0, x1, value]). They're drawn into `layer`, under the data.
  function events({ plot, x, width, boxes }, layer, y, spans, taken) {
    const xs = EVENTS.map((e) => x(e.at));
    const texts = EVENTS.map((e) => el(layer, "text", { class: "cr-event" }, e.label));
    const widths = texts.map((t) => t.getComputedTextLength());
    const ROW = 36;
    const HEIGHT = 24;
    const hits = (r, b, pad) => r.right > b.left - pad && r.left < b.right + pad && r.bottom > b.top - pad && r.top < b.bottom + pad;
    const free = (r) =>
      r.left >= plot.left &&
      r.right <= width &&
      !boxes.some((b) => hits(r, b, 64)) && // well clear of the title, so a label never reads as part of it
      !taken.some((b) => hits(r, b, 16)) &&
      spans.every(([x0, x1, v]) => x1 < r.left || x0 > r.right || y(v) > r.bottom + 16);
    const place = (top, side) =>
      [0, 1].map((i) => {
        const rowTop = top + (side === "left" ? 1 - i : i) * ROW;
        const left = side === "left" ? xs[i] - 14 - widths[i] : xs[i] + 14;
        return { left, right: left + widths[i], top: rowTop, bottom: rowTop + HEIGHT, side };
      });
    let spot = place(plot.top, "left");
    search: for (let top = plot.top; top < plot.bottom - 3 * ROW; top += 12) {
      for (const side of ["left", "right"]) {
        const tried = place(top, side);
        if (tried.every(free)) {
          spot = tried;
          break search;
        }
      }
    }
    const gapTop = Math.max(...spot.map((r) => r.top));
    el(layer, "rect", { x: xs[0], y: gapTop, width: xs[1] - xs[0], height: plot.bottom - gapTop, fill: "rgba(250, 244, 236, 0.035)" });
    spot.forEach((r, i) => {
      el(layer, "line", { x1: xs[i], x2: xs[i], y1: r.top, y2: plot.bottom, class: "cr-marker" });
      texts[i].setAttribute("x", r.left);
      texts[i].setAttribute("y", r.top + 18);
      layer.appendChild(texts[i]);
    });
  }

  const linePath = (pts, x, y) => pts.map(([t, v], i) => `${i ? "L" : "M"}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join("");

  function cumulative(svg, { from } = {}) {
    const start = from ? Date.parse(`${from}T00:00:00Z`) : rows[0].start;
    const f = frame(svg, { from: start, right: 24 });
    const { x, plot } = f;
    const before = rows.filter((r) => r.start < start).at(-1);
    const base = { human: before?.humanTotal ?? 0, bot: before?.botTotal ?? 0 };
    const shown = rows.filter((r) => r.start >= start);
    const firstBot = shown.findIndex((r) => r.bot > 0);
    const series = [
      {
        name: "human reviews",
        color: HUMAN,
        wash: "rgba(168, 165, 161, 0.08)",
        pts: [[start, 0], ...shown.map((r) => [r.start + 7 * DAY, r.humanTotal - base.human])],
      },
      {
        name: "bot reviews",
        color: BOT,
        wash: "rgba(215, 73, 57, 0.16)",
        pts: [[shown[firstBot].start, 0], ...shown.slice(firstBot).map((r) => [r.start + 7 * DAY, r.botTotal - base.bot])],
      },
    ];
    // Each segment of a line, as the span it covers and the higher of its two ends.
    const spans = series.flatMap((s) => s.pts.slice(1).map(([t, v], i) => [x(s.pts[i][0]), x(t), Math.max(v, s.pts[i][1])]));
    // Room above the line ends for their totals.
    const y = fitY(f, spans, 150);

    const layer = el(svg, "g");
    axis(f);
    for (const s of series) {
      const [t0] = s.pts[0];
      const [t1] = s.pts.at(-1);
      el(svg, "path", { d: `${linePath(s.pts, x, y)}L${x(t1)},${plot.bottom}L${x(t0)},${plot.bottom}Z`, fill: s.wash });
    }
    for (const s of series) {
      el(svg, "path", { d: linePath(s.pts, x, y), fill: "none", stroke: s.color, "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" });
    }

    // The totals, top right over the line ends, the larger first: a dot of the series colour, the number and what it
    // counts, set to end at the plot's right edge. Each line ends on a dot too.
    const ends = series.map((s) => ({ ...s, v: s.pts.at(-1)[1] })).sort((a, b) => b.v - a.v);
    const values = ends.map((e) => el(svg, "text", { "text-anchor": "end", class: "cr-end-value" }, fmt(e.v)));
    const names = ends.map((e) => el(svg, "text", { class: "cr-end-label" }, e.name));
    const valueWidth = Math.max(...values.map((t) => t.getComputedTextLength()));
    const nameX = plot.right - Math.max(...names.map((t) => t.getComputedTextLength()));
    const valueX = nameX - 14;
    const dotX = valueX - valueWidth - 22;
    const ROW = 52;
    ends.forEach((e, i) => {
      const cy = plot.top + 26 + i * ROW;
      for (const t of [values[i], names[i]]) t.setAttribute("y", cy + 15);
      values[i].setAttribute("x", valueX);
      names[i].setAttribute("x", nameX);
      el(svg, "circle", { cx: dotX, cy, r: 8, fill: e.color });
      el(svg, "circle", { cx: plot.right, cy: y(e.v), r: 9, fill: e.color, stroke: GROUND, "stroke-width": 3 });
    });
    const taken = [{ left: dotX - 8, right: plot.right, top: plot.top, bottom: plot.top + 26 + ROW * ends.length }];
    events(f, layer, y, spans, taken);
  }

  function weekly(svg) {
    const from = rows[0].start;
    const f = frame(svg, { from, right: 24 });
    const { x, plot } = f;
    const slot = x(from + 7 * DAY) - x(from);
    const w = Math.min(slot - 3, 24);
    const left = (r) => x(r.start + 3.5 * DAY) - w / 2;
    // Room above the tallest column for its label.
    const spans = rows.map((r) => [left(r), left(r) + w, r.human + r.bot]);
    const y = fitY(f, spans, 96);

    const layer = el(svg, "g");
    axis(f);
    // A column grows from the baseline; only its top end is rounded. Stacked parts sit 2px apart.
    const bar = (x0, top, bottom, color, rounded) => {
      const h = bottom - top;
      if (h <= 0) return;
      const r = rounded ? Math.min(3, h / 2, w / 2) : 0;
      el(svg, "path", {
        d: `M${x0},${bottom}L${x0},${top + r}Q${x0},${top} ${x0 + r},${top}L${x0 + w - r},${top}Q${x0 + w},${top} ${x0 + w},${top + r}L${x0 + w},${bottom}Z`,
        fill: color,
      });
    };
    for (const r of rows) {
      // The bot from the baseline, so its weeks read straight off the scale; humans on top.
      if (r.bot) bar(left(r), y(r.bot), plot.bottom, BOT, !r.human);
      if (r.human) bar(left(r), y(r.bot + r.human), r.bot ? y(r.bot) - 2 : plot.bottom, HUMAN, true);
    }

    // The two peaks, labelled over their columns: the most human reviews in a week, and the most bot reviews.
    // A swatch beside each name says which series it is.
    const taken = [];
    for (const [key, color, name] of [
      ["human", HUMAN, "human reviews"],
      ["bot", BOT, "bot reviews"],
    ]) {
      const r = rows.reduce((a, b) => (b[key] > a[key] ? b : a));
      const bx = x(r.start + 3.5 * DAY);
      const top = y(r.human + r.bot);
      const value = el(svg, "text", { y: top - 52, "text-anchor": "middle", class: "cr-end-value" }, fmt(r[key]));
      const label = el(svg, "text", { y: top - 18, "text-anchor": "middle", class: "cr-end-label" }, name);
      // Centred over the column, unless that would cross one of the two dates' lines.
      const half = label.getComputedTextLength() / 2 + 12;
      let cx = bx;
      for (const ex of EVENTS.map((e) => x(e.at))) {
        if (bx < ex) cx = Math.min(cx, ex - 16 - half);
        else cx = Math.max(cx, ex + 16 + half);
      }
      value.setAttribute("x", cx);
      label.setAttribute("x", cx + 12);
      el(svg, "rect", { x: cx - half, y: top - 33, width: 14, height: 14, rx: 3, fill: color });
      taken.push({ left: cx - half, right: cx + half, top: top - 86, bottom: top - 10 });
    }
    events(f, layer, y, spans, taken);
  }

  // Three lines at most: the title steps down from its CSS size until it fits.
  function fitTitle(el, lines = 3, min = 60) {
    el.style.fontSize = "";
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.getBoundingClientRect().height > size * (lines + 0.5) && size > min) {
      size -= 2;
      el.style.fontSize = `${size}px`;
    }
  }

  window.codeReviews = { rows, cumulative, weekly, fitTitle };
})();
