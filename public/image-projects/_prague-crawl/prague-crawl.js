// prague-crawl.js: helpers for the Prague Crawl image pages. Load it before ../_lib/image-kit.js and call them
// from window.onFields.

// Shrink an element's font size from `max` until its text fits its box: its width, and also `maxHeight` px when
// given (for text that wraps). Never below `min`.
window.pcFit = (el, max, min = Math.round(max * 0.6), maxHeight = null) => {
  let size = max;
  el.style.fontSize = `${size}px`;
  const over = () => el.scrollWidth > el.clientWidth || (maxHeight !== null && el.scrollHeight > maxHeight);
  while (size > min && over()) {
    size -= 2;
    el.style.fontSize = `${size}px`;
  }
};

// The event photos a photo post offers as ready-made choices in its "photo" field (meta.json options), and where
// to crop each in the tall poster frame (.pc-poster) and in the "in numbers" frame.
window.PC_PHOTOS = {
  room: { file: "photo-room.jpg", poster: "50% 80%", numbers: "50% 45%" },
  stage: { file: "photo-stage.jpg", poster: "50% 30%", numbers: "50% 35%" },
  speaker: { file: "photo-speaker.jpg", poster: "60% 30%", numbers: "55% 40%" },
  panel: { file: "photo-panel.jpg", poster: "45% 50%", numbers: "50% 40%" },
  networking: { file: "photo-networking.jpg", poster: "58% 35%", numbers: "50% 30%" },
  phone: { file: "photo-phone.jpg", poster: "50% 40%", numbers: "50% 35%" },
};

// Crop a .pc-photo <img> for the photo it shows: a ready-made one by its own crop, an upload or a link centred.
window.pcCrop = (img) => {
  const src = img.getAttribute("src") ?? "";
  const photo = Object.values(PC_PHOTOS).find((p) => src.endsWith(`/${p.file}`));
  img.style.objectPosition = photo ? photo[img.closest(".pc-poster") ? "poster" : "numbers"] : "50% 40%";
};

// Mark every field whose value is still a placeholder in square brackets ("[Price]") with .pc-tbc.
window.pcPlaceholders = (root = document.getElementById("canvas")) => {
  for (const el of root.querySelectorAll("[data-field]")) {
    el.classList.toggle("pc-tbc", /^\s*\[[^\]]*\]\s*$/.test(el.textContent));
  }
};
