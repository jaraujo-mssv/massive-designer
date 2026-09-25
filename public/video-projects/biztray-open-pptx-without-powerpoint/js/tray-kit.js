/*
 * tray-kit.js — the tray-app template videos, as one reusable piece.
 *
 * Master copy: public/video-projects/_templates/js/tray-kit.js. Every project whose
 * meta.json kind is "template" gets an identical copy in js/ via
 * `node scripts/video/sync-brand.mjs <id>` (the CLI only serves a project's own
 * folder). Edit the master, then re-sync; never edit a project's copy.
 *
 * Ported from sparktray-campaign (plain React + inline styles, no Remotion):
 *   brand/tokens.ts, brand/brands.ts        palette, accent vars, product copy
 *   brand/ui/app/shell.tsx                  window chrome, sidebar, panes, desktop
 *   brand/ui/app/director.ts                step grammar: (tool, step, t) -> frame
 *   brand/ui/app/sparktray*.tsx|ts          SparkTray panes + tutorial shots
 *   brand/ui/app/biztray*.tsx|ts            BizTray panes + tutorial shots
 *   brand/ui/AppScene.tsx, AppWindow.tsx    desktop framing, endcard window
 *   brand/ui/backdrop.tsx + backdrops/*     bg-contrast/caveat/mechanism/steps/scene
 *   brand/ui/Scene.tsx (Endcard)            the `logo` endcard
 *
 * Every component is a pure function of state that returns an HTML string, the
 * same way the React originals are pure in `t`. `TrayKit.mount()` builds the
 * static layers once and re-renders only what a frame changes, driven through
 * `FrameKit.drive()` so HyperFrames can seek any frame.
 */
(function () {
  const D = window.TrayData;

  /* ------------------------------------------------------------------ *
   * Tiny HTML-string helpers (React's inline-style semantics)
   * ------------------------------------------------------------------ */
  const UNITLESS = new Set(['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flex', 'flexGrow', 'flexShrink', 'zoom', 'order']);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function css(o) {
    let s = '';
    for (const k in o) {
      const v = o[k];
      if (v === undefined || v === null || v === false) continue;
      const prop = k.startsWith('--') ? k : k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
      s += `${prop}:${typeof v === 'number' && !UNITLESS.has(k) ? v + 'px' : v};`;
    }
    return s;
  }
  const h = (tag, style, inner = '', attrs = '') => `<${tag}${attrs ? ' ' + attrs : ''} style="${esc(css(style || {}))}">${inner}</${tag}>`;
  const div = (style, inner) => h('div', style, inner);
  const span = (style, inner) => h('span', style, inner);

  /* ------------------------------------------------------------------ *
   * Tokens (brand/tokens.ts, brand/brands.ts)
   * ------------------------------------------------------------------ */
  const BRANDS = {
    sparktray: {
      name: 'SparkTray',
      palette: { accent: '#4F43FF', accentHover: '#736AFF', accentActive: '#2718B3', accentRgb: '79 67 255' },
      product: { tagline: 'Your Windows utility belt', cta: 'Download for Windows', claims: ['Free', 'Runs on your PC', 'No account'] },
      firstTool: 'video-downloader',
    },
    biztray: {
      name: 'BizTray',
      palette: { accent: '#EB5943', accentHover: '#FF9E6A', accentActive: '#B31818', accentRgb: '235 89 67' },
      product: { tagline: 'Your Windows document utility belt', cta: 'Download for Windows', claims: ['Free', 'Runs on your PC', 'No watermark'] },
      firstTool: 'office-to-pdf',
    },
  };

  const color = {
    accent: 'var(--brand-accent)',
    accentHover: 'var(--brand-accent-hover)',
    accentActive: 'var(--brand-accent-active)',
    accentRgb: 'var(--brand-accent-rgb)',
    surfaceBase: '#0a0a0f',
    surfaceRaised: '#111117',
    surfaceOverlay: '#16161d',
    foreground: '#ededf2',
    foregroundMuted: '#bcbcca',
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.12)',
    success: '#00bb7f',
    danger: '#ff6568',
    white: '#ffffff',
  };
  const font = {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  };
  const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 };
  const radius = { sm: 6, md: 10, lg: 16, xl: 24, pill: 999 };
  const accentAlpha = (a) => `rgb(${color.accentRgb} / ${a})`;
  const plate = (at = '50% 30%') => `radial-gradient(ellipse at ${at}, ${accentAlpha(0.28)} 0%, rgba(10, 10, 15, 0) 65%), ${color.surfaceBase}`;

  /** BrandScope: the accent set as CSS custom properties on a subtree. */
  function brandVars(brand) {
    const p = BRANDS[brand].palette;
    return { '--brand-accent': p.accent, '--brand-accent-hover': p.accentHover, '--brand-accent-active': p.accentActive, '--brand-accent-rgb': p.accentRgb };
  }

  /* ------------------------------------------------------------------ *
   * Maths (brand/ui/parts.tsx, diagram.tsx)
   * ------------------------------------------------------------------ */
  const clamp = (t) => Math.min(1, Math.max(0, t));
  const clamp01 = clamp;
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const ease = easeOut;
  const lerp = (a, b, p) => a + (b - a) * p;
  function stagger(t, start, end) {
    if (end <= start) return t >= end ? 1 : 0;
    return clamp((t - start) / (end - start));
  }

  /* ------------------------------------------------------------------ *
   * Icons (lucide) and logos
   * ------------------------------------------------------------------ */
  function icon(name, { size = 24, color: stroke = 'currentColor', strokeWidth = 2, style } = {}) {
    const node = D.icons[name];
    if (!node) return '';
    const kids = node
      .map(([t, a]) => `<${t} ${Object.entries(a).map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}="${esc(v)}"`).join(' ')}/>`)
      .join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${esc(stroke)}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${style ? ` style="${esc(css(style))}"` : ''}>${kids}</svg>`;
  }

  /** backdrop.tsx iconFor: kebab token -> icon name (both `table-2` and `table2`). */
  const KEBAB = new Map();
  for (const name of Object.keys(D.icons)) {
    KEBAB.set(name.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase(), name);
    KEBAB.set(name.toLowerCase(), name);
  }
  const iconFor = (token) => (token && KEBAB.get(String(token).trim().toLowerCase())) || null;

  /** Logo.tsx: namespace internal ids per instance, size the outer <svg>. */
  function namespaceIds(svg, prefix) {
    const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]).sort((a, b) => b.length - a.length);
    let out = svg;
    for (const id of ids) {
      out = out.split(`id="${id}"`).join(`id="${prefix}${id}"`);
      out = out.split(`#${id}`).join(`#${prefix}${id}`);
    }
    return out;
  }
  const sizeSvg = (svg, w, hh) =>
    svg.replace(/<svg\b[^>]*>/, (tag) =>
      tag.replace(/\swidth="[^"]*"/, '').replace(/\sheight="[^"]*"/, '').replace(/^<svg/, `<svg width="${w}" height="${hh}"`),
    );
  let logoSeq = 0;
  function rawLogo(variant, w, hh, prefix) {
    const html = sizeSvg(prefix ? namespaceIds(variant.svg, `${prefix}-${logoSeq++}-`) : variant.svg, Math.round(w), Math.round(hh));
    return span({ display: 'inline-flex', lineHeight: 0, width: w, height: hh }, html);
  }
  const aspect = (v) => {
    const [, , w, hh] = v.viewBox.split(/\s+/).map(Number);
    return w / hh;
  };
  /** Flat tile: no internal ids, so it needs no namespacing. */
  const trayIcon = (brand, size) => rawLogo(D.logos[brand].flat, size, size);
  const wordmark = (brand, height, prefix) => {
    const v = D.logos[brand].lockupDark;
    return rawLogo(v, aspect(v) * height, height, prefix);
  };

  /* ------------------------------------------------------------------ *
   * Shell (brand/ui/app/shell.tsx)
   * ------------------------------------------------------------------ */
  const STAGE_W = 820;
  const STAGE_H = 620;
  const WINDOW = { left: 55, top: 12, width: 710, height: 580 };

  const S = {
    windowBg: color.surfaceRaised,
    panel: color.surfaceBase,
    control: color.surfaceOverlay,
    line: color.border,
    lineStrong: color.borderStrong,
    fg: color.foreground,
    fgMute: color.foregroundMuted,
    fgDim: 'rgba(237, 242, 242, 0.55)',
    fgFaint: 'rgba(237, 242, 242, 0.4)',
    fgGhost: 'rgba(237, 242, 242, 0.28)',
    accent: color.accent,
    accentText: color.accentHover,
    accentTint: accentAlpha(0.16),
    accentTintSoft: accentAlpha(0.12),
    accentBorder: accentAlpha(0.5),
    success: color.success,
    successTint: 'rgba(0, 187, 127, 0.16)',
    white: color.white,
  };

  const TITLEBAR_H = 36;
  const SIDEBAR_HEADER_H = 54;
  const NAV_LABEL_H = 27;
  const NAV_ROW_H = 28;
  const NAV_GROUP_PAD_B = 8;
  const NAV_X = 120;
  function navRowCenter(groups, id) {
    let y = WINDOW.top + TITLEBAR_H + SIDEBAR_HEADER_H;
    for (const group of groups) {
      y += NAV_LABEL_H;
      const i = group.items.findIndex((item) => item.id === id);
      if (i >= 0) return [NAV_X, y + i * NAV_ROW_H + NAV_ROW_H / 2];
      y += group.items.length * NAV_ROW_H + NAV_GROUP_PAD_B;
    }
    throw new Error(`No sidebar row "${id}"`);
  }
  const navItems = (groups) => groups.flatMap((g) => g.items);

  const card = { borderRadius: 8, border: `1px solid ${S.line}`, background: S.panel, padding: 16, boxSizing: 'border-box' };

  const cursorSvg = () =>
    `<svg width="20" height="24" viewBox="0 0 20 24"><path d="M2 1 L2 19 L7 14.5 L10.5 22 L13.5 20.5 L10 13.5 L16.5 13.5 Z" fill="#fafafa" stroke="#09090b" stroke-width="1.2" stroke-linejoin="round"/></svg>`;

  function navGroup(label, items, active, hover) {
    return div(
      { padding: '0 8px 8px' },
      div({ padding: '8px 8px 4px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: S.fgGhost }, esc(label)) +
        items
          .map(({ id, label: text, icon: ic }) => {
            const on = id === active;
            const over = !on && hover === `nav:${id}`;
            return div(
              {
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderRadius: 6,
                padding: '6px 8px',
                fontSize: 13,
                color: on || over ? S.accentText : S.fgMute,
                background: on ? S.accentTint : over ? 'rgba(255,255,255,0.06)' : 'transparent',
                whiteSpace: 'nowrap',
              },
              icon(ic, { size: 16, color: on ? S.accent : over ? S.fgMute : S.fgDim, style: { flexShrink: 0 } }) + esc(text),
            );
          })
          .join(''),
    );
  }

  function sidebar(def, active, hover) {
    return div(
      { display: 'flex', width: 208, flexShrink: 0, flexDirection: 'column', borderRight: `1px solid ${S.line}`, background: S.panel },
      div({ display: 'flex', alignItems: 'center', gap: 8, padding: 16 }, trayIcon(def.brand, 22) + span({ fontSize: 14, fontWeight: fontWeight.semibold, color: S.fg }, esc(def.name))) +
        def.groups.map((g) => navGroup(g.label, g.items, active, hover)).join('') +
        div({ marginTop: 'auto', borderTop: `1px solid ${S.line}`, padding: '12px 16px', fontSize: 11, color: S.fgGhost }, esc(def.version)),
    );
  }

  function titleBar(def) {
    return div(
      { display: 'flex', height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${S.line}`, background: S.panel, padding: '0 12px' },
      div({ display: 'flex', alignItems: 'center', gap: 8 }, trayIcon(def.brand, 16) + span({ fontSize: 12, color: S.fgMute }, esc(def.name))) +
        div(
          { display: 'flex', alignItems: 'center', gap: 12, color: S.fgDim },
          span({ height: 1, width: 12, background: S.fgDim }) + span({ height: 10, width: 10, border: `1px solid ${S.fgDim}` }) + icon('X', { size: 14, color: S.fgDim }),
        ),
    );
  }

  function paneHeader(groups, id) {
    const all = navItems(groups);
    const item = all.find((n) => n.id === id) || all[0];
    return div(
      { display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${S.line}`, padding: '14px 24px' },
      icon(item.icon, { size: 16, color: S.accent }) + span({ fontSize: 14, fontWeight: fontWeight.medium, color: S.fg }, esc(item.label)),
    );
  }

  function chip(label, on) {
    return span(
      {
        borderRadius: 999,
        padding: '4px 10px',
        fontSize: 12,
        color: on ? S.white : S.fgMute,
        background: on ? S.accent : 'transparent',
        border: on ? '1px solid transparent' : `1px solid ${S.lineStrong}`,
        whiteSpace: 'nowrap',
      },
      esc(label),
    );
  }

  function chipRail(state, id, items, on, pad = 8) {
    const rail = (state.rails && state.rails[id]) || { items, on };
    return div({ display: 'flex', gap: 8, paddingTop: pad, flexWrap: 'wrap' }, rail.items.map((l) => chip(l, rail.on.includes(l))).join(''));
  }

  /** HoverAction context: set by appStage around renderPane. */
  let hoverAction = false;
  function actionButton(label, ic, press) {
    const over = hoverAction;
    return div(
      {
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 8,
        background: S.accent,
        padding: '10px 0',
        fontSize: 14,
        fontWeight: fontWeight.medium,
        color: S.white,
        boxSizing: 'border-box',
        filter: over ? 'brightness(1.12)' : 'none',
        boxShadow: over ? `0 4px 14px ${S.accentTint}` : 'none',
        transform: `scale(${(over ? 1.012 : 1) - 0.04 * (press || 0)})`,
      },
      icon(ic, { size: 16, color: S.white }) + esc(label),
    );
  }

  const fileRow = (name) =>
    div(
      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, border: `1px solid ${S.line}`, background: S.panel, padding: '10px 12px' },
      span({ fontSize: 14, color: S.fg }, esc(name)) + icon('X', { size: 14, color: S.fgDim }),
    );

  const dropZone = (title, hint) =>
    div(
      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px dashed ${S.lineStrong}`, padding: '48px 0' },
      icon('Upload', { size: 20, color: S.fgFaint }) +
        div({ paddingTop: 12, fontSize: 14, color: S.fgMute }, esc(title)) +
        div({ paddingTop: 4, fontSize: 12, color: S.fgGhost }, esc(hint)),
    );

  function jobRow(job, progress, bar = true) {
    const done = job.status === 'done';
    return (
      div(
        { display: 'flex', alignItems: 'center', gap: 12, padding: 12 },
        div({ display: 'flex', height: 32, width: 32, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: S.control }, icon(job.icon, { size: 16, color: S.fgMute })) +
          div({ flex: 1, minWidth: 0 }, div({ fontSize: 14, color: S.fg }, esc(job.name)) + div({ paddingTop: 2, fontSize: 12, color: S.fgDim }, esc(job.sub))) +
          span(
            {
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: done ? S.success : S.accentText,
              background: done ? S.successTint : S.accentTint,
            },
            (done ? icon('Check', { size: 12, color: S.success }) : '') + (done ? 'Done' : 'Running'),
          ),
      ) + (bar ? div({ height: 4, background: S.lineStrong }, div({ height: '100%', width: `${progress}%`, background: done ? S.success : S.accent })) : '')
    );
  }

  function queuePane(job, progress, count, history = []) {
    return div(
      { padding: 24 },
      div(
        { display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12 },
        icon('ListChecks', { size: 16, color: S.accent }) + span({ fontSize: 14, fontWeight: fontWeight.medium, color: S.fg }, 'Active') + span({ fontSize: 12, color: S.fgGhost }, `(${count == null ? 1 : count})`),
      ) +
        div({ overflow: 'hidden', borderRadius: 8, border: `1px solid ${S.line}`, background: S.panel }, jobRow(job, progress)) +
        (history.length
          ? div(
              { display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0 12px' },
              span({ fontSize: 14, fontWeight: fontWeight.medium, color: S.fg }, 'Earlier today') + span({ fontSize: 12, color: S.fgGhost }, `(${history.length})`),
            ) +
            div(
              { overflow: 'hidden', borderRadius: 8, border: `1px solid ${S.line}`, background: S.panel },
              history.map((j, i) => div({ borderTop: i ? `1px solid ${S.line}` : undefined }, jobRow(j, 100, false))).join(''),
            )
          : ''),
    );
  }

  /** AppStage: the 820x620 surface with the window drawn at `state`. */
  function appStage(def, state, timeMs) {
    hoverAction = state.hover === 'action';
    const pane = def.renderPane(state, timeMs);
    hoverAction = false;
    return div(
      { position: 'relative', width: STAGE_W, height: STAGE_H, fontFamily: font.sans, userSelect: 'none' },
      div(
        {
          position: 'absolute',
          left: WINDOW.left,
          top: WINDOW.top,
          width: WINDOW.width,
          height: WINDOW.height,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 12,
          border: `1px solid ${S.line}`,
          background: S.windowBg,
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.65)',
          transformOrigin: '90% 100%',
          opacity: state.open,
          transform: `scale(${lerp(0.96, 1, state.open)}) translateY(${lerp(14, 0, state.open)}px)`,
        },
        titleBar(def) +
          div(
            { display: 'flex', minHeight: 0, flex: 1 },
            sidebar(def, state.nav, state.hover) +
              div({ display: 'flex', minWidth: 0, flex: 1, flexDirection: 'column' }, paneHeader(def.groups, state.nav) + div({ minHeight: 0, flex: 1, overflow: 'hidden' }, pane)),
          ),
      ),
    );
  }

  /* Desktop geometry and system tray */
  const TASKBAR_ASPECT = 1920 / 60;
  const TASKBAR_SCALE = 1.3;
  const CURSOR_SCALE = 1.5;
  const TRAY_CLIP_X = 1400;

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
      sparkCx: batteryCx - 3 * step,
      chevronCx: batteryCx - 4 * step,
      clockRightPad: rightPad,
      clockTimeSize: barH * 0.17,
      clockDateSize: barH * 0.15,
    };
  }

  function systemTray(brand, width, top, barH) {
    const L = trayLayout(width, barH);
    const cy = top + barH / 2;
    const glyph = 'rgba(255, 255, 255, 0.9)';
    const box = (cx, size) => ({ position: 'absolute', left: cx, top: cy, width: size, height: size, transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    const line = (name, cx) => div(box(cx, L.iconSize), icon(name, { size: L.iconSize, color: glyph, strokeWidth: 2 }));
    return (
      line('ChevronUp', L.chevronCx) +
      div(box(L.sparkCx, L.iconSize * 1.08), trayIcon(brand, L.iconSize * 1.08)) +
      line('Wifi', L.wifiCx) +
      line('Volume2', L.volumeCx) +
      line('BatteryMedium', L.batteryCx) +
      div(
        { position: 'absolute', right: L.clockRightPad, top: cy, transform: 'translateY(-50%)', textAlign: 'right', fontFamily: font.sans, color: glyph, lineHeight: 1.25 },
        div({ fontSize: L.clockTimeSize }, '11:00 AM') + div({ fontSize: L.clockDateSize }, '10/05/2021'),
      )
    );
  }

  function desktopGeometry(width, height, bottomInset = 0) {
    const taskbarW = width * TASKBAR_SCALE;
    const taskbarH = taskbarW / TASKBAR_ASPECT;
    const taskbarLeft = (width - taskbarW) / 2;
    const taskbarTop = height - taskbarH;
    const desktopH = taskbarTop - bottomInset;
    const stageNeeds = WINDOW.top * 2 + WINDOW.height;
    const scale = Math.min((width / STAGE_W) * 0.65, desktopH / stageNeeds);
    const stageW = STAGE_W * scale;
    const left = (width - stageW) / 2;
    const winTop = WINDOW.top * scale;
    const winH = WINDOW.height * scale;
    const top = (desktopH - winH) / 2 - winTop;
    const tray = trayLayout(width, taskbarH);
    return {
      left,
      top,
      scale,
      taskbarLeft,
      taskbarTop,
      taskbarW,
      taskbarH,
      sparkCenter: [tray.sparkCx, taskbarTop + taskbarH / 2],
      mapStage: (x, y) => [left + x * scale, top + y * scale],
    };
  }

  /** windows/Taskbar.tsx: acrylic backing + vector glyphs, baked tray clipped off. */
  function taskbar(width, prefix) {
    const height = width / TASKBAR_ASPECT;
    const clip = `inset(0 ${width - (TRAY_CLIP_X / 1920) * width}px 0 0)`;
    return div(
      { position: 'relative', width, height, lineHeight: 0 },
      div({ position: 'absolute', inset: 0, background: 'rgba(24, 24, 28, 0.86)' }) + div({ position: 'absolute', inset: 0, clipPath: clip }, namespaceIds(D.taskbarSvg, prefix)),
    );
  }

  /* ------------------------------------------------------------------ *
   * SparkTray app (brand/ui/app/sparktray.tsx)
   * ------------------------------------------------------------------ */
  const SPARK_GROUPS = [
    {
      label: 'Utilities',
      items: [
        { id: 'video', label: 'Video Downloader', icon: 'Download' },
        { id: 'audio', label: 'Audio Extractor', icon: 'Music' },
        { id: 'bulk', label: 'Bulk Downloader', icon: 'Files' },
        { id: 'bg', label: 'Background Remover', icon: 'ImageOff' },
        { id: 'transcribe', label: 'Transcriber', icon: 'Mic' },
      ],
    },
    {
      label: 'System',
      items: [
        { id: 'queue', label: 'Job Queue', icon: 'ListChecks' },
        { id: 'settings', label: 'Settings', icon: 'Settings' },
      ],
    },
  ];
  const BULK_TOTAL = 40;
  const SRT_DONE = { icon: 'Mic', name: 'podcast-ep-12.srt', sub: 'Completed', status: 'done', progress: 100 };
  const DROP_COPY = {
    bg: { title: 'Drop an image here', hint: 'PNG or JPG. The cutout never leaves your machine.', action: 'Remove background', icon: 'ImageOff' },
    transcribe: { title: 'Drop audio or video here', hint: 'or click to browse. Runs 100% on your machine.', action: 'Transcribe', icon: 'Mic' },
    bulk: { title: 'Drop a CSV or a list of links', hint: 'One link per line. Pasting works too.', action: 'Start batch', icon: 'Files' },
  };

  function grabOption(ic, title, sub, on) {
    return div(
      { borderRadius: 8, border: `1px solid ${on ? S.accentBorder : S.line}`, background: on ? S.accentTintSoft : S.control, padding: 12 },
      div({ display: 'flex', alignItems: 'center', gap: 8 }, icon(ic, { size: 14, color: on ? S.accent : S.fgDim }) + span({ fontSize: 14, color: S.fg }, esc(title))) +
        div({ paddingTop: 4, fontSize: 12, color: S.fgDim }, esc(sub)),
    );
  }

  function sparkVideoPane(state, timeMs) {
    const { url = '', probing, meta, grab, press } = state;
    const caretOn = Math.floor(timeMs / 500) % 2 === 0;
    const spin = (timeMs * 0.4) % 360;
    const audio = state.nav === 'audio';
    const NAME = 'SparkTray';
    let out = div(
      card,
      div({ fontSize: 14, fontWeight: fontWeight.medium, color: S.fg }, audio ? 'Video URL or file' : 'Video URL') +
        div({ paddingTop: 4, fontSize: 12, color: S.fgDim }, esc(audio ? `Paste a link or drop a video and ${NAME} reads the audio tracks.` : `Paste a link and ${NAME} reads the available formats.`)) +
        div(
          { display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12 },
          div(
            { display: 'flex', height: 36, flex: 1, alignItems: 'center', borderRadius: 6, border: `1px solid ${S.lineStrong}`, background: S.control, padding: '0 12px', fontSize: 12, color: S.fg, minWidth: 0 },
            span({ whiteSpace: 'nowrap', overflow: 'hidden' }, esc(url)) + span({ marginLeft: 1, display: 'inline-block', height: 14, width: 1, background: S.accentText, opacity: caretOn ? 1 : 0.2 }),
          ) +
            div({ display: 'flex', height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: `1px solid ${S.lineStrong}`, background: S.control }, icon('Clipboard', { size: 14, color: S.fgMute })) +
            div(
              { display: 'flex', height: 36, alignItems: 'center', gap: 6, borderRadius: 6, background: S.accent, padding: '0 12px', fontSize: 12, fontWeight: fontWeight.medium, color: S.white },
              (probing ? span({ display: 'inline-flex', transform: `rotate(${spin}deg)` }, icon('Loader2', { size: 14, color: S.white })) : icon('Download', { size: 14, color: S.white })) + (probing ? 'Probing…' : 'Fetch'),
            ),
        ),
    );
    if (meta) {
      out += div(
        card,
        div(
          { display: 'flex', gap: 12 },
          div({ display: 'flex', height: 56, width: 96, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: S.accentTint }, icon('Video', { size: 20, color: S.accent })) +
            div(
              {},
              div({ fontSize: 14, fontWeight: fontWeight.medium, color: S.fg }, 'Big Buck Bunny — Blender Open Movie') +
                div({ paddingTop: 2, fontSize: 12, color: S.fgDim }, 'Blender Foundation · 9:56') +
                div({ paddingTop: 6, fontSize: 12, color: S.fgDim }, esc(state.readout ?? (audio ? '3 audio tracks · 48 kHz stereo' : '24 formats · 3 subtitle tracks · chapters'))),
            ),
        ),
      );
      out += div(
        card,
        div({ fontSize: 14, fontWeight: fontWeight.medium, color: S.fg }, audio ? 'Audio format' : 'What to grab') +
          (audio
            ? chipRail(state, 'quality', ['MP3', 'M4A', 'WAV', 'FLAC', 'Opus'], ['MP3'], 12) +
              div({ paddingTop: 14, fontSize: 12, color: S.fgDim }, 'Bitrate') +
              chipRail(state, 'bitrate', ['128', '192', '256', '320 kbps'], ['320 kbps'])
            : div(
                { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 12 },
                grabOption('Video', 'Video', 'Muxed video + audio', grab === 'video') + grabOption('Music', 'Audio only', 'Extract to mp3 / m4a', grab === 'audio'),
              ) + chipRail(state, 'quality', ['Best', '1080p', '720p', '480p'], grab === 'video' ? ['Best'] : [], 12)) +
          div({ paddingTop: 16 }, actionButton(audio ? 'Extract audio' : 'Download', audio ? 'Music' : 'Download', press)),
      );
    }
    return div({ display: 'flex', flexDirection: 'column', gap: 12, padding: 24 }, out);
  }

  function sparkDropPane(state) {
    const copy = DROP_COPY[state.nav] || DROP_COPY.bg;
    const { file, press, readout } = state;
    return div(
      { display: 'flex', flexDirection: 'column', gap: 12, padding: 24 },
      (file && readout ? div({ fontSize: 12, color: S.fgDim }, esc(readout)) : '') +
        (file ? fileRow(file) : dropZone(copy.title, copy.hint)) +
        (file && state.rails && state.rails.mode
          ? div(card, div({ fontSize: 14, fontWeight: fontWeight.medium, color: S.fg }, 'Output') + chipRail(state, 'mode', ['Transparent', 'Solid color', 'New backdrop'], ['Transparent'], 12))
          : '') +
        (file ? actionButton(copy.action, copy.icon, press) : ''),
    );
  }

  function sparkBulkPane(state, timeMs) {
    const { lines = [], readout, press } = state;
    const caretOn = Math.floor(timeMs / 500) % 2 === 0;
    const shown = lines.slice(0, 3);
    const rest = BULK_TOTAL - shown.length;
    return div(
      { display: 'flex', flexDirection: 'column', gap: 12, padding: 24 },
      div({ fontSize: 12, color: S.fgDim }, esc(readout ?? 'Paste one link per line, or drop a CSV.')) +
        div(
          { borderRadius: 6, border: `1px solid ${S.lineStrong}`, background: S.control, padding: '10px 12px', fontFamily: font.mono, fontSize: 11, lineHeight: 1.75, color: S.fgMute, boxSizing: 'border-box', minHeight: 92 },
          shown.length === 0
            ? span({ color: S.fgGhost }, 'https://' + span({ marginLeft: 1, display: 'inline-block', height: 12, width: 1, background: S.accentText, opacity: caretOn ? 1 : 0.2, verticalAlign: 'text-bottom' }))
            : shown.map((l) => div({ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, esc(l))).join('') + (rest > 0 ? div({ color: S.fgGhost }, `+${rest} more`) : ''),
        ) +
        div(
          card,
          div({ fontSize: 14, fontWeight: fontWeight.medium, color: S.fg }, 'Quality') +
            chipRail(state, 'quality', ['Best', '1080p', '720p', 'Audio only'], ['Best'], 12) +
            div({ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, fontSize: 12, color: S.fgDim }, icon('Files', { size: 13, color: S.fgDim }) + 'Three at a time, and it retries anything that fails.'),
        ) +
        actionButton('Start batch', 'Files', press),
    );
  }

  function sparkTranscribePane(state) {
    const { file, press } = state;
    return div(
      { display: 'flex', flexDirection: 'column', gap: 12, padding: 24 },
      div({ fontSize: 12, color: S.fgDim }, esc(state.readout ?? '1 file ready')) +
        fileRow(file ?? '') +
        div(
          card,
          div({ fontSize: 14, fontWeight: fontWeight.medium, color: S.fg }, 'Model') +
            chipRail(state, 'model', ['Tiny', 'Base', 'Small', 'Medium'], ['Base']) +
            div({ paddingTop: 16, fontSize: 14, fontWeight: fontWeight.medium, color: S.fg }, 'Output formats') +
            chipRail(state, 'output', ['SRT', 'VTT', 'TXT', 'JSON'], ['SRT', 'VTT', 'TXT']) +
            div(
              { display: 'flex', alignItems: 'center', gap: 8, paddingTop: 16, fontSize: 12, color: S.fgDim },
              icon('Languages', { size: 14, color: S.fgDim }) + 'Language: ' + span({ color: S.fgMute }, 'Auto-detect'),
            ),
        ) +
        actionButton('Transcribe', 'Mic', press),
    );
  }

  const SPARKTRAY_DEMO = {
    brand: 'sparktray',
    name: 'SparkTray',
    groups: SPARK_GROUPS,
    version: 'v1.0.0 · win32',
    renderPane(state, timeMs) {
      if (state.scene === 'video') return sparkVideoPane(state, timeMs);
      if (state.scene === 'bulk') return sparkBulkPane(state, timeMs);
      if (state.scene === 'drop') return sparkDropPane(state);
      if (state.scene === 'transcribe') return sparkTranscribePane(state);
      return queuePane(state.job ?? SRT_DONE, state.jobProgress, undefined, state.history);
    },
  };

  /* SparkTray tutorial shots (sparktray-shots.ts) */
  const sAt = (id) => navRowCenter(SPARK_GROUPS, id);
  const URL_TYPED = 'https://youtube.com/watch?v=aqz-';
  const BULK_LINES = ['https://youtube.com/watch?v=aqz-KE-bpKQ', 'https://vimeo.com/1084537', 'https://youtube.com/watch?v=Xn5FEHRLPvc', 'https://youtube.com/watch?v=eRsGyueVLvQ'];
  const typesUrl = (p) => ({ scene: 'video', url: URL_TYPED.slice(0, Math.round(stagger(p, 0.05, 0.75) * URL_TYPED.length)) });

  const SPARK_SHOTS = {
    'video-downloader': {
      nav: 'video',
      empty: 'video',
      ready: 'video',
      readout: '24 formats · 3 subtitle tracks · chapters',
      payload: { url: URL_TYPED, grab: 'video', meta: true },
      input: typesUrl,
      read: (p) => ({ probing: p < 0.35, meta: p >= 0.35 }),
      optionKeys: [
        { at: 0, rails: { quality: { items: ['Best', '1080p', '720p', '480p'], on: ['Best'] } } },
        { at: 0.55, rails: { quality: { items: ['Best', '1080p', '720p', '480p'], on: ['1080p'] } } },
      ],
      job: { icon: 'Video', name: 'big-buck-bunny.mp4', running: 'Downloading… {p}%', done: 'Completed · Downloads', from: 12, to: 78 },
      at: { open: [520, 330], pick: sAt('video'), input: [437, 200], read: [685, 202], options: [388, 484], run: [513, 530], queue: sAt('queue'), done: sAt('queue') },
    },
    'audio-extractor': {
      nav: 'audio',
      empty: 'video',
      ready: 'video',
      readout: '3 audio tracks · 48 kHz stereo',
      payload: { url: URL_TYPED, grab: 'audio', meta: true },
      input: typesUrl,
      read: (p) => ({ probing: p < 0.35, meta: p >= 0.35 }),
      optionKeys: [
        { at: 0, rails: { quality: { items: ['MP3', 'M4A', 'WAV', 'FLAC', 'Opus'], on: ['M4A'] }, bitrate: { items: ['128', '192', '256', '320 kbps'], on: ['192'] } } },
        { at: 0.4, rails: { quality: { items: ['MP3', 'M4A', 'WAV', 'FLAC', 'Opus'], on: ['MP3'] }, bitrate: { items: ['128', '192', '256', '320 kbps'], on: ['192'] } } },
        { at: 0.72, rails: { quality: { items: ['MP3', 'M4A', 'WAV', 'FLAC', 'Opus'], on: ['MP3'] }, bitrate: { items: ['128', '192', '256', '320 kbps'], on: ['320 kbps'] } } },
      ],
      job: { icon: 'Music', name: 'big-buck-bunny.mp3', running: 'Extracting audio… {p}%', done: 'Completed · 320 kbps · Music', from: 20, to: 84 },
      at: { open: [520, 330], pick: sAt('audio'), input: [437, 200], read: [685, 202], options: [430, 460], run: [513, 505], queue: sAt('queue'), done: sAt('queue') },
    },
    'bulk-downloader': {
      nav: 'bulk',
      empty: 'bulk',
      ready: 'bulk',
      readout: `${BULK_TOTAL} links ready · 0 duplicates`,
      payload: { lines: BULK_LINES },
      input: (p) => {
        const n = Math.round(stagger(p, 0.1, 0.7) * BULK_LINES.length);
        const pasted = Math.round((n / BULK_LINES.length) * BULK_TOTAL);
        return { scene: 'bulk', lines: BULK_LINES.slice(0, n), readout: n ? `${pasted} links pasted` : undefined };
      },
      optionKeys: [
        { at: 0, rails: { quality: { items: ['Best', '1080p', '720p', 'Audio only'], on: ['Best'] } } },
        { at: 0.55, rails: { quality: { items: ['Best', '1080p', '720p', 'Audio only'], on: ['1080p'] } } },
      ],
      job: { icon: 'Files', name: `${BULK_TOTAL} links`, running: `Downloading {n} of ${BULK_TOTAL}`, done: `${BULK_TOTAL} of ${BULK_TOTAL} complete · Downloads`, from: 8, to: 72, countOf: BULK_TOTAL },
      at: { open: [520, 330], pick: sAt('bulk'), input: [430, 190], read: [430, 190], options: [400, 306], run: [513, 394], queue: sAt('queue'), done: sAt('queue') },
    },
    'background-remover': {
      nav: 'bg',
      empty: 'drop',
      ready: 'drop',
      readout: 'product-shot.png · 2400 × 1600 · 1.8 MB',
      payload: { file: 'product-shot.png' },
      optionKeys: [
        { at: 0, rails: { mode: { items: ['Transparent', 'Solid color', 'New backdrop'], on: ['Solid color'] } } },
        { at: 0.5, rails: { mode: { items: ['Transparent', 'Solid color', 'New backdrop'], on: ['Transparent'] } } },
      ],
      job: { icon: 'ImageOff', name: 'product-shot.png', running: 'Cutting out… {p}%', done: 'Completed · transparent PNG', from: 18, to: 74 },
      at: { open: [520, 330], pick: sAt('bg'), input: [430, 200], read: [430, 164], options: [400, 251], run: [513, 308], queue: sAt('queue'), done: sAt('queue') },
    },
    transcriber: {
      nav: 'transcribe',
      empty: 'drop',
      ready: 'transcribe',
      readout: '1 file ready · 48:12',
      payload: { file: 'podcast-ep-12.mp3' },
      optionKeys: [
        { at: 0, rails: { model: { items: ['Tiny', 'Base', 'Small', 'Medium'], on: ['Base'] }, output: { items: ['SRT', 'VTT', 'TXT', 'JSON'], on: ['SRT'] } } },
        { at: 0.42, rails: { model: { items: ['Tiny', 'Base', 'Small', 'Medium'], on: ['Small'] }, output: { items: ['SRT', 'VTT', 'TXT', 'JSON'], on: ['SRT'] } } },
        { at: 0.74, rails: { model: { items: ['Tiny', 'Base', 'Small', 'Medium'], on: ['Small'] }, output: { items: ['SRT', 'VTT', 'TXT', 'JSON'], on: ['SRT', 'TXT'] } } },
      ],
      job: { icon: 'Mic', name: 'podcast-ep-12.srt', running: 'Transcribing… {p}%', done: 'Completed · 612 lines · SRT + TXT', from: 14, to: 71 },
      at: { open: [520, 330], pick: sAt('transcribe'), input: [430, 200], read: [430, 164], options: [400, 310], run: [513, 401], queue: sAt('queue'), done: sAt('queue') },
    },
  };
  const SPARKTRAY_DIRECTOR = { groups: SPARK_GROUPS, home: { nav: 'video', scene: 'video' }, queueNav: 'queue', shots: SPARK_SHOTS };

  /* ------------------------------------------------------------------ *
   * BizTray app (brand/ui/app/biztray.tsx)
   * ------------------------------------------------------------------ */
  const BIZ_GROUPS = [
    {
      label: 'Utilities',
      items: [
        { id: 'office2pdf', label: 'Office to PDF', icon: 'FileText' },
        { id: 'sign', label: 'PDF Fill and Sign', icon: 'PenLine' },
        { id: 'pdfconv', label: 'PDF Converter', icon: 'FileOutput' },
        { id: 'img2pdf', label: 'Image to PDF', icon: 'FileImage' },
        { id: 'officeconv', label: 'Office Converter', icon: 'FileStack' },
        { id: 'organizer', label: 'PDF Organizer', icon: 'LayoutGrid' },
        { id: 'tools', label: 'PDF Tools', icon: 'Wrench' },
      ],
    },
    {
      label: 'System',
      items: [
        { id: 'watch', label: 'Watch Folders', icon: 'FolderSync' },
        { id: 'queue', label: 'Job Queue', icon: 'ListChecks' },
        { id: 'settings', label: 'Settings', icon: 'Settings' },
      ],
    },
  ];
  const SIGNED_DONE = { icon: 'PenLine', name: 'mutual-nda-2026-signed.pdf', sub: 'Completed', status: 'done', progress: 100 };
  const PAPER = { sheet: '#f4f4f5', rule: '#d4d4d8', ink: '#27272a', meta: '#71717a' };
  const bizPane = { display: 'flex', flexDirection: 'column', gap: 12, padding: 24 };
  const DOC_COPY = {
    office2pdf: {
      title: 'Drop documents here',
      hint: 'or click to browse — Word, PowerPoint, Excel, OpenDocument, RTF, TXT, HTML and EPUB',
      action: 'Convert to PDF',
      icon: 'FileText',
      rails: [
        { label: 'Output', id: 'output', items: ['One PDF each', 'Merge into one'], on: ['One PDF each'] },
        { label: 'Quality', id: 'quality', items: ['Print', 'Screen', 'Archive'], on: ['Print'] },
      ],
    },
    pdfconv: {
      title: 'Drop a PDF here',
      hint: 'Pull it apart into text, Markdown, HTML, PNG, JPG or PowerPoint slides.',
      action: 'Convert PDF',
      icon: 'FileOutput',
      rails: [
        { label: 'Convert to', id: 'format', items: ['PNG', 'JPG', 'Text', 'Markdown', 'PPTX'], on: ['PNG'] },
        { label: 'Resolution', id: 'dpi', items: ['150', '300', '600 dpi'], on: ['300'] },
      ],
    },
    img2pdf: {
      title: 'Drop images here',
      hint: 'PNG, JPG, HEIC, WebP, TIFF and BMP. One photo or a whole folder.',
      action: 'Build PDF',
      icon: 'FileImage',
      rails: [
        { label: 'Layout', id: 'layout', items: ['One per page', 'Merge all'], on: ['Merge all'] },
        { label: 'Page size', id: 'size', items: ['A4', 'Letter', 'Fit image'], on: ['Fit image'] },
      ],
    },
    officeconv: {
      title: 'Drop a document here',
      hint: 'DOCX, ODT, XLSX, PPTX, CSV, JSON and plain text, converted between each other.',
      action: 'Convert',
      icon: 'FileStack',
      rails: [{ label: 'Convert to', id: 'format', items: ['DOCX', 'ODT', 'XLSX', 'PPTX', 'CSV'], on: ['DOCX'] }],
    },
    tools: {
      title: 'Drop a PDF here',
      hint: 'Watermark, page numbers, flatten a filled form, clean metadata, add or remove a password.',
      action: 'Apply to PDF',
      icon: 'Wrench',
      rails: [{ label: 'Action', id: 'action', items: ['Watermark', 'Page numbers', 'Flatten', 'Metadata', 'Password'], on: ['Watermark'] }],
    },
  };

  function bizDocsPane(state) {
    const copy = DOC_COPY[state.nav] || DOC_COPY.office2pdf;
    const { files = [], press } = state;
    return div(
      bizPane,
      div({ fontSize: 12, color: S.fgDim }, esc(state.readout ?? `${files.length} files ready`)) +
        files.map(fileRow).join('') +
        div(
          card,
          copy.rails
            .map((rail, i) => div({}, div({ paddingTop: i === 0 ? 0 : 16, fontSize: 14, fontWeight: fontWeight.medium, color: S.fg }, esc(rail.label)) + chipRail(state, rail.id, rail.items, rail.on, 12)))
            .join(''),
        ) +
        actionButton(copy.action, copy.icon, press),
    );
  }

  const PAGES = Array.from({ length: 16 }, (_, i) => i + 1);
  function bizOrganizerPane(state) {
    const { selected = [], press } = state;
    return div(
      bizPane,
      fileRow('supply-agreement-v4.pdf') +
        div(
          card,
          div(
            { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
            span({ fontSize: 14, color: S.fg }, `${selected.length} selected`) + span({ fontSize: 12, color: S.fgDim }, `${PAGES.length} pages`),
          ) +
            div(
              { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8, paddingTop: 12 },
              PAGES.map((n) => {
                const on = selected.includes(n);
                return div(
                  {
                    display: 'flex',
                    height: 56,
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    borderRadius: 4,
                    border: `1px solid ${on ? S.accent : S.line}`,
                    background: on ? S.accentTintSoft : S.control,
                    paddingBottom: 4,
                    boxSizing: 'border-box',
                  },
                  span({ fontSize: 10, color: on ? S.accentText : S.fgGhost }, String(n)),
                );
              }).join(''),
            ) +
            div({ paddingTop: 12, fontSize: 12, color: S.fgGhost }, 'click to select · ctrl multi · shift range · drag to reorder'),
        ) +
        actionButton('Extract selected', 'FileOutput', press),
    );
  }

  const SIGNATURES = ['R. Turner', 'RT'];
  function bizSignPane(state) {
    const sig = state.sig ?? null;
    const { press } = state;
    return div(
      bizPane,
      div({ fontSize: 14, color: S.fg }, 'mutual-nda-2026.pdf') +
        div(
          { borderRadius: 8, border: `1px solid ${S.line}`, background: S.panel, padding: 12, fontSize: 12, lineHeight: 1.6, color: S.fgDim },
          'Adds your signature to the page. This is a visual signature, the same as printing, signing and scanning. It is not a certificate-based digital signature.',
        ) +
        div(
          card,
          div({ fontSize: 14, fontWeight: fontWeight.medium, color: S.fg }, 'Signatures') +
            div(
              { display: 'flex', gap: 12, paddingTop: 12 },
              SIGNATURES.map((s) =>
                div({ borderRadius: 6, border: `1px solid ${sig === s ? S.accent : S.line}`, padding: '8px 24px', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14, color: S.fg }, esc(s)),
              ).join(''),
            ),
        ) +
        div(
          { borderRadius: 8, background: PAPER.sheet, padding: 12 },
          div(
            { display: 'flex', flexDirection: 'column', gap: 6 },
            div({ height: 4, width: '100%', borderRadius: 2, background: PAPER.rule }) + div({ height: 4, width: '80%', borderRadius: 2, background: PAPER.rule }),
          ) +
            div(
              { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 16 },
              span(
                { borderRadius: 4, border: `1px solid ${S.accent}`, padding: '2px 8px', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14, color: PAPER.ink, opacity: sig ? 1 : 0 },
                esc(sig ?? SIGNATURES[0]),
              ) + span({ fontSize: 12, color: PAPER.meta }, '2026-08-06'),
            ),
        ) +
        actionButton('Apply — sign PDF', 'PenLine', press),
    );
  }

  const BIZTRAY_DEMO = {
    brand: 'biztray',
    name: 'BizTray',
    groups: BIZ_GROUPS,
    version: 'v0.1.2-beta.1 · win32',
    renderPane(state) {
      if (state.scene === 'drop') {
        const copy = DOC_COPY[state.nav] || DOC_COPY.office2pdf;
        return div({ padding: 24 }, dropZone(copy.title, copy.hint));
      }
      if (state.scene === 'office') return bizDocsPane(state);
      if (state.scene === 'organizer') return bizOrganizerPane(state);
      if (state.scene === 'sign') return bizSignPane(state);
      if (state.scene === 'queue') return queuePane(state.job ?? SIGNED_DONE, state.jobProgress, state.count, state.history);
      return div({}, '');
    },
  };

  /* BizTray tutorial shots (biztray-shots.ts) */
  const bAt = (id) => navRowCenter(BIZ_GROUPS, id);
  const DOCS_AT = { open: [520, 330], input: [430, 200], read: [430, 164], options: [420, 300], run: [513, 430] };
  function docsShot(o) {
    return {
      nav: o.nav,
      empty: 'drop',
      ready: 'office',
      readout: o.readout,
      payload: { files: o.files },
      optionKeys: o.optionKeys,
      job: o.job,
      at: { open: DOCS_AT.open, pick: bAt(o.nav), input: DOCS_AT.input, read: DOCS_AT.read, options: DOCS_AT.options, run: DOCS_AT.run, queue: bAt('queue'), done: bAt('queue') },
    };
  }
  const BIZ_SHOTS = {
    'office-to-pdf': docsShot({
      nav: 'office2pdf',
      files: ['q3-board-deck.pptx', 'vendor-terms.docx'],
      readout: '2 files ready · 48 pages total',
      optionKeys: [
        { at: 0, rails: { output: { items: ['One PDF each', 'Merge into one'], on: ['One PDF each'] }, quality: { items: ['Print', 'Screen', 'Archive'], on: ['Screen'] } } },
        { at: 0.55, rails: { output: { items: ['One PDF each', 'Merge into one'], on: ['One PDF each'] }, quality: { items: ['Print', 'Screen', 'Archive'], on: ['Print'] } } },
      ],
      job: { icon: 'FileText', name: 'Office documents', running: 'Converting {n} of 2', done: 'Completed · 2 PDFs', from: 12, to: 76, countOf: 2 },
    }),
    'pdf-converter': docsShot({
      nav: 'pdfconv',
      files: ['supply-agreement-v4.pdf'],
      readout: 'supply-agreement-v4.pdf · 16 pages · 2.4 MB',
      optionKeys: [
        { at: 0, rails: { format: { items: ['PNG', 'JPG', 'Text', 'Markdown', 'PPTX'], on: ['Text'] }, dpi: { items: ['150', '300', '600 dpi'], on: ['150'] } } },
        { at: 0.5, rails: { format: { items: ['PNG', 'JPG', 'Text', 'Markdown', 'PPTX'], on: ['PNG'] }, dpi: { items: ['150', '300', '600 dpi'], on: ['300'] } } },
      ],
      job: { icon: 'FileOutput', name: '16 images', running: 'Rendering page {n} of 16', done: 'Completed · 16 PNGs', from: 10, to: 74, countOf: 16 },
    }),
    'image-to-pdf': docsShot({
      nav: 'img2pdf',
      files: ['receipts-jan.heic', 'receipts-feb.heic', 'receipts-mar.heic'],
      readout: '3 images ready · 12.1 MB',
      optionKeys: [
        { at: 0, rails: { layout: { items: ['One per page', 'Merge all'], on: ['One per page'] }, size: { items: ['A4', 'Letter', 'Fit image'], on: ['A4'] } } },
        { at: 0.5, rails: { layout: { items: ['One per page', 'Merge all'], on: ['Merge all'] }, size: { items: ['A4', 'Letter', 'Fit image'], on: ['Fit image'] } } },
      ],
      job: { icon: 'FileImage', name: 'receipts-q1.pdf', running: 'Building… {p}%', done: 'Completed · 3 pages', from: 16, to: 80 },
    }),
    'office-converter': docsShot({
      nav: 'officeconv',
      files: ['headcount-2026.xlsx'],
      readout: 'headcount-2026.xlsx · 4 sheets',
      optionKeys: [
        { at: 0, rails: { format: { items: ['DOCX', 'ODT', 'XLSX', 'PPTX', 'CSV'], on: ['ODT'] } } },
        { at: 0.5, rails: { format: { items: ['DOCX', 'ODT', 'XLSX', 'PPTX', 'CSV'], on: ['CSV'] } } },
      ],
      job: { icon: 'FileStack', name: 'headcount-2026.csv', running: 'Converting… {p}%', done: 'Completed · 4 CSVs', from: 14, to: 78 },
    }),
    'pdf-tools': docsShot({
      nav: 'tools',
      files: ['mutual-nda-2026.pdf'],
      readout: 'mutual-nda-2026.pdf · 6 pages · no password',
      optionKeys: [
        { at: 0, rails: { action: { items: ['Watermark', 'Page numbers', 'Flatten', 'Metadata', 'Password'], on: ['Page numbers'] } } },
        { at: 0.5, rails: { action: { items: ['Watermark', 'Page numbers', 'Flatten', 'Metadata', 'Password'], on: ['Watermark'] } } },
      ],
      job: { icon: 'Wrench', name: 'mutual-nda-2026.pdf', running: 'Stamping… {p}%', done: 'Completed · watermarked', from: 18, to: 82 },
    }),
    'pdf-organizer': {
      nav: 'organizer',
      empty: 'drop',
      ready: 'organizer',
      readout: 'supply-agreement-v4.pdf · 16 pages',
      payload: { selected: [3, 4, 5, 6] },
      input: (p) => (p >= 0.62 ? { scene: 'organizer', selected: [] } : {}),
      read: () => ({ selected: [] }),
      options: (p) => ({ selected: p < 0.3 ? [] : p < 0.62 ? [3, 4] : [3, 4, 5, 6] }),
      optionKeys: [{ at: 0, rails: {} }],
      job: { icon: 'LayoutGrid', name: 'pages 3-6.pdf', running: 'Extracting… {p}%', done: 'Completed · 4 pages', from: 20, to: 79 },
      at: { open: DOCS_AT.open, pick: bAt('organizer'), input: [430, 200], read: [430, 164], options: [500, 268], run: [513, 430], queue: bAt('queue'), done: bAt('queue') },
    },
    'fill-and-sign': {
      nav: 'sign',
      empty: 'drop',
      ready: 'sign',
      readout: 'mutual-nda-2026.pdf · 6 pages · 1 signature field',
      payload: { sig: 'R. Turner' },
      input: (p) => (p >= 0.62 ? { scene: 'sign', sig: null } : {}),
      read: () => ({ sig: null }),
      options: (p) => ({ sig: p < 0.45 ? null : 'R. Turner' }),
      optionKeys: [{ at: 0, rails: {} }],
      job: { icon: 'PenLine', name: 'mutual-nda-2026-signed.pdf', running: 'Stamping… {p}%', done: 'Completed · flattened', from: 22, to: 81 },
      at: { open: DOCS_AT.open, pick: bAt('sign'), input: [430, 200], read: [430, 180], options: [455, 290], run: [513, 470], queue: bAt('queue'), done: bAt('queue') },
    },
  };
  const BIZTRAY_DIRECTOR = { groups: BIZ_GROUPS, home: { nav: 'office2pdf', scene: 'drop' }, queueNav: 'queue', shots: BIZ_SHOTS };

  const DEMOS = { sparktray: SPARKTRAY_DEMO, biztray: BIZTRAY_DEMO };
  const DIRECTORS = { sparktray: SPARKTRAY_DIRECTOR, biztray: BIZTRAY_DIRECTOR };
  const brandOfTool = (tool) => Object.keys(DIRECTORS).find((b) => tool in DIRECTORS[b].shots);

  /** AppWindow.tsx QUEUE_HISTORY: finished jobs listed under the active one. */
  const QUEUE_HISTORY = {
    sparktray: [
      { icon: 'Video', name: 'keynote-2024.mp4', sub: 'Completed · 1080p · Downloads', status: 'done', progress: 100 },
      { icon: 'Mic', name: 'podcast-ep-12.srt', sub: 'Completed · 612 lines', status: 'done', progress: 100 },
      { icon: 'ImageOff', name: 'product-shot.png', sub: 'Completed · transparent PNG', status: 'done', progress: 100 },
    ],
    biztray: [
      { icon: 'LayoutGrid', name: 'pages 3-6.pdf', sub: 'Completed · 4 pages', status: 'done', progress: 100 },
      { icon: 'PenLine', name: 'mutual-nda-2026-signed.pdf', sub: 'Completed · flattened', status: 'done', progress: 100 },
      { icon: 'FileText', name: 'vendor-terms.pdf', sub: 'Completed · print quality', status: 'done', progress: 100 },
    ],
  };

  /* ------------------------------------------------------------------ *
   * Director (brand/ui/app/director.ts)
   * ------------------------------------------------------------------ */
  const STEP_ORDER = ['open', 'pick', 'input', 'read', 'options', 'run', 'queue', 'done'];
  const STEP_MS = 2600;
  const REST = [520, 330];
  const TRAVEL_SECONDS = 0.42;
  const DWELL_SECONDS = 0.12;
  const ASSUMED_SECONDS = 6;

  function restAt(def, shot, step) {
    switch (step) {
      case 'open':
        return REST;
      case 'pick':
        return navRowCenter(def.groups, shot.nav);
      case 'queue':
      case 'done':
        return navRowCenter(def.groups, def.queueNav);
      default:
        return shot.at[step];
    }
  }

  function toolFrame(def, shot, step, t, seconds = ASSUMED_SECONDS) {
    const p = clamp(t);
    const timeMs = STEP_ORDER.indexOf(step) * STEP_MS + p * STEP_MS;
    const arrive = Math.min(0.9, TRAVEL_SECONDS / Math.max(0.001, seconds));
    const travelled = easeOut(stagger(p, 0, arrive));
    const acts = Math.min(0.95, arrive + DWELL_SECONDS / Math.max(0.001, seconds));
    const hovering = travelled >= 0.85;
    const i = STEP_ORDER.indexOf(step);
    const from = i > 0 ? restAt(def, shot, STEP_ORDER[i - 1]) : REST;
    const to = restAt(def, shot, step);
    const cursor = [from[0] + (to[0] - from[0]) * travelled, from[1] + (to[1] - from[1]) * travelled];
    const after = (span) => easeOut(stagger(p, acts, Math.min(1, acts + span)));
    const clicked = p >= acts;
    const railsAt = (q) => {
      const keys = shot.optionKeys.filter((k) => k.at <= q);
      return keys.length ? keys[keys.length - 1].rails : shot.optionKeys[0].rails;
    };
    const settled = {
      open: 1,
      taskbarLit: 1,
      cursor: [0, 0],
      nav: shot.nav,
      scene: shot.ready,
      ...shot.payload,
      readout: shot.readout,
      press: 0,
      job: undefined,
      jobProgress: 0,
      rails: railsAt(1),
    };
    const at = (state, c) => ({ state, cursor: c, timeMs });
    const cleared = Object.fromEntries(Object.keys(shot.payload).map((k) => [k, undefined]));
    const blank = () => ({ ...settled, scene: shot.empty, ...cleared, readout: undefined, rails: undefined });
    const queueJob = (pct, done) => ({
      icon: shot.job.icon,
      name: shot.job.name,
      status: done ? 'done' : 'running',
      progress: pct,
      sub: done
        ? shot.job.done
        : shot.job.running.replace('{p}', String(Math.round(pct))).replace('{n}', String(Math.round((pct / 100) * (shot.job.countOf ?? 100)))),
    });

    switch (step) {
      case 'open':
        return at({ ...blank(), open: easeOut(stagger(p, 0, 0.4)), nav: def.home.nav, scene: def.home.scene }, cursor);
      case 'pick':
        return at({ ...blank(), nav: clicked ? shot.nav : def.home.nav, scene: clicked ? shot.empty : def.home.scene, hover: hovering && !clicked ? `nav:${shot.nav}` : undefined }, cursor);
      case 'input': {
        if (shot.input) return at({ ...blank(), ...shot.input(p) }, cursor);
        const landed = after(0.25) >= 1;
        return at({ ...blank(), ...(landed ? shot.payload : {}) }, cursor);
      }
      case 'read':
        return at({ ...settled, ...(shot.read ? shot.read(p) : {}), rails: undefined }, cursor);
      case 'options':
        return at({ ...settled, ...(shot.options ? shot.options(p) : {}), rails: railsAt(p) }, cursor);
      case 'run':
        return at({ ...settled, press: after(0.18), hover: hovering ? 'action' : undefined }, cursor);
      case 'queue': {
        const pct = shot.job.from + (shot.job.to - shot.job.from) * easeOut(p);
        return at({ ...settled, nav: def.queueNav, scene: 'queue', jobProgress: pct, job: queueJob(pct, false) }, cursor);
      }
      case 'done': {
        const pct = shot.job.to + (100 - shot.job.to) * easeOut(stagger(p, 0, 0.25));
        const finished = pct >= 99.5;
        return at({ ...settled, nav: def.queueNav, scene: 'queue', jobProgress: pct, job: queueJob(pct, finished) }, cursor);
      }
    }
    throw new Error(`Unknown step ${step}`);
  }

  /** AppScene.tsx appFrame: resolve one tutorial beat for any tool. */
  function appFrame(tool, step, t, seconds) {
    const brand = brandOfTool(tool) || 'sparktray';
    const director = DIRECTORS[brand];
    const shot = director.shots[tool] || Object.values(director.shots)[0];
    return { brand, ...toolFrame(director, shot, step, t, seconds) };
  }

  /* ------------------------------------------------------------------ *
   * Backdrops (brand/ui/backdrop.tsx + backdrops/*)
   * ------------------------------------------------------------------ */
  const BG = {
    ground: color.surfaceBase,
    card: color.surfaceRaised,
    stroke: color.border,
    hairline: 'rgba(255,255,255,0.10)',
    text: color.foreground,
    dim: color.foregroundMuted,
    faint: 'rgba(237,237,242,0.38)',
    accent: color.accent,
    stop: color.danger,
    good: color.success,
  };
  const mono = { fontFamily: font.mono, letterSpacing: '0.06em' };
  const sans = { fontFamily: font.sans };

  function phase(step, steps, states, t) {
    const index =
      states <= 1 ? 0 : steps <= 1 ? states - 1 : states > steps ? states - steps + step : Math.floor((step / (steps - 1)) * (states - 1));
    const enter = ease(clamp01((t - (steps > 0 ? step / steps : 0)) / 0.08));
    return { index, enter };
  }
  const arrived = (index, enter, k) => (k < index ? 1 : k === index ? enter : 0);
  const breathe = (t, depth = 0.14) => 1 - depth + depth * Math.cos(t * Math.PI * 2.4);
  const place = (left, top, extra = {}) => ({ position: 'absolute', left: `${left * 100}%`, top: `${top * 100}%`, transform: 'translate(-50%, -50%)', ...extra });

  function tile({ ic, label, facts = [], lit, width }) {
    const name = iconFor(ic);
    return div(
      {
        width,
        boxSizing: 'border-box',
        padding: '34px 36px',
        borderRadius: radius.lg,
        background: BG.card,
        border: `1px solid ${lit > 0.5 ? accentAlpha(0.45 * lit) : BG.stroke}`,
        boxShadow: lit > 0.5 ? `0 0 ${40 * lit}px ${accentAlpha(0.22 * lit)}` : 'none',
        opacity: 0.34 + 0.66 * lit,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      },
      (name ? icon(name, { size: 50, color: lit > 0.5 ? BG.accent : BG.faint, strokeWidth: 1.6 }) : '') +
        div({ ...mono, fontSize: 35, fontWeight: fontWeight.semibold, color: BG.text, textTransform: 'uppercase' }, esc(label)) +
        facts.map((f) => div({ ...sans, fontSize: 28, lineHeight: 1.35, color: BG.dim, borderTop: `1px solid ${BG.hairline}`, paddingTop: 16 }, esc(f))).join(''),
    );
  }

  function drawTick(on, size = 26, stroke = BG.good) {
    const LEN = 34;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" style="display:block"><path d="M4 12.5 l5 5.5 l11 -12" stroke="${stroke}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="${LEN}" stroke-dashoffset="${LEN * (1 - clamp01(on))}"/></svg>`;
  }

  function bgContrast({ t, step, steps, items }) {
    const left = items[0] || [];
    const right = items[1] || [];
    const verdict = items[2];
    const { index, enter } = phase(step, steps, verdict && verdict[0] ? 4 : 3, t);
    const both = index >= 3 ? 0.7 : 0;
    const litL = Math.max(both, index === 1 ? arrived(index, enter, 1) : index >= 2 ? 0.45 : 0);
    const litR = Math.max(both, index === 2 ? arrived(index, enter, 2) : index >= 3 ? 0.45 : 0);
    const COL_W = 560;
    return (
      div(place(0.285, 0.47), tile({ ic: left[1], label: left[0] ?? '', facts: left.slice(2), lit: litL * breathe(t, 0.08), width: COL_W })) +
      div(place(0.715, 0.47), tile({ ic: right[1], label: right[0] ?? '', facts: right.slice(2), lit: litR * breathe(t, 0.08), width: COL_W })) +
      (verdict && verdict[0]
        ? div(
            place(0.5, 0.83, {
              opacity: arrived(index, enter, 3),
              ...mono,
              fontSize: 31,
              fontWeight: fontWeight.semibold,
              color: BG.text,
              background: accentAlpha(0.16),
              border: `1px solid ${accentAlpha(0.4)}`,
              borderRadius: radius.pill,
              padding: '16px 36px',
              whiteSpace: 'nowrap',
            }),
            esc(verdict[0]),
          )
        : '')
    );
  }

  function bgCaveat({ t, step, steps, items }) {
    const [claim, limit, consequence, workaround] = items;
    const name = iconFor(claim && claim[1]);
    const { index, enter } = phase(step, steps, workaround && workaround[0] ? 4 : 3, t);
    const fill = arrived(index, enter, 0);
    const stopIn = arrived(index, enter, 1);
    const BAR_W = 0.62;
    let out = div(
      place(0.5, 0.235, { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, opacity: fill }),
      (name ? icon(name, { size: 48, color: BG.accent, strokeWidth: 1.6, style: { flexShrink: 0 } }) : '') +
        span({ ...mono, fontSize: 39, fontWeight: fontWeight.semibold, color: BG.text, maxWidth: '82%', lineHeight: 1.3 }, esc((claim && claim[0]) ?? '')),
    );
    out += div(
      place(0.5, 0.45, { width: '70%', transform: 'translate(-50%, -50%)' }),
      div(
        { position: 'relative', height: 18 },
        div({ position: 'absolute', inset: 0, borderRadius: radius.pill, background: 'rgba(255,255,255,0.06)' }) +
          div({ position: 'absolute', top: 0, left: 0, height: 18, width: `${BAR_W * fill * 100}%`, borderRadius: radius.pill, background: BG.accent }) +
          div({ position: 'absolute', top: 0, left: `${BAR_W * 100}%`, right: 0, height: 18, borderRadius: radius.pill, border: `2px dashed ${BG.stroke}`, opacity: stopIn * 0.8 }) +
          div({ position: 'absolute', left: `${BAR_W * 100}%`, top: -22, width: 5, height: 62, background: BG.stop, opacity: stopIn * breathe(t, 0.22), boxShadow: `0 0 ${26 * stopIn}px ${BG.stop}` }),
      ),
    );
    if (limit && limit[0]) out += div(place(0.5, 0.6, { opacity: stopIn, ...sans, fontSize: 41, color: BG.stop, fontWeight: fontWeight.semibold, whiteSpace: 'nowrap' }), esc(limit[0]));
    if (consequence && consequence[0]) out += div(place(0.5, 0.705, { opacity: arrived(index, enter, 2), ...sans, fontSize: 31, color: BG.dim, whiteSpace: 'nowrap' }), esc(consequence[0]));
    if (workaround && workaround[0])
      out += div(
        place(0.5, 0.8, { width: '100%', display: 'flex', justifyContent: 'center', opacity: arrived(index, enter, 3) }),
        div(
          { ...mono, fontSize: 27, color: BG.good, border: '1px solid rgba(0,187,127,0.4)', background: 'rgba(0,187,127,0.10)', borderRadius: radius.pill, padding: '14px 32px', maxWidth: '70%', textAlign: 'center', lineHeight: 1.4 },
          esc(workaround[0]),
        ),
      );
    return out;
  }

  /* Packet along a polyline (diagram.tsx) */
  function pointAt(pts, t) {
    const segs = pts.slice(1).map(([x, y], i) => Math.hypot(x - pts[i][0], y - pts[i][1]));
    const total = segs.reduce((a, b) => a + b, 0);
    let d = t * total;
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i]) {
        const k = d / segs[i];
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
      }
      d -= segs[i];
    }
    return pts[pts.length - 1];
  }
  const packetFade = (t) => (t < 0.2 ? clamp01(t / 0.2) : t > 0.8 ? clamp01((1 - t) / 0.2) : 1);
  function packet(path, ph, r, fill, fade, opacity = 1) {
    const t = ((ph % 1) + 1) % 1;
    const [x, y] = pointAt(path, t);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${(fade ? packetFade(t) : 1) * opacity}"/>`;
  }

  function bgMechanismRail({ t, step, steps, items }) {
    const stations = items.slice(0, 4);
    const n = Math.max(stations.length, 2);
    const { index, enter } = phase(step, steps, stations.length || 1, t);
    const xs = stations.map((_, i) => 0.5 + (i - (n - 1) / 2) * (0.52 / Math.max(n - 1, 1)));
    const W = 1920;
    const H = 1080;
    const RAIL_Y = 0.63;
    const y = RAIL_Y * H;
    const path = xs.map((x) => [x * W, y]);
    const lap = t * 3;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" style="position:absolute;inset:0" fill="none">`;
    svg += `<line x1="${xs[0] * W}" y1="${y}" x2="${xs[n - 1] * W}" y2="${y}" stroke="${BG.stroke}" stroke-width="3"/>`;
    stations.forEach((_, i) => {
      svg += `<circle cx="${xs[i] * W}" cy="${y}" r="${i === index ? 13 : 9}" fill="${i <= index ? BG.accent : BG.faint}" opacity="${i === index ? breathe(t, 0.2) : 0.7}"/>`;
    });
    if (path.length > 1) svg += packet(path, lap, 7, BG.accent, true) + packet(path, lap + 0.45, 5.5, BG.accent, true, 0.6);
    svg += '</svg>';
    return (
      svg +
      stations
        .map((row, i) => {
          const name = iconFor(row[1]);
          return div(
            place(xs[i], RAIL_Y - 0.15, { opacity: arrived(index, enter, i), textAlign: 'center', width: 400 }),
            (name ? icon(name, { size: 58, color: i === index ? BG.accent : BG.faint, strokeWidth: 1.6, style: { margin: '0 auto 18px' } }) : '') +
              div({ ...mono, fontSize: 33, fontWeight: fontWeight.semibold, color: BG.text, textTransform: 'uppercase' }, esc(row[0])) +
              (row[2] ? div({ ...sans, fontSize: 27, color: BG.dim, marginTop: 12, lineHeight: 1.3 }, esc(row[2])) : ''),
          );
        })
        .join('')
    );
  }

  function bgMechanismStore({ t, step, steps, items }) {
    const sides = items.slice(1, 3);
    const { index, enter } = phase(step, steps, Math.max(sides.length, 1), t);
    const COLS = 8;
    const ROWS = 5;
    return sides
      .map((row, side) => {
        const lit = arrived(index, enter, side);
        const sweep = (t * 2) % 1;
        const cells = Array.from({ length: COLS * ROWS }, (_, k) => {
          const r = Math.floor(k / COLS);
          const c = k % COLS;
          const order = side === 0 ? (r * COLS + c) / (COLS * ROWS) : (c * ROWS + r) / (COLS * ROWS);
          const on = order <= sweep ? 1 : 0.16;
          return div({ width: 34, height: 34, borderRadius: 5, background: on > 0.5 ? accentAlpha(0.85) : 'rgba(255,255,255,0.07)' });
        }).join('');
        return div(
          place(side === 0 ? 0.29 : 0.71, 0.47, { opacity: 0.35 + 0.65 * lit, textAlign: 'center' }),
          div({ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 34px)`, gap: 7, marginBottom: 28 }, cells) +
            div({ ...mono, fontSize: 33, fontWeight: fontWeight.semibold, color: BG.text, textTransform: 'uppercase' }, esc(row[0])),
        );
      })
      .join('');
  }

  function bgMechanism(props) {
    const first = props.items[0] || [];
    const store = (first[0] || '').toLowerCase() === 'mode: store' || first.join(':').toLowerCase().startsWith('mode:store');
    return store ? bgMechanismStore(props) : bgMechanismRail(props);
  }

  function bgSteps({ t, step, steps, items }) {
    const rows = items.slice(0, 4);
    const n = Math.max(rows.length, 1);
    const { index, enter } = phase(step, steps, n, t);
    return rows
      .map((row, i) => {
        const name = iconFor(row[1]);
        const landed = arrived(index, enter, i);
        const current = i === index;
        const done = i < index;
        const x = 0.5 + (i - (n - 1) / 2) * (0.78 / n);
        return div(
          place(x, 0.5, {
            width: `${(0.78 / n) * 100 - 2}%`,
            boxSizing: 'border-box',
            padding: '36px 30px',
            borderRadius: radius.lg,
            background: BG.card,
            border: `1px solid ${current ? accentAlpha(0.5) : BG.stroke}`,
            boxShadow: current ? `0 0 ${44 * breathe(t, 0.3)}px ${accentAlpha(0.2)}` : 'none',
            opacity: 0.3 + 0.7 * landed,
            textAlign: 'center',
          }),
          div({ ...mono, fontSize: 27, color: current ? BG.accent : BG.faint, marginBottom: 18 }, String(i + 1).padStart(2, '0')) +
            (name ? icon(name, { size: 54, color: current ? BG.accent : BG.faint, strokeWidth: 1.6, style: { margin: '0 auto 20px' } }) : '') +
            div({ ...mono, fontSize: 31, fontWeight: fontWeight.semibold, color: BG.text, textTransform: 'uppercase', lineHeight: 1.25 }, esc(row[0])) +
            (row[2] ? div({ ...sans, fontSize: 26, color: BG.dim, marginTop: 14, lineHeight: 1.3 }, esc(row[2])) : '') +
            div({ display: 'flex', justifyContent: 'center', marginTop: 20, height: 34 }, drawTick(done ? 1 : current ? landed : 0)),
        );
      })
      .join('');
  }

  function bgScene({ t, step, steps, items }) {
    const [subject, ...rejected] = items;
    const { index, enter } = phase(step, steps, 1 + Math.min(rejected.length, 3), t);
    const name = iconFor(subject && subject[1]) || iconFor('file-question');
    const drift = Math.cos(t * Math.PI * 2) * 3;
    const CARD_W = 400;
    const CARD_PAD = 38;
    const BREATHING = 26;
    const text = (subject && subject[0]) ?? '';
    const size = Math.min(44, Math.floor((CARD_W - CARD_PAD * 2 - BREATHING) / (Math.max(1, text.length) * 0.66)));
    return (
      div(
        place(0.29, 0.5, {
          transform: `translate(-50%, -50%) rotate(-3deg) translateY(${drift}px)`,
          width: CARD_W,
          padding: `48px ${CARD_PAD}px`,
          borderRadius: radius.lg,
          background: BG.card,
          border: `1px solid ${accentAlpha(0.4)}`,
          boxShadow: `0 0 60px ${accentAlpha(0.18)}`,
          textAlign: 'center',
        }),
        (name ? icon(name, { size: 82, color: BG.accent, strokeWidth: 1.4, style: { margin: '0 auto 28px' } }) : '') +
          div({ ...mono, fontSize: size, fontWeight: fontWeight.semibold, color: BG.text }, esc(text)),
      ) +
      div(
        place(0.71, 0.5, { width: 640, display: 'flex', flexDirection: 'column', gap: 28 }),
        rejected
          .slice(0, 3)
          .map((row, i) => {
            const struck = arrived(index, enter, i + 1);
            return div(
              { position: 'relative', width: 'fit-content', maxWidth: '100%', opacity: 0.35 + 0.5 * Math.max(struck, 0.4) },
              div({ ...sans, fontSize: 35, color: BG.dim, lineHeight: 1.35 }, esc(row[0])) + div({ position: 'absolute', left: 0, top: '52%', height: 3, width: `${struck * 100}%`, background: BG.stop }),
            );
          })
          .join(''),
      )
    );
  }

  const BACKDROPS = { contrast: bgContrast, caveat: bgCaveat, mechanism: bgMechanism, steps: bgSteps, scene: bgScene };

  /* ------------------------------------------------------------------ *
   * Endcard (Scene.tsx Endcard + AppWindow.tsx), landscape budgets
   * ------------------------------------------------------------------ */
  function windowsGlyph(size, fill) {
    const pane = (size - 3) / 2;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" style="display:block;flex-shrink:0"><rect x="0" y="0" width="${pane}" height="${pane}" rx="1" fill="${fill}"/><rect x="${pane + 3}" y="0" width="${pane}" height="${pane}" rx="1" fill="${fill}"/><rect x="0" y="${pane + 3}" width="${pane}" height="${pane}" rx="1" fill="${fill}"/><rect x="${pane + 3}" y="${pane + 3}" width="${pane}" height="${pane}" rx="1" fill="${fill}"/></svg>`;
  }

  function claimStrip(claims, size) {
    return div(
      { display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: `${Math.round(size * 0.5)}px ${Math.round(size * 1.1)}px`, fontFamily: font.sans, fontSize: size, fontWeight: fontWeight.semibold, color: color.foregroundMuted, letterSpacing: '-0.01em' },
      claims
        .map((c, i) =>
          div(
            { display: 'flex', alignItems: 'center', gap: Math.round(size * 1.1) },
            (i > 0 ? span({ width: Math.round(size * 0.22), height: Math.round(size * 0.22), borderRadius: '50%', background: color.accent, opacity: 0.85, display: 'block' }) : '') + span({}, esc(c)),
          ),
        )
        .join(''),
    );
  }

  /** AppWindow: the app cropped to its window, fitted into a box with `zoom`. */
  function appWindow(tool, step, width, height, history) {
    const { brand, state, timeMs } = appFrame(tool, step, 1);
    const zoom = Math.min(width / WINDOW.width, height / WINDOW.height);
    return div(
      { position: 'relative', width: WINDOW.width, height: WINDOW.height, zoom },
      div({ position: 'absolute', left: -WINDOW.left, top: -WINDOW.top }, appStage(DEMOS[brand], history ? { ...state, history } : state, timeMs)),
    );
  }

  /** The endcard's content at natural size; `e` (entrance) is applied per frame. */
  function endcard(brand, prefix) {
    const P = BRANDS[brand].product;
    const maxWidth = 1651;
    const maxHeight = 994;
    const appW = Math.min(760, Math.round(maxWidth * 0.5));
    const appH = Math.min(600, maxHeight - 120);
    const base = P.tagline.length <= 26 ? 76 : P.tagline.length <= 40 ? 66 : 52;
    return (
      div(
        { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 64, maxWidth },
        appWindow(BRANDS[brand].firstTool, 'queue', appW, appH, QUEUE_HISTORY[brand]) +
          div(
            { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: 30, maxWidth: Math.round(maxWidth * 0.4), minWidth: 0 },
            div({ fontSize: base, fontWeight: fontWeight.extrabold, letterSpacing: '-0.04em', lineHeight: 0.96, textWrap: 'balance', color: color.foreground }, esc(P.tagline)) +
              wordmark(brand, 54, prefix) +
              div(
                { display: 'flex', alignItems: 'center', gap: 16, fontFamily: font.sans, fontSize: 30, fontWeight: fontWeight.semibold, color: color.white, background: color.accent, padding: '22px 40px', borderRadius: radius.pill, whiteSpace: 'nowrap' },
                windowsGlyph(30, color.white) + esc(P.cta),
              ),
          ),
      ) + claimStrip(P.claims, 28)
    );
  }

  /* ------------------------------------------------------------------ *
   * Mount: one shot (scene run) as a seekable sub-composition
   * ------------------------------------------------------------------ */
  let styleInjected = false;
  function injectStyle() {
    if (styleInjected) return;
    styleInjected = true;
    const s = document.createElement('style');
    // frame-kit.css's border-box reset is kept: measured against the Remotion
    // renders in sparktray-campaign/out, border-box matches the window to the
    // pixel (content-box made it 2px wider and dropped SSIM from 0.99 to 0.93).
    s.textContent = '.tk-scene { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: hidden; }';
    document.head.appendChild(s);
  }

  function setStyle(node, style) {
    node.setAttribute('style', css(style));
  }

  function mountApp(scene, cfg, compId) {
    const W = 1920;
    const H = 1080;
    const brand = brandOfTool(cfg.tool) || cfg.brand;
    const def = DEMOS[brand];
    const geo = desktopGeometry(W, H, 0);
    scene.innerHTML = div(
      { position: 'relative', width: W, height: H, overflow: 'hidden', background: color.surfaceBase },
      div({ position: 'absolute', inset: 0, backgroundImage: `url(${D.wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }) +
        h('div', { position: 'absolute', left: geo.left, top: geo.top, width: STAGE_W, height: STAGE_H, transform: `scale(${geo.scale})`, transformOrigin: 'top left' }, '', 'class="tk-stage"') +
        h('div', { position: 'absolute', left: geo.taskbarLeft, top: geo.taskbarTop }, taskbar(geo.taskbarW, `${compId}-tb-`), 'data-layout-allow-overflow') +
        systemTray(brand, W, geo.taskbarTop, geo.taskbarH) +
        h('div', { position: 'absolute', left: 0, top: 0, zIndex: 40, pointerEvents: 'none', transform: `scale(${CURSOR_SCALE})`, transformOrigin: 'top left', width: 20, height: 24 }, cursorSvg(), 'class="tk-cursor"'),
    );
    const stage = scene.querySelector('.tk-stage');
    const cursor = scene.querySelector('.tk-cursor');
    let last = '';
    const seconds = cfg.frames / cfg.fps;
    return (f, t) => {
      const shot = appFrame(cfg.tool, cfg.step, t, seconds);
      const html = appStage(def, shot.state, shot.timeMs);
      if (html !== last) {
        stage.innerHTML = html;
        last = html;
      }
      const [x, y] = geo.mapStage(shot.cursor[0], shot.cursor[1]);
      cursor.style.left = `${x - 3}px`;
      cursor.style.top = `${y - 1.5}px`;
    };
  }

  function mountBackdrop(scene, cfg) {
    const draw = BACKDROPS[cfg.kind];
    scene.innerHTML = div(
      { position: 'relative', width: 1920, height: 1080 },
      div({ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 55% at 50% 34%, ${accentAlpha(0.16)} 0%, rgba(10,10,15,0) 68%), ${BG.ground}`, overflow: 'hidden' }) +
        h('div', { position: 'absolute', inset: 0 }, '', 'class="tk-layer"') +
        div({ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(10,10,15,0) 84%, rgba(10,10,15,0.55) 100%)' }),
    );
    const layer = scene.querySelector('.tk-layer');
    let last = '';
    return (f, t) => {
      const beat = beatAt(cfg.beats, f);
      const html = draw({ t, step: beat.step, steps: beat.steps, items: cfg.items });
      if (html !== last) {
        layer.innerHTML = html;
        last = html;
      }
    };
  }

  function mountLogo(scene, cfg, compId) {
    const brand = cfg.brand;
    // ScriptFrame's card branch: the plate, then the card centred with 7% side padding.
    scene.innerHTML = div(
      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 54, padding: '0 7%', boxSizing: 'border-box' },
      div({ position: 'absolute', inset: 0, background: plate() }) +
        div(
          { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
          h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 52, maxWidth: 1651, fontFamily: font.sans }, endcard(brand, `${compId}-wm`), 'class="tk-endcard"'),
        ),
    );
    const card = scene.querySelector('.tk-endcard');
    return (f, t) => {
      const e = easeOut(stagger(t, 0, 0.5));
      card.style.opacity = String(e);
      card.style.transform = `scale(${0.94 + e * 0.06})`;
    };
  }

  function beatAt(beats, f) {
    let b = beats[0];
    for (const x of beats) if (x.at <= f) b = x;
    return b;
  }

  /**
   * Mount one shot.
   *   cfg.scene   'bg-<kind>' | 'app-<step>' | 'logo'
   *   cfg.brand   'sparktray' | 'biztray'
   *   cfg.tool    tool id, for app-* shots
   *   cfg.frames  length of the run in frames; cfg.fps (default 60)
   *   cfg.beats   [{ at, step, steps }] frame offsets of each beat in the run
   *   cfg.items   backdrop payload rows
   * `t` is progress through the whole run (ScriptVideo: elapsed / (total - 1)).
   */
  function mount(compId, cfg) {
    injectStyle();
    cfg = { fps: 60, beats: [{ at: 0, step: 0, steps: 1 }], ...cfg };
    const host = document.querySelector(`[data-composition-id="${compId}"]`);
    const root = (host && host.querySelector(`[data-composition-id="${compId}"]`)) || host;
    const scene = root.querySelector('.tk-scene');
    for (const [k, v] of Object.entries(brandVars(cfg.brand))) scene.style.setProperty(k, v);

    let render;
    if (cfg.scene.startsWith('app-')) render = mountApp(scene, { ...cfg, step: cfg.scene.slice(4) }, compId);
    else if (cfg.scene.startsWith('bg-')) render = mountBackdrop(scene, { ...cfg, kind: cfg.scene.slice(3) });
    else if (cfg.scene === 'logo') render = mountLogo(scene, cfg, compId);
    else throw new Error(`TrayKit: unknown scene ${cfg.scene}`);

    const total = cfg.frames;
    const tl = gsap.timeline({ paused: true });
    FrameKit.drive(tl, cfg.fps, total, (frame) => {
      const f = Math.min(Math.max(frame, 0), total - 1);
      render(f, total > 1 ? f / (total - 1) : 1);
    });
    window.__timelines[compId] = tl;
  }

  window.TrayKit = { mount, appFrame, toolFrame, appStage, desktopGeometry, navRowCenter, iconFor, icon, BRANDS, DEMOS, DIRECTORS };
})();
