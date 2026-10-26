/*
 * scenes: the series frame and small shared parts for bespoke GIF scenes (portrait 1080×1350).
 * Projects opt in with meta.json "kits": ["scenes"]; load lib/scenes.js after lib/loop-kit.js and link
 * lib/scenes.css. Unlike the machine kit, this draws no scene: each project composes its own layout and
 * motion and owns render(p). Lay the body out from y 412 to about 1180; scenes.css lifts it 64px so it sits
 * between the description and the stack card in the footer (dashed, app icons).
 *
 *   Scenes.frame(stage, { title, why, stack: [{ icon: "assets/brand/partner-app.png", name, role }, …,
 *                                             { icon: "code", name: "Your agent", role }] });
 *   const win = Scenes.browser(stage, { x, y, w, h, url, via: true });   // win.root, win.body
 *   const card = Scenes.card(stage, { x, y, w, h });
 *   Scenes.code(stage, { x, y, w, h, title: '<span class="n">01</span> Code', lines: ["…"] });
 *   Scenes.svg(parent, w, h) / Scenes.el(tag, attrs, parent) / Scenes.div(cls, parent, html)
 *
 * Keep the series rules: phase 0 is a finished still, every motion repeats whole cycles, flat fills on
 * anything that moves, mono only in <code>/<pre>. Master copy: public/video-projects/_gif/kits/scenes/.
 */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  window.__timelines = window.__timelines || {};

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
  function place(node, { x, y, w, h }) {
    Object.assign(node.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    return node;
  }
  /** An absolutely placed SVG layer of w×h at x,y (stage pixels) inside parent. */
  function svg(parent, w, h, x = 0, y = 0) {
    const s = el("svg", { width: w, height: h, viewBox: `0 0 ${w} ${h}` }, parent);
    Object.assign(s.style, { position: "absolute", left: `${x}px`, top: `${y}px`, overflow: "visible" });
    return s;
  }

  // "Your agent" in the stack card: a terminal tile.
  const CODE_ICON =
    '<svg viewBox="0 0 52 52" width="52" height="52"><rect width="52" height="52" rx="12" fill="#171615" />' +
    '<path d="M14 20 L21 26 L14 32" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />' +
    '<line x1="25" y1="33" x2="38" y2="33" stroke="#f3a07a" stroke-width="3.5" stroke-linecap="round" /></svg>';

  function frame(stage, cfg) {
    div("sc-title", stage, cfg.title);
    div("sc-why", stage, cfg.why);
    if (cfg.stack) {
      const parts = div("parts", div("sc-stack", stage));
      for (const it of cfg.stack) {
        if (it.logo) {
          div("part", parts, `<div><img class="wm" src="${it.logo}" alt="${it.name || ""}" /><div class="role">${it.role}</div></div>`);
          continue;
        }
        const part = div("part", parts);
        div("ic", part, it.icon === "code" ? CODE_ICON : `<img src="${it.icon}" alt="" />`);
        div("", part, `<div class="name">${it.name}</div><div class="role">${it.role}</div>`);
      }
    }
  }

  function card(parent, box) {
    return place(div("sc-card", parent), box);
  }

  /** A browser window: chrome with an address and, optionally, "via Massive" (the request's route). */
  function browser(parent, box) {
    const root = place(div("sc-card sc-browser", parent), box);
    const via = box.via ? `<span class="via"><img src="assets/brand/icon-massive.svg" alt="" />${box.via === true ? "via Massive" : box.via}</span>` : "";
    div("chrome", root, `<i></i><i></i><i></i><span class="url">${box.url || ""}</span>${via}`);
    return { root, body: div("body", root) };
  }

  /** An ink code card with a title row and lines of code. */
  function code(parent, box) {
    const root = place(div("sc-code", parent), box);
    if (box.title) div("sc-head", root, box.title);
    const pre = document.createElement("pre");
    pre.style.top = box.title ? "54px" : "18px";
    pre.innerHTML = (box.lines || []).join("\n");
    root.appendChild(pre);
    return root;
  }

  window.Scenes = { el, div, place, svg, frame, card, browser, code, CODE_ICON };
})();
