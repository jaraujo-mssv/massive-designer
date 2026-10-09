// confetti.js: a frozen confetti scatter, the same seeded pieces and physics as the video confetti
// (public/video-projects/jason-15k-*), evaluated once at a chosen moment of the burst.
//
//   <div class="confetti" data-field-show="confetti"></div>
//   <script src="../_lib/confetti.js"></script>
//   <script>massiveConfetti(document.querySelector(".confetti"), { mode: "cannons", count: 150, at: 1.4 });</script>
//
// mode "cannons": two cannons fire up and in from the bottom corners (needs the layer to fill the canvas).
// mode "burst":   one burst from a point ({ x, y }), up and out.
// at: seconds after the burst. Smaller is tighter around the origin; around 1.2–2 fills the frame.
window.massiveConfetti = (layer, opts = {}) => {
  const { mode = "cannons", count = 150, at = 1.4, seed: seed0 = 20261008, x = 540, y = 560 } = opts;
  const W = layer.clientWidth || 1080;
  const H = layer.clientHeight || 1350;
  let seed = seed0;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const COLORS = ["#d74939", "#ff8163", "#faf4ec", "#f1ead8", "#b8321f"];
  const DRAG = 2.2;
  const G = 900;
  const small = mode === "burst";

  layer.replaceChildren();
  for (let i = 0; i < count; i++) {
    const kind = rand();
    const w = kind < 0.2 ? (small ? 12 : 14) : kind < 0.6 ? (small ? 10 : 11) : small ? 6 : 7;
    const h = kind < 0.2 ? (small ? 12 : 14) : kind < 0.6 ? (small ? 16 : 18) : small ? 22 : 26;
    const color = COLORS[Math.floor(rand() * COLORS.length)];
    let x0, y0, vx, vy;
    if (mode === "burst") {
      const angle = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.3;
      const speed = 900 + rand() * 1500;
      x0 = x + (rand() - 0.5) * 300;
      y0 = y + (rand() - 0.5) * 80;
      vx = Math.cos(angle) * speed;
      vy = Math.sin(angle) * speed;
    } else {
      const left = i % 2 === 0;
      const elev = ((62 + (rand() - 0.5) * 28) * Math.PI) / 180;
      const speed = 1900 + rand() * 1500;
      x0 = left ? -10 + rand() * 30 : W + 10 - rand() * 30;
      y0 = H + 20 - rand() * 30;
      vx = (left ? 1 : -1) * Math.cos(elev) * speed;
      vy = -Math.sin(elev) * speed;
    }
    const r0 = rand() * 360;
    const vr = (rand() - 0.5) * 900;
    const flip = 2 + rand() * 5;
    const delay = rand() * (small ? 0.12 : 0.14);

    const s = at - delay;
    const k = (1 - Math.exp(-DRAG * s)) / DRAG;
    const px = x0 + vx * k + Math.sin(s * flip) * 18;
    const py = y0 + vy * k + (G / DRAG) * (s - k);
    const rot = r0 + vr * s;
    // Keep each piece at least a third open so none reads as a sliver.
    const sy = Math.cos(s * flip * 2);
    const flat = Math.sign(sy || 1) * Math.max(0.35, Math.abs(sy));

    const el = document.createElement("i");
    el.style.cssText = `position:absolute;left:0;top:0;display:block;width:${w}px;height:${h}px;border-radius:${kind < 0.2 ? "50%" : "2px"};background:${color};transform:translate(${px.toFixed(1)}px,${py.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scaleY(${flat.toFixed(3)})`;
    layer.appendChild(el);
  }
};
