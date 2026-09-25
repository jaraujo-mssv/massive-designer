/*
 * ConsentSteps — the four things fair consent does, as a promise (beat 10) and a recap (beat 17).
 *
 * Ported from sparktray-campaign brand/ui/ConsentSteps.tsx. One drawing, two modes:
 *   preview  rows arrive, boxes stay EMPTY (a tick here would claim what the video has not shown)
 *   recap    all rows from frame one, ticked in turn by a pointer, one per phrase of beat 17
 *
 * TICKS are the midpoints of the phrases that name each step in the take's word alignment
 * (sparktray scripts/derive-scene-marks.mjs), not chosen by eye.
 */
(function () {
  const TICKS = [0.059, 0.265, 0.535, 0.777];
  const RUN_SECONDS = 6.83;
  const ROW_Y = [90, 180, 270, 360];
  const BOX_X = 100;
  const LABEL_X = 150;
  const DESC_X = 440;
  const SIDE = 26;
  const CONTENT = { x: 87, y: 74, w: 573, h: 300 };
  const PAD = 34;
  const BOX = { x: CONTENT.x - PAD, y: CONTENT.y - PAD, w: CONTENT.w + PAD * 2, h: CONTENT.h + PAD * 2 };
  const CHECK_LEN = 18;
  const CURSOR_K = 0.75;
  const CURSOR_IDLE = [190, 55];
  const STEPS = [
    { label: "01 · UP FRONT", desc: "Shown at install" },
    { label: "02 · NOT PRE-TICKED", desc: "You choose it" },
    { label: "03 · REACHABLE", desc: "A switch in settings" },
    { label: "04 · CLEAN EXIT", desc: "Uninstall takes it all" },
  ];

  function mount(compId, frames, mode) {
    ConsentKit.mount(compId, frames, (h) => {
      const { at, ease, clamp01, cursorAt, paceOf } = ConsentKit;
      const { C, MONO, SANS, el } = DiagramKit;
      const svg = DiagramKit.frame(h.root, BOX, compId);

      const rows = STEPS.map((step, i) => {
        const y = ROW_Y[i];
        const g = el("g", {}, svg);
        const box = el("rect", { x: BOX_X - SIDE / 2, y: y - SIDE / 2, width: SIDE, height: SIDE, rx: 4, fill: C.nodeFill, stroke: C.nodeStroke, "stroke-width": 1.4 }, g);
        const check =
          mode === "recap"
            ? el(
                "path",
                {
                  d: `M${BOX_X - 6} ${y} l4 4.5 l8.5 -9.5`,
                  stroke: C.green,
                  "stroke-width": 2,
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  fill: "none",
                  "stroke-dasharray": CHECK_LEN,
                  opacity: 0,
                },
                g,
              )
            : null;
        const label = el("text", { x: LABEL_X, y: y + 6, "font-size": 18, fill: C.cream, "letter-spacing": "0.08em", class: "mono", style: `font-family:${MONO}` }, g);
        label.textContent = step.label;
        const desc = el("text", { x: DESC_X, y: y + 6, "font-size": 19, fill: C.creamDim, style: `font-family:${SANS}` }, g);
        desc.textContent = step.desc;
        return { g, box, check };
      });

      // The pointer, recap only, drawn last so it paints over the row it is on.
      let ring = null;
      let arrow = null;
      const stops = [{ t: 0, at: CURSOR_IDLE }, ...TICKS.map((tick, i) => ({ t: tick, at: [BOX_X + 6, ROW_Y[i] + 7], click: true }))];
      if (mode === "recap") {
        const cg = el("g", {}, svg);
        ring = el("circle", { stroke: C.cream, fill: "none", opacity: 0 }, cg);
        arrow = el("g", {}, cg);
        el(
          "path",
          { d: "M2 1 L2 19 L7 14.5 L10.5 22 L13.5 20.5 L10 13.5 L16.5 13.5 Z", fill: "#fafafa", stroke: "#09090b", "stroke-width": 1.2, "stroke-linejoin": "round" },
          arrow,
        );
      }

      return (t) => {
        rows.forEach((row, i) => {
          const arrive = mode === "preview" ? ease(at(t, 0.04 + i * 0.07, 0.16 + i * 0.07)) : 1;
          const tick = mode === "recap" ? ease(at(t, TICKS[i], TICKS[i] + 0.08)) : 0;
          const on = tick > 0.02;
          row.g.setAttribute("opacity", arrive);
          row.box.setAttribute("stroke", on ? C.green : C.nodeStroke);
          row.box.setAttribute("opacity", on ? clamp01(0.35 + tick) : 1);
          if (row.check) {
            row.check.setAttribute("opacity", on ? 1 : 0);
            row.check.setAttribute("stroke-dashoffset", CHECK_LEN * (1 - tick));
          }
        });
        if (mode === "recap") {
          const c = cursorAt(stops, t, paceOf(RUN_SECONDS), (stop) => stop.at);
          const [x, y] = c.at;
          arrow.setAttribute("transform", `translate(${x - 2 * CURSOR_K},${y - CURSOR_K}) scale(${CURSOR_K})`);
          if (c.press > 0) {
            ring.setAttribute("cx", x);
            ring.setAttribute("cy", y);
            ring.setAttribute("r", 8 + 12 * (1 - c.press));
            ring.setAttribute("stroke-width", Math.max(0.6, 2 * c.press));
            ring.setAttribute("opacity", c.press * 0.7);
          } else {
            ring.setAttribute("opacity", 0);
          }
        }
      };
    });
  }

  window.ConsentSteps = { mount };
})();
