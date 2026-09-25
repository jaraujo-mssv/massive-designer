/*
 * Shared motion for the Massive brand video scenes (ported from MassiveBrandVideo.tsx).
 *
 * Markup drives the common moves:
 *   [data-up="<delay>"]  spring slide-up (damping 22, stiffness 200), optional data-dist (default 36)
 *   [data-si="<delay>"]  spring scale-in 0.72 → 1 (damping 20, stiffness 160)
 *   [data-wp="<delay>"]  left-to-right wipe via clip-path, optional data-dur (default 16)
 *   .brackets            corner brackets grow in over the first 12 frames
 * Scene-specific drawing goes in the optional `setup(h)` callback, which returns render(frame).
 */
window.BrandScene = {
  mount(compId, frames, setup) {
    const { interpolate, spring, CLAMP, drive } = FrameKit;
    const fps = 30;
    const root = document.querySelector(`[data-composition-id="${compId}"]`);
    const spr = (f, delay = 0, damping = 22, stiffness = 200) =>
      spring({ frame: Math.max(0, f - delay), fps, config: { damping, stiffness } });
    const fIn = (f, delay = 0, dur = 8) => interpolate(Math.max(0, f - delay), [0, dur], [0, 1], CLAMP);
    const $ = (sel) => root.querySelector(sel);
    const $$ = (sel) => [...root.querySelectorAll(sel)];

    const ups = $$("[data-up]").map((el) => ({ el, delay: Number(el.dataset.up), dist: Number(el.dataset.dist || 36) }));
    const sis = $$("[data-si]").map((el) => ({ el, delay: Number(el.dataset.si) }));
    const wps = $$("[data-wp]").map((el) => ({ el, delay: Number(el.dataset.wp), dur: Number(el.dataset.dur || 16) }));
    const brackets = $(".brackets");
    const bw = $$(".brackets .bw");
    const bh = $$(".brackets .bh");
    const render = setup ? setup({ root, fps, spr, fIn, interpolate, CLAMP, $, $$ }) : null;

    const tl = gsap.timeline({ paused: true });
    drive(tl, fps, frames, (f) => {
      for (const { el, delay, dist } of ups) {
        el.style.opacity = fIn(f, delay);
        el.style.transform = `translateY(${interpolate(spr(f, delay), [0, 1], [dist, 0])}px)`;
      }
      for (const { el, delay } of sis) {
        el.style.opacity = fIn(f, delay);
        el.style.transform = `scale(${interpolate(spr(f, delay, 20, 160), [0, 1], [0.72, 1])})`;
      }
      for (const { el, delay, dur } of wps) {
        const pct = interpolate(Math.max(0, f - delay), [0, dur], [100, 0], CLAMP);
        el.style.clipPath = `inset(0 ${pct}% 0 0)`;
      }
      if (brackets) {
        brackets.style.opacity = fIn(f, 0, 6);
        const w = interpolate(f, [0, 10], [0, 44], CLAMP);
        const h = interpolate(f, [2, 12], [0, 44], CLAMP);
        bw.forEach((el) => (el.style.width = `${w}px`));
        bh.forEach((el) => (el.style.height = `${h}px`));
      }
      if (render) render(f);
    });
    window.__timelines[compId] = tl;
  },
};
