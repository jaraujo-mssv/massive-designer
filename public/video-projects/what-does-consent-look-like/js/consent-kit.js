/*
 * consent-kit — shared helpers for "What does consent look like?".
 *
 * Ported from sparktray-campaign's brand/ui (diagram.tsx, cursor-track.ts, lucide.ts)
 * and video/compositions/ScriptVideo.tsx. Every scene keeps the source's model: a
 * scene is one run of beats with a single 0..1 clock, t = frame / (runFrames - 1),
 * and each frame is a pure function of t.
 *
 *   ConsentKit.mount(id, frames, setup)  setup(h) returns render(t, frame); driven by
 *                                        FrameKit.drive at 60 fps on the scene timeline
 *   ConsentKit.icon(name, opts)          a lucide icon as an SVG string (lucide-react 1.24)
 *   ConsentKit.hydrateIcons(root)        swaps <i data-icon="Film" data-size ...> for the SVG
 *   ConsentKit.at/ease/clamp01/pulse/paceOf/cursorAt   the source's timing helpers
 */
(function () {
  const FPS = 60;

  const ICONS = {
    "Minimize2": "<path d=\"m14 10 7-7\"/><path d=\"M20 10h-6V4\"/><path d=\"m3 21 7-7\"/><path d=\"M4 14h6v6\"/>",
    "X": "<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>",
    "Film": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/><path d=\"M7 3v18\"/><path d=\"M3 7.5h4\"/><path d=\"M3 12h18\"/><path d=\"M3 16.5h4\"/><path d=\"M17 3v18\"/><path d=\"M17 7.5h4\"/><path d=\"M17 16.5h4\"/>",
    "Check": "<path d=\"M20 6 9 17l-5-5\"/>",
    "Plus": "<path d=\"M5 12h14\"/><path d=\"M12 5v14\"/>",
    "Trash2": "<path d=\"M10 11v6\"/><path d=\"M14 11v6\"/><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\"/><path d=\"M3 6h18\"/><path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"/>",
    "Play": "<path d=\"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z\"/>",
    "Square": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/>",
    "Pause": "<rect x=\"14\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\"/><rect x=\"5\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\"/>",
    "Wrench": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z\"/>",
    "Settings": "<path d=\"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
    "Camera": "<path d=\"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z\"/><circle cx=\"12\" cy=\"13\" r=\"3\"/>",
    "Volume2": "<path d=\"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z\"/><path d=\"M16 9a5 5 0 0 1 0 6\"/><path d=\"M19.364 18.364a9 9 0 0 0 0-12.728\"/>",
    "FolderOpen": "<path d=\"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2\"/>",
    "ArrowLeft": "<path d=\"m12 19-7-7 7-7\"/><path d=\"M19 12H5\"/>",
    "Search": "<path d=\"m21 21-4.34-4.34\"/><circle cx=\"11\" cy=\"11\" r=\"8\"/>",
    "ChevronRight": "<path d=\"m9 18 6-6-6-6\"/>",
    "MoreHorizontal": "<circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"19\" cy=\"12\" r=\"1\"/><circle cx=\"5\" cy=\"12\" r=\"1\"/>",
    "Download": "<path d=\"M12 15V3\"/><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><path d=\"m7 10 5 5 5-5\"/>",
    "ChevronUp": "<path d=\"m18 15-6-6-6 6\"/>",
    "Wifi": "<path d=\"M12 20h.01\"/><path d=\"M2 8.82a15 15 0 0 1 20 0\"/><path d=\"M5 12.859a10 10 0 0 1 14 0\"/><path d=\"M8.5 16.429a5 5 0 0 1 7 0\"/>",
    "BatteryMedium": "<path d=\"M10 14v-4\"/><path d=\"M22 14v-4\"/><path d=\"M6 14v-4\"/><rect x=\"2\" y=\"6\" width=\"16\" height=\"12\" rx=\"2\"/>"
  };

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  /** `t` remapped so [from, to] becomes 0..1, clamped outside. (diagram.tsx `at`) */
  const at = (t, from, to) => clamp01((t - from) / (to - from));
  /** Ease-out cubic. */
  const ease = (v) => 1 - Math.pow(1 - clamp01(v), 3);

  /* cursor-track.ts */
  const TRAVEL_SECONDS = 0.55;
  const PRESS_SECONDS = 0.3;
  const paceOf = (seconds) => ({ travel: TRAVEL_SECONDS / seconds, press: PRESS_SECONDS / seconds });
  const pulse = (t, mark, width) => (t < mark ? 0 : 1 - at(t, mark, mark + width));
  const lerp = (a, b, p) => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];

  /** Resolve a stop track at `t` into { at: [x, y], press } (frame space via `project`). */
  function cursorAt(stops, t, pace, project) {
    if (!stops.length) return null;
    const pts = stops.map(project);
    let i = 0;
    while (i + 1 < stops.length && stops[i + 1].t <= t) i++;
    let p = pts[i];
    const next = stops[i + 1];
    if (next) {
      const start = Math.max(stops[i].t, next.t - pace.travel);
      p = lerp(pts[i], pts[i + 1], ease(at(t, start, next.t)));
    }
    let press = 0;
    for (const stop of stops) if (stop.click) press = Math.max(press, pulse(t, stop.t, pace.press));
    return { at: p, press };
  }

  /** A lucide icon, rendered the way lucide-react does (24-unit viewBox, round caps). */
  function icon(name, opts) {
    const o = opts || {};
    const size = o.size ?? 24;
    const color = o.color ?? "currentColor";
    const sw = o.sw ?? 2;
    const style = o.style ? ` style="${o.style}"` : "";
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
      `stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${style}>` +
      `${ICONS[name]}</svg>`
    );
  }

  /** Replace every <i data-icon> placeholder under `root` with its SVG. */
  function hydrateIcons(root) {
    root.querySelectorAll("i[data-icon]").forEach((el) => {
      const d = el.dataset;
      el.outerHTML = icon(d.icon, {
        size: d.size ? Number(d.size) : undefined,
        color: d.color,
        sw: d.sw ? Number(d.sw) : undefined,
        style: el.getAttribute("style") || "",
      });
    });
  }

  /**
   * Mount one scene. `frames` is the run's length at 60 fps; render(t, frame) gets the
   * run clock exactly as ScriptVideo's Beat computes it: t = frame / (frames - 1).
   */
  function mount(compId, frames, setup) {
    const root = document.querySelector(`[data-composition-id="${compId}"]`);
    const $ = (sel) => root.querySelector(sel);
    const $$ = (sel) => [...root.querySelectorAll(sel)];
    hydrateIcons(root);
    const render = setup({ root, $, $$, frames, seconds: frames / FPS });
    const tl = gsap.timeline({ paused: true });
    FrameKit.drive(tl, FPS, frames, (f) => {
      const frame = Math.min(frames - 1, Math.max(0, f));
      render(frames > 1 ? frame / (frames - 1) : 1, frame);
    });
    window.__timelines[compId] = tl;
  }

  window.ConsentKit = { FPS, clamp01, at, ease, paceOf, pulse, cursorAt, icon, hydrateIcons, mount, TRAVEL_SECONDS, PRESS_SECONDS };
})();
