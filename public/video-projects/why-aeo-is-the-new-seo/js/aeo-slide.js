/*
 * Shared motion for the Why AEO slides (ported from WhyAEOIsTheNewSEO.tsx).
 *
 * Markup drives it:
 *   .chrome                      scene fade + blur in/out (24 frames each end)
 *   [data-up="<delay>"]          spring slide-up (damping 22, stiffness 200), optional data-dist (default 20)
 *   [data-si="<delay>"]          spring scale-in 0.78 → 1 (damping 20, stiffness 160)
 *   .headline[data-delay="<d>"]  each child .word slides up at d + i*6, distance 14
 */
window.AeoSlide = {
  mount(compId, frames, fps) {
    const { interpolate, spring, CLAMP, drive } = FrameKit;
    const root = document.querySelector(`[data-composition-id="${compId}"]`);
    const chrome = root.querySelector(".chrome");
    const fIn = (f, delay, dur = 24) => interpolate(Math.max(0, f - delay), [0, dur], [0, 1], CLAMP);

    const ups = [...root.querySelectorAll("[data-up]")].map((el) => ({
      el,
      delay: Number(el.dataset.up),
      dist: Number(el.dataset.dist || 20),
    }));
    root.querySelectorAll(".headline").forEach((h) => {
      const base = Number(h.dataset.delay);
      h.querySelectorAll(".word").forEach((el, i) => ups.push({ el, delay: base + i * 6, dist: 14 }));
    });
    const sis = [...root.querySelectorAll("[data-si]")].map((el) => ({ el, delay: Number(el.dataset.si) }));

    const edges = [0, 24, frames - 24, frames - 1];
    const tl = gsap.timeline({ paused: true });
    drive(tl, fps, frames, (f) => {
      chrome.style.opacity = interpolate(f, edges, [0, 1, 1, 0], CLAMP);
      chrome.style.filter = `blur(${interpolate(f, edges, [14, 0, 0, 14], CLAMP)}px)`;
      for (const { el, delay, dist } of ups) {
        const s = spring({ frame: Math.max(0, f - delay), fps, config: { damping: 22, stiffness: 200 } });
        el.style.opacity = fIn(f, delay);
        el.style.transform = `translateY(${interpolate(s, [0, 1], [dist, 0])}px)`;
      }
      for (const { el, delay } of sis) {
        const s = spring({ frame: Math.max(0, f - delay), fps, config: { damping: 20, stiffness: 160 } });
        el.style.opacity = fIn(f, delay);
        el.style.transform = `scale(${interpolate(s, [0, 1], [0.78, 1])})`;
      }
    });
    window.__timelines[compId] = tl;
  },
};
