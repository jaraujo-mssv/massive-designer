/*
 * PcDesktop — a Windows desktop around one arbitrary window, for the four pc-* scenes.
 *
 * Ported from sparktray-campaign brand/ui/pc/PcDesktop.tsx + PcScene.tsx and the
 * Cursor / SystemTray / TASKBAR_SCALE constants in brand/ui/app/shell.tsx. Same
 * geometry, same wallpaper and taskbar art, same pointer and click ring.
 *
 * Markup contract, inside a scene root:
 *
 *   <div class="pc-desktop" data-win-w="1040" data-win-h="660" data-fill="0.86" data-pinned>
 *     <div class="pc-window"> …the screen, at its native pixel size… </div>
 *   </div>
 *
 * PcDesktop.build(el, prefix) wraps .pc-window in the fitted, scaled frame, adds the
 * wallpaper, taskbar, rebuilt system tray, optional pinned app, click ring and cursor,
 * and returns { geometry, set({ open, cursor }) }. `cursor` is { at: [x, y], press }
 * in frame space, or null.
 */
(function () {
  const TASKBAR_SCALE = 1.3;
  const CURSOR_SCALE = 1.5;
  const TRAY_CLIP_X = 1400;
  const TASKBAR_ASPECT = 1920 / 60;
  const PINNED_X = 1150;
  const PINNED_SIZE = 30;
  /** PcScene reserves the subtitle band even with subtitles off: height * 0.157. */
  const BAND_SHARE = 0.157;

  function pcGeometry(width, height, w, h, bottomInset, fill) {
    const taskbarW = width * TASKBAR_SCALE;
    const taskbarH = taskbarW / TASKBAR_ASPECT;
    const taskbarLeft = (width - taskbarW) / 2;
    const taskbarTop = height - taskbarH;
    const deskH = taskbarTop - bottomInset;
    const scale = Math.min((width * fill) / w, (deskH * fill) / h);
    const left = (width - w * scale) / 2;
    const top = (deskH - h * scale) / 2;
    const pinScale = taskbarW / 1920;
    return {
      scale,
      left,
      top,
      taskbarLeft,
      taskbarTop,
      taskbarW,
      taskbarH,
      pinnedCenter: [taskbarLeft + PINNED_X * pinScale, taskbarTop + taskbarH / 2],
      pinnedSize: PINNED_SIZE * pinScale,
      mapWindow: (x, y) => [left + x * scale, top + y * scale],
    };
  }

  /** shell.tsx trayLayout: ^ app wifi volume battery clock, right-aligned. */
  function trayLayout(width, barH) {
    const iconSize = barH * 0.3;
    const gap = barH * 0.3;
    const step = iconSize + gap;
    const rightPad = barH * 0.5;
    const clockW = barH * 0.98;
    const clockGap = barH * 0.6;
    const batteryCx = width - rightPad - clockW - clockGap - iconSize / 2;
    return {
      iconSize,
      batteryCx,
      volumeCx: batteryCx - step,
      wifiCx: batteryCx - 2 * step,
      chevronCx: batteryCx - 4 * step,
      clockRightPad: rightPad,
      clockTimeSize: barH * 0.17,
      clockDateSize: barH * 0.15,
    };
  }

  const div = (style, html) => {
    const el = document.createElement("div");
    el.setAttribute("style", style);
    if (html) el.innerHTML = html;
    return el;
  };

  function build(desk, prefix) {
    const K = window.ConsentKit;
    const width = 1920;
    const height = 1080;
    const w = Number(desk.dataset.winW);
    const h = Number(desk.dataset.winH);
    const fill = Number(desk.dataset.fill);
    const pinned = desk.hasAttribute("data-pinned");
    const g = pcGeometry(width, height, w, h, height * BAND_SHARE, fill);
    const win = desk.querySelector(".pc-window");

    desk.setAttribute(
      "style",
      `position:absolute;left:0;top:0;width:${width}px;height:${height}px;overflow:hidden;background:#0a0a0f;`,
    );

    // Wallpaper, under everything. The image itself is `.pc-wallpaper` in index.html, so the
    // asset is referenced from HTML (the compiler and build-index both discover it there).
    const wall = div("position:absolute;inset:0;");
    wall.className = "pc-wallpaper";
    desk.insertBefore(wall, win);

    // The window: fitted by a top-left scale, then grown up from the bar by `open`.
    const frame = div(
      `position:absolute;left:${g.left}px;top:${g.top}px;width:${w}px;height:${h}px;transform:scale(${g.scale});transform-origin:top left;`,
    );
    const opener = div("width:100%;height:100%;transform-origin:50% 100%;");
    desk.insertBefore(frame, win);
    frame.appendChild(opener);
    opener.appendChild(win);

    // Taskbar: uniform backing, then the glyph art clipped left of the baked tray.
    const clip = g.taskbarW - (TRAY_CLIP_X / 1920) * g.taskbarW;
    const art = window.WC_TASKBAR_SVG.replace(/id="([^"]+)"/g, `id="${prefix}-$1"`).replace(
      /url\(#([^)]+)\)/g,
      `url(#${prefix}-$1)`,
    );
    const bar = div(`position:absolute;left:${g.taskbarLeft}px;top:${g.taskbarTop}px;`);
    const barInner = div(`position:relative;width:${g.taskbarW}px;height:${g.taskbarH}px;line-height:0;`);
    barInner.appendChild(div("position:absolute;inset:0;background:rgba(24, 24, 28, 0.86);"));
    barInner.appendChild(div(`position:absolute;inset:0;clip-path:inset(0 ${clip}px 0 0);`, art));
    bar.appendChild(barInner);
    // The bar is 1.3x the frame and centred, so it runs off both edges by design (the weather
    // widget crops off left); the Figma art's backdrop-blur foreignObject bleeds past its box.
    bar.setAttribute("data-layout-allow-overflow", "");
    barInner.querySelectorAll("div, svg, foreignObject").forEach((n) => n.setAttribute("data-layout-allow-overflow", ""));
    desk.appendChild(bar);

    // The host app pinned in the next free slot, with its running pill.
    let pill = null;
    if (pinned) {
      const [cx, cy] = g.pinnedCenter;
      const s = g.pinnedSize;
      desk.appendChild(
        div(
          `position:absolute;left:${cx - s / 2}px;top:${cy - s / 2}px;width:${s}px;height:${s}px;border-radius:${s * 0.22}px;background:var(--brand-accent);display:flex;align-items:center;justify-content:center;`,
          K.icon("Film", { size: s * 0.56, color: "#fff", sw: 2 }),
        ),
      );
      pill = div(
        `position:absolute;top:${cy + s * 0.72}px;height:${Math.max(1, s * 0.09)}px;border-radius:${s * 0.05}px;background:var(--brand-accent);`,
      );
      desk.appendChild(pill);
    }

    // Rebuilt system tray. The brandless tray has no app icon (TrayIcon returns null).
    const L = trayLayout(width, g.taskbarH);
    const cy = g.taskbarTop + g.taskbarH / 2;
    const glyph = "rgba(255, 255, 255, 0.9)";
    const box = (cx, size) =>
      `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;transform:translate(-50%, -50%);display:flex;align-items:center;justify-content:center;`;
    [
      ["ChevronUp", L.chevronCx],
      ["Wifi", L.wifiCx],
      ["Volume2", L.volumeCx],
      ["BatteryMedium", L.batteryCx],
    ].forEach(([name, cx]) => desk.appendChild(div(box(cx, L.iconSize), K.icon(name, { size: L.iconSize, color: glyph, sw: 2 }))));
    desk.appendChild(
      div(
        `position:absolute;right:${L.clockRightPad}px;top:${cy}px;transform:translateY(-50%);text-align:right;font-family:'Inter', system-ui, sans-serif;color:${glyph};line-height:1.25;`,
        `<div style="font-size:${L.clockTimeSize}px">11:00 AM</div><div style="font-size:${L.clockDateSize}px">10/05/2021</div>`,
      ),
    );

    // Click ring and pointer, on top.
    const ring = div("position:absolute;border-radius:50%;z-index:39;opacity:0;");
    desk.appendChild(ring);
    const cursor = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    cursor.setAttribute("width", "20");
    cursor.setAttribute("height", "24");
    cursor.setAttribute("viewBox", "0 0 20 24");
    cursor.setAttribute(
      "style",
      `position:absolute;left:0;top:0;z-index:40;pointer-events:none;transform:scale(${CURSOR_SCALE});transform-origin:top left;opacity:0;`,
    );
    cursor.innerHTML =
      '<path d="M2 1 L2 19 L7 14.5 L10.5 22 L13.5 20.5 L10 13.5 L16.5 13.5 Z" fill="#fafafa" stroke="#09090b" stroke-width="1.2" stroke-linejoin="round"/>';
    desk.appendChild(cursor);

    function set({ open = 1, cursor: c = null }) {
      opener.style.opacity = open;
      opener.style.transform = `translateY(${(1 - open) * 26}px) scale(${0.93 + 0.07 * open})`;
      if (pill) {
        const s = g.pinnedSize;
        pill.style.left = `${g.pinnedCenter[0] - s * 0.3 * open}px`;
        pill.style.width = `${s * 0.6 * open}px`;
        pill.style.opacity = open;
      }
      if (!c) {
        cursor.style.opacity = 0;
        ring.style.opacity = 0;
        return;
      }
      cursor.style.opacity = 1;
      cursor.style.left = `${c.at[0] - 3}px`;
      cursor.style.top = `${c.at[1] - 1.5}px`;
      if (c.press > 0) {
        const r = 13 + 19 * (1 - c.press);
        Object.assign(ring.style, {
          left: `${c.at[0] - r}px`,
          top: `${c.at[1] - r}px`,
          width: `${r * 2}px`,
          height: `${r * 2}px`,
          border: `${Math.max(1, 2.5 * c.press)}px solid rgba(255,255,255,0.9)`,
          boxShadow: `0 0 0 1px rgba(0,0,0,${0.45 * c.press}), inset 0 0 0 1px rgba(0,0,0,${0.45 * c.press})`,
          opacity: c.press * 0.9,
        });
      } else {
        ring.style.opacity = 0;
      }
    }

    /** Resolve a PcScene stop track at t: stops in window space unless `space` says otherwise. */
    function cursorFor(stops, t, runSeconds) {
      return K.cursorAt(stops, t, K.paceOf(runSeconds), (stop) =>
        stop.space === "pinned" ? g.pinnedCenter : stop.space === "frame" ? stop.at : g.mapWindow(stop.at[0], stop.at[1]),
      );
    }

    return { geometry: g, set, cursorFor };
  }

  window.PcDesktop = { build, pcGeometry };
})();
