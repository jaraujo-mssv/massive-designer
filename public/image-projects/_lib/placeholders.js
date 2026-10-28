// placeholders.js: marks a field still waiting for its real value, so a template's missing fact can't pass for a
// real one. Any [data-field] whose whole text is in square brackets ("[Talk title]", "[Date]") gets .m-tbc: red-light
// text in a dashed outline (paper-red on the light register).
//
//   <script src="../_lib/placeholders.js"></script>
//   window.onFields = () => { massivePlaceholders(); … };   // root defaults to #canvas
//
// The house version of _prague-crawl's pcPlaceholders.
(() => {
  const style = document.createElement("style");
  style.textContent = `
.m-tbc { color: var(--m-red-light) !important; outline: 2px dashed var(--m-red-light); outline-offset: 6px; }
#canvas.soft-orange .m-tbc, #canvas.light .m-tbc { color: #d54635 !important; outline-color: #d54635; }`;
  document.head.append(style);

  window.massivePlaceholders = (root = document.getElementById("canvas")) => {
    for (const el of root.querySelectorAll("[data-field]"))
      el.classList.toggle("m-tbc", /^\s*\[[^\]]*\]\s*$/.test(el.textContent));
  };
})();
