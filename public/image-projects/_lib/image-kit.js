// image-kit.js: field binding for an image project page (public/image-projects/<id>/index.html).
//
// Include it last in the page: <script src="../_lib/image-kit.js"></script>
//
// The image is #canvas. Fields come from the project's meta.json and bind in markup:
//   data-field="name"        sets the element's text
//   data-field-src="photo"   sets an <img> src
//   data-field-show="confetti"  hides the element when the toggle is off
// A page can define window.onFields(values) (sync or async) for anything derived from the values,
// e.g. redrawing a canvas. It runs after every update.
//
// On load the kit applies meta.json's defaults, waits for fonts and images, then marks
// <html data-ready="1"> and posts { type: "image-kit:ready" } to the parent. The Images tab
// then sends { type: "image-kit:fields", values } on every edit and gets { type: "image-kit:applied" } back.
(() => {
  const canvas = document.getElementById("canvas");
  let fields = [];
  let values = {};

  const imagesLoaded = () =>
    Promise.all(
      [...canvas.querySelectorAll("img")].map((img) => {
        if (img.complete) return null;
        return new Promise((done) => {
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        });
      }),
    );

  async function apply(next) {
    values = { ...values, ...next };
    for (const el of canvas.querySelectorAll("[data-field]")) {
      const v = values[el.dataset.field];
      if (v !== undefined && el.textContent !== String(v)) el.textContent = String(v);
    }
    for (const el of canvas.querySelectorAll("[data-field-src]")) {
      const v = values[el.dataset.fieldSrc];
      if (v && el.getAttribute("src") !== v) el.setAttribute("src", v);
    }
    for (const el of canvas.querySelectorAll("[data-field-show]")) {
      el.classList.toggle("is-hidden", values[el.dataset.fieldShow] === false);
    }
    await document.fonts.ready;
    await imagesLoaded();
    if (typeof window.onFields === "function") await window.onFields(values);
  }

  const post = (msg) => window.parent !== window && window.parent.postMessage(msg, location.origin);

  window.addEventListener("message", async (e) => {
    if (e.origin !== location.origin || e.data?.type !== "image-kit:fields") return;
    await apply(e.data.values ?? {});
    post({ type: "image-kit:applied" });
  });

  (async () => {
    try {
      const meta = await fetch("meta.json", { cache: "no-cache" }).then((r) => r.json());
      fields = meta.fields ?? [];
    } catch {
      fields = [];
    }
    await apply(Object.fromEntries(fields.map((f) => [f.id, f.default])));
    document.documentElement.dataset.ready = "1";
    post({ type: "image-kit:ready" });
  })();

  window.imageKit = { apply, values: () => values };
})();
