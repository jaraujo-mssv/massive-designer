// arrow.js: the hand-drawn arrow that runs from a handwritten note to what it points at.
//
//   <svg class="arrow" viewBox="0 0 1080 1350"><path class="curve" /><path class="head" /></svg>   (canvas-sized)
//   <script src="../_lib/arrow.js"></script>
//   massiveArrow(svg, noteEl, [790, 745]);   // in onFields, after the note's text is set
//
// The arrow starts just past the end of the note, wherever its text ends, runs out flat and curves into the target
// (canvas px). The svg must cover the canvas with a viewBox of the canvas size.
window.massiveArrow = (svg, note, [tx, ty]) => {
  const canvas = svg.closest("#canvas").getBoundingClientRect();
  const r = note.getBoundingClientRect();
  // The note is tilted up to the right, so its last letters sit near the top of its bounding box.
  const sx = r.right - canvas.left + 16;
  const sy = r.top - canvas.top + r.height * 0.42;
  const dx = tx - sx;
  const dy = ty - sy;
  const c1 = [sx + 0.3 * dx, sy + 8];
  const c2 = [sx + 0.72 * dx, sy + 0.25 * dy];
  let ux = tx - c2[0];
  let uy = ty - c2[1];
  const len = Math.hypot(ux, uy) || 1;
  ux /= len;
  uy /= len;
  const arm = (a) => [tx + 30 * (-ux * Math.cos(a) + uy * Math.sin(a)), ty + 30 * (-ux * Math.sin(a) - uy * Math.cos(a))];
  const [a, b] = [arm(Math.PI / 6), arm(-Math.PI / 6)];
  const r1 = (n) => Math.round(n);
  svg.querySelector(".curve").setAttribute("d", `M${r1(sx)} ${r1(sy)} C ${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${tx} ${ty}`);
  svg.querySelector(".head").setAttribute("d", `M${r1(a[0])} ${r1(a[1])} L ${tx} ${ty} L ${r1(b[0])} ${r1(b[1])}`);
};
