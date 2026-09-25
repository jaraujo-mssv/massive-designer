/*
 * DiagramKit — the diagram vocabulary shared by the five diagram scenes.
 *
 * Ported from sparktray-campaign brand/ui/diagram.tsx (palette, Node, Packet,
 * DiagramCard) and the `Diagram` wrapper in brand/ui/Scene.tsx (the Massive grid
 * plate with the card inset 7% / 9% / 9% and 24% of the height kept clear at the
 * bottom for the subtitle band, which ScriptVideo reserves even with subtitles off).
 *
 *   DiagramKit.frame(root, box, prefix)  builds the plate + card, returns the <svg>
 *   DiagramKit.node(parent, opts)        a ring node with glow, icon slot and labels
 *   DiagramKit.packet(parent, opts)      returns update(phase, opacity)
 *
 * Gradient/filter ids are prefixed per scene so the assembled page never repeats one.
 */
(function () {
  const C = {
    card: "#121117",
    cardStroke: "#252328",
    nodeFill: "#121117",
    accent: "#ff8163",
    accentDeep: "#d74939",
    green: "#8be9a1",
    cream: "#faf4ec",
    creamDim: "rgba(250,244,236,0.65)",
    hairline: "rgba(250,244,236,0.18)",
    nodeStroke: "rgba(250,244,236,0.15)",
    greenStroke: "rgba(139,233,161,0.35)",
  };
  const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
  const SANS = "'Inter', system-ui, -apple-system, sans-serif";

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const toD = (pts) => pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");

  /** Position a fraction `t` along a polyline, by arc length. */
  function pointAt(pts, t) {
    const segs = pts.slice(1).map(([x, y], i) => Math.hypot(x - pts[i][0], y - pts[i][1]));
    const total = segs.reduce((a, b) => a + b, 0);
    let d = t * total;
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i]) {
        const k = d / segs[i];
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
      }
      d -= segs[i];
    }
    return pts[pts.length - 1];
  }

  /** Fade in and out at the ends of each lap, so a packet never pops. */
  const packetFade = (t) => (t < 0.2 ? clamp01(t / 0.2) : t > 0.8 ? clamp01((1 - t) / 0.2) : 1);

  const el = (tag, attrs, parent) => FrameKit.svg(tag, attrs, parent);

  /**
   * The plate, the inset box and the card, sized exactly like Scene.tsx's Diagram +
   * DiagramCard: the card takes the box's full height at the viewBox's aspect ratio.
   */
  function frame(root, box, prefix) {
    const plate = root.querySelector(".diagram-plate");
    const inset = document.createElement("div");
    inset.className = "diagram-inset";
    const center = document.createElement("div");
    center.className = "diagram-center";
    const card = document.createElement("div");
    card.className = "diagram-card";
    card.style.aspectRatio = `${box.w} / ${box.h}`;
    plate.appendChild(inset);
    inset.appendChild(center);
    center.appendChild(card);
    const svg = el("svg", {
      viewBox: `${box.x} ${box.y} ${box.w} ${box.h}`,
      width: "100%",
      height: "100%",
      fill: "none",
      style: "display:block",
    });
    card.appendChild(svg);
    const defs = el("defs", {}, svg);
    const grad = el("radialGradient", { id: `${prefix}-glow` }, defs);
    el("stop", { offset: "0%", "stop-color": C.accent, "stop-opacity": "0.9" }, grad);
    el("stop", { offset: "100%", "stop-color": C.accentDeep, "stop-opacity": "0" }, grad);
    const filter = el("filter", { id: `${prefix}-shadow`, x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
    el("feGaussianBlur", { stdDeviation: "6" }, filter);
    svg.glow = `url(#${prefix}-glow)`;
    svg.shadow = `url(#${prefix}-shadow)`;
    return svg;
  }

  /**
   * A node: glow, ring, `icon` markup (SVG string, drawn in node space), then the mono
   * label at r+38 and the sans description at r+64. Returns the node's <g>.
   */
  function node(svg, parent, o) {
    const g = el("g", { transform: `translate(${o.x},${o.y})` }, parent);
    el("circle", { r: o.glowR, fill: svg.glow, opacity: o.glowOpacity, filter: svg.shadow }, g);
    el("circle", { r: o.r, fill: C.nodeFill, stroke: o.ringStroke, "stroke-width": o.ringWidth }, g);
    if (o.icon) g.insertAdjacentHTML("beforeend", o.icon);
    const label = el(
      "text",
      { x: 0, y: o.r + 38, "text-anchor": "middle", "font-size": o.labelSize ?? 15, fill: C.cream, "letter-spacing": "0.08em", class: "mono", style: `font-family:${MONO}` },
      g,
    );
    label.textContent = o.label;
    const desc = el("text", { x: 0, y: o.r + 64, "text-anchor": "middle", "font-size": o.descSize ?? 17, fill: C.creamDim, style: `font-family:${SANS}` }, g);
    desc.textContent = o.desc;
    return g;
  }

  /** Node's opacity rule: omitted at 1 (no compositing group), set below it. */
  function setGroupOpacity(g, opacity) {
    if (opacity < 1) g.setAttribute("opacity", opacity);
    else g.removeAttribute("opacity");
  }

  /** A packet that walks `path` by arc length. update(phase, opacity) places it. */
  function packet(parent, { path, radius, color, fade }) {
    const c = el("circle", { r: radius, fill: color }, parent);
    return (phase, opacity = 1) => {
      const t = ((phase % 1) + 1) % 1;
      const [x, y] = pointAt(path, t);
      c.setAttribute("cx", x);
      c.setAttribute("cy", y);
      c.setAttribute("opacity", (fade ? packetFade(t) : 1) * opacity);
    };
  }

  window.DiagramKit = { C, MONO, SANS, toD, pointAt, packetFade, frame, node, packet, setGroupOpacity, el };
})();
