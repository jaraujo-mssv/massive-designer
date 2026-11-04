// hiring.js: the hiring photos, shared by the square hiring posts (hiring-photo-square and the images built on it).
// Load it before ../_lib/image-kit.js and call hiringPhoto() from window.onFields.
//
// Each photo (<name>.webp, generated from <name>.txt) has its subject in the right 60% and an empty, bright left side.
// Per photo:
//   seam   where that empty side ends, as a % of the canvas: the cream wash is near-solid up to it, then fades
//   shift  px to slide the photo right when its subject sits too far left for the headline
//   arrow  the canvas point the handwritten note's arrow lands on
//   zoom   optional: scales the photo from its bottom edge, so a head reaches the top of the text and the canvas stays full
window.HIRING_PHOTOS = {
  "home-office.webp": { seam: 57, shift: 0, arrow: [790, 745] },
  "standing-call.webp": { seam: 55.7, shift: 30, arrow: [916, 562] },
  "window-seat-sf.webp": { seam: 55.7, shift: 4, arrow: [952, 376] },
  "standing-desk.webp": { seam: 53.3, shift: 13, arrow: [653, 955] },
  "coffee-desk.webp": { seam: 55.4, shift: 0, arrow: [904, 791] },
  "event-handshake.webp": { seam: 56.5, shift: 83, arrow: [864, 715] },
  "leaning-back.webp": { seam: 55.7, shift: 83, arrow: [987, 616] },
  "home-lab.webp": { seam: 56.6, shift: 57, arrow: [864, 485] },
  "cafe.webp": { seam: 51.3, shift: 0, arrow: [790, 573] },
  "sofa.webp": { seam: 54.1, shift: 83, arrow: [697, 595] },
  "balcony-abroad.webp": { seam: 55, shift: 0, arrow: [775, 765] },
  "kitchen-sunrise.webp": { seam: 53, shift: 0, arrow: [765, 735] },
  "hammock.webp": { seam: 54.1, shift: 110, arrow: [750, 715] },
  "event-ambassador-sf.webp": { seam: 54, shift: -77, arrow: [777, 651], zoom: 1.269 },
  "ops-playbook.webp": { seam: 51, shift: -7, arrow: [830, 752], zoom: 1.2 },
  "beach-lounger.webp": { seam: 52, shift: 76, arrow: [696, 650] },
};

// Fit the wash and the photo to the photo the post shows (an upload or a link gets middling values), and return
// the point the note's arrow should land on.
window.hiringPhoto = (canvas) => {
  const img = canvas.querySelector(".photo");
  const src = img.getAttribute("src") ?? "";
  const match = Object.entries(HIRING_PHOTOS).find(([file]) => src.endsWith(`/${file}`));
  const photo = match ? match[1] : { seam: 55, shift: 40, arrow: [820, 700] };
  const zoom = photo.zoom ?? 1;
  img.style.width = `${880 * zoom}px`;
  img.style.height = `${1080 * zoom}px`;
  img.style.top = `${1080 - 1080 * zoom}px`;
  canvas.style.setProperty("--seam", `${photo.seam}%`);
  canvas.style.setProperty("--shift", `${photo.shift}px`);
  return photo.arrow;
};
