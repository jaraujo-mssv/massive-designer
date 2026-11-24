/*
 * OLCamera — a laptop around the desktop and a 3D camera on it, for onelaunch-file-scanning-3d (after the camera work
 * in OneLaunch's homepage tour). Everything is a pure function of the film's time T, so any frame seeks on its own.
 *
 *   const cam = OLCamera.rig(desk);                       wraps .pc-desktop in a lid (bezel, back) and a base
 *   cam.set(OLCamera.poseAt(shots, T), lidAngle, awake)   aims the camera, opens the lid, wakes the screen
 *
 * A shot is { t, move, at: [x, y], zoom, ry, rx, drift }: the camera arrives at that pose at t after `move` seconds of
 * travel (0 = a cut), then pushes in by `drift` per second until the next move starts. `at` is a point on the screen
 * in frame pixels, measured before the rig goes on; rx/ry tilt the screen (degrees) around that point.
 *
 * Space: the camera is fixed to the laptop's base. The lid turns on its hinge (LID_OPEN degrees back from upright
 * when open, LID_SHUT closed), and the shots are written against the open lid, so the lid can open and close under a
 * camera that holds still.
 */
(function () {
  const P = 2400; // perspective distance, px
  const HINGE_Y = 1080 + 64; // the lid's bottom edge (bezel included), in screen pixels
  const LID_OPEN = 18;
  const LID_SHUT = -88;
  const easeIO = (v) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  function rig(desk) {
    const root = desk.parentNode;
    const mk = (cls, html) => {
      const el = document.createElement('div');
      el.className = cls;
      if (html) el.innerHTML = html;
      el.setAttribute('data-layout-ignore', ''); // the laptop is a picture, not copy to audit
      return el;
    };
    const stage = mk('cam-stage');
    const cam = mk('cam-world');
    const base = mk('cam-base', '<div class="cam-keys"></div><div class="cam-pad"></div><div class="cam-hinge"></div>');
    const lid = mk('cam-lid');
    const back = mk('cam-back');
    const bezel = mk('cam-bezel');
    const glare = mk('cam-glare');
    const dark = mk('cam-dark');
    root.insertBefore(stage, desk);
    stage.appendChild(cam);
    cam.append(base, lid);
    lid.append(back, bezel, desk, dark, glare);

    // Supersample: lay the screen out at 2x and shrink it back, so close-ups get real pixels, not a stretched 1x bitmap.
    desk.style.zoom = '2';
    desk.style.transformOrigin = '0 0';
    desk.style.transform = 'scale(0.5)';
    desk.style.backfaceVisibility = 'hidden';

    const unHinge = `translate3d(0, ${HINGE_Y}px, 0) rotateX(${-LID_OPEN}deg) translate3d(0, ${-HINGE_Y}px, 0)`;
    return {
      set(c, lidAngle = LID_OPEN, awake = 1) {
        cam.style.transform =
          `translate3d(960px, 540px, 0) scale3d(${c.zoom}, ${c.zoom}, ${c.zoom}) rotateX(${c.rx}deg) rotateY(${c.ry}deg) ` +
          `translate3d(${-c.at[0]}px, ${-c.at[1]}px, 0) ${unHinge}`;
        lid.style.transform = `rotateX(${lidAngle}deg)`;
        dark.style.opacity = 1 - awake;
        glare.style.opacity = 0.35 + 0.65 * awake;
      },
    };
  }

  const held = (k, T) => ({ ...k, zoom: k.zoom * (1 + (k.drift ?? 0.01) * Math.max(0, T - k.t)) });
  function mix(a, b, p) {
    const l = (x, y) => x + (y - x) * p;
    return {
      at: [l(a.at[0], b.at[0]), l(a.at[1], b.at[1])],
      zoom: Math.exp(l(Math.log(a.zoom), Math.log(b.zoom))),
      rx: l(a.rx, b.rx),
      ry: l(a.ry, b.ry),
    };
  }
  /** The pose at T from shots 0..n. A move that starts before the previous one lands leaves from where that one was. */
  function poseUpTo(keys, n, T) {
    let i = 0;
    while (i + 1 <= n && T >= keys[i + 1].t - (keys[i + 1].move || 0)) i++;
    const k = keys[i];
    if (i === 0 || T >= k.t || !k.move) return held(k, T);
    const start = k.t - k.move;
    return mix(poseUpTo(keys, i - 1, start), k, easeIO(clamp01((T - start) / k.move)));
  }
  const poseAt = (keys, T) => poseUpTo(keys, keys.length - 1, T);
  /** The lid's angle: shut → open over [a, b], open → shut over [c, d]. */
  function lidAt(T, [a, b], [c, d]) {
    const open = easeIO(clamp01((T - a) / (b - a))) * (1 - easeIO(clamp01((T - c) / (d - c))));
    return LID_SHUT + (LID_OPEN - LID_SHUT) * open;
  }

  window.OLCamera = { rig, poseAt, lidAt, easeIO, clamp01 };
})();
