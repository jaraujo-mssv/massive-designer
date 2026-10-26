/*
 * loop-kit — helpers for seamless GIF loops (one design, a few moving parts).
 *
 * The whole animation is a pure `render(p, t)` of the loop phase p (0 → 1) and
 * the time t in seconds. `LoopKit.drive()` turns it into one linear GSAP tween
 * on the composition's paused timeline, so HyperFrames can seek any frame. As
 * long as every motion completes a whole number of cycles per loop, the last
 * frame flows into the first. Phase 0 is the still LinkedIn shows before the
 * GIF plays, so it must be the finished design.
 *
 * Master copy: public/video-projects/_gif/lib/loop-kit.js. GIF projects get a
 * copy in lib/ via `npm run video:brand` (the CLI only serves the project dir).
 */
(function () {
  // The CLI's runtime defines this before any script runs; <hyperframes-player>
  // injects the runtime after the page loads, so compositions must not assume it.
  window.__timelines = window.__timelines || {};

  const TAU = Math.PI * 2;
  const frac = (x) => ((x % 1) + 1) % 1;
  const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
  const lerp = (a, b, u) => a + (b - a) * u;

  const ease = {
    linear: (u) => u,
    in: (u) => u * u * u,
    out: (u) => 1 - Math.pow(1 - u, 3),
    inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    // Slight overshoot, for things that pop into place.
    outBack: (u) => 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2),
  };

  /** 0 → 1 → 0 cosine wave, `cycles` whole cycles per loop; 0 at p = offset. */
  const wave = (p, cycles = 1, offset = 0) => 0.5 - 0.5 * Math.cos(TAU * (cycles * p - offset));

  /** Seconds since the most recent of `count` evenly spaced hits per loop, the first at phase `at`. */
  const since = (p, at = 0, count = 1) => (frac((p - at) * count) / count) * LoopKit.duration;

  /** Quick rise, exponential fall, from a time in seconds (pair with `since`). */
  const env = (s, decay = 0.45, rise = 0.08) => (s < rise ? s / rise : Math.exp(-(s - rise) / decay));

  /** Fade in over the first `w` and out over the last `w` of a 0 → 1 journey. */
  const edgeFade = (u, w = 0.08) => clamp(Math.min(u / w, (1 - u) / w));

  /** Which of `n` equal steps the loop is in (i) and how far through it (u). */
  const step = (p, n) => ({ i: Math.floor(frac(p) * n), u: frac(p * n) });

  const warned = new Set();

  /**
   * Keyframes over the loop: seq(p, [[0, a], [0.3, a], [0.45, b], [0.8, b], [1, a]]).
   * Equal neighbours hold; the rest move with `easing`. Values are numbers or
   * arrays of numbers. Start at p 0 and end at p 1 with the same value, or the loop jumps.
   */
  function seq(p, stops, easing = ease.inOut) {
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (first[0] !== 0 || last[0] !== 1 || String(first[1]) !== String(last[1])) {
      const key = JSON.stringify(stops);
      if (!warned.has(key)) {
        warned.add(key);
        console.warn("[loop-kit] seq should start at p 0 and end at p 1 on the same value:", stops);
      }
    }
    p = frac(p);
    let i = 1;
    while (i < stops.length - 1 && p > stops[i][0]) i++;
    const [p0, a] = stops[i - 1];
    const [p1, b] = stops[i];
    const u = p1 === p0 ? 0 : easing(clamp((p - p0) / (p1 - p0)));
    return Array.isArray(a) ? a.map((v, k) => lerp(v, b[k], u)) : lerp(a, b, u);
  }

  /** Seeded random numbers (mulberry32): Math.random and Date break deterministic renders. */
  function rng(seed = 1) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let r = Math.imul(s ^ (s >>> 15), 1 | s);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Drive render(p, t) from the composition's paused timeline. The loop length
   * is the root's data-duration, so it can't drift from what HyperFrames renders.
   * Register the timeline yourself, inline: window.__timelines["<root id>"] = tl.
   */
  function drive(tl, root, render) {
    const duration = Number(root.dataset.duration);
    LoopKit.duration = duration;
    const clock = { t: 0 };
    render(0, 0);
    tl.to(
      clock,
      { t: duration, duration, ease: "none", onUpdate: () => render(frac(clock.t / duration), clock.t) },
      0,
    );
    return tl;
  }

  const LoopKit = { duration: 1, TAU, frac, clamp, lerp, ease, wave, since, env, edgeFade, step, seq, rng, drive };
  window.LoopKit = LoopKit;
})();
