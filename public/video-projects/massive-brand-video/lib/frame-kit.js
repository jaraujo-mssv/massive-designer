/*
 * frame-kit — frame-exact helpers for compositions ported from Remotion.
 *
 * A ported scene keeps its original per-frame math: `render(frame)` sets
 * styles from an integer frame, and `FrameKit.drive()` turns that into one
 * GSAP tween on the scene's paused timeline, so HyperFrames can seek it.
 *
 * Master copy: public/video-projects/_brand/lib/frame-kit.js. Projects get a
 * copy in lib/ via `npm run video:brand` (the CLI only serves the project dir).
 */
(function () {
  const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };

  /** Linear interpolation over piecewise ranges; extrapolation extends unless clamped. */
  function interpolate(input, inRange, outRange, opts) {
    const o = opts || {};
    const left = o.extrapolateLeft || "extend";
    const right = o.extrapolateRight || "extend";
    const ease = o.easing || ((t) => t);
    const n = inRange.length;
    if (input <= inRange[0] && left === "clamp") return outRange[0];
    if (input >= inRange[n - 1] && right === "clamp") return outRange[n - 1];
    let i = 1;
    while (i < n - 1 && input > inRange[i]) i++;
    const a = inRange[i - 1];
    const b = inRange[i];
    const t = b === a ? 0 : (input - a) / (b - a);
    return outRange[i - 1] + (outRange[i] - outRange[i - 1]) * ease(t);
  }

  /** Closed-form damped harmonic oscillator from `from` to `to`, starting at rest. */
  function springAt(seconds, cfg) {
    const m = cfg.mass;
    const k = cfg.stiffness;
    const c = cfg.damping;
    const w0 = Math.sqrt(k / m);
    const zeta = c / (2 * Math.sqrt(k * m));
    const x0 = 1; // displacement from target at t=0, in normalized units
    const t = seconds;
    let x;
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      x = Math.exp(-zeta * w0 * t) * (x0 * Math.cos(wd * t) + ((zeta * w0 * x0) / wd) * Math.sin(wd * t));
    } else if (zeta === 1) {
      x = Math.exp(-w0 * t) * (x0 + w0 * x0 * t);
    } else {
      const w2 = w0 * Math.sqrt(zeta * zeta - 1);
      x = Math.exp(-zeta * w0 * t) * (x0 * Math.cosh(w2 * t) + ((zeta * w0 * x0) / w2) * Math.sinh(w2 * t));
    }
    return 1 - x;
  }

  /**
   * spring({ frame, fps, config: { damping, stiffness, mass }, from, to })
   * Defaults: damping 10, stiffness 100, mass 1, from 0, to 1.
   */
  function spring(opts) {
    const cfg = Object.assign({ damping: 10, stiffness: 100, mass: 1, overshootClamping: false }, opts.config || {});
    const from = opts.from ?? 0;
    const to = opts.to ?? 1;
    const frame = Math.max(0, opts.frame - (opts.delay || 0));
    let p = springAt(frame / opts.fps, cfg);
    if (cfg.overshootClamping && p > 1) p = 1;
    return from + (to - from) * p;
  }

  const Easing = {
    linear: (t) => t,
    quad: (t) => t * t,
    cubic: (t) => t * t * t,
    poly: (n) => (t) => Math.pow(t, n),
    sin: (t) => 1 - Math.cos((t * Math.PI) / 2),
    exp: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
    in: (e) => e,
    out: (e) => (t) => 1 - e(1 - t),
    inOut: (e) => (t) => (t < 0.5 ? e(t * 2) / 2 : 1 - e((1 - t) * 2) / 2),
    bezier(x1, y1, x2, y2) {
      const bx = (t) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
      const by = (t) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
      return (x) => {
        let lo = 0;
        let hi = 1;
        for (let i = 0; i < 30; i++) {
          const mid = (lo + hi) / 2;
          if (bx(mid) < x) lo = mid;
          else hi = mid;
        }
        return by((lo + hi) / 2);
      };
    },
  };

  /**
   * Drive render(frame) from a scene's paused timeline. The timeline gets one
   * linear tween over the scene's frame count; every seek re-renders the frame.
   */
  function drive(tl, fps, frames, render) {
    const clock = { f: 0 };
    render(0);
    tl.to(
      clock,
      { f: frames, duration: frames / fps, ease: "none", onUpdate: () => render(Math.round(clock.f)) },
      0,
    );
    return tl;
  }

  /** Create an SVG element with attributes. */
  function svg(tag, attrs, parent) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const k in attrs || {}) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  /** Set several SVG attributes at once. */
  function attrs(el, values) {
    for (const k in values) el.setAttribute(k, values[k]);
  }

  window.FrameKit = { CLAMP, interpolate, spring, Easing, drive, svg, attrs };
})();
