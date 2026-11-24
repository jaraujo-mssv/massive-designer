/*
 * OneLaunchStory — the screen recording as one continuous function of time, for onelaunch-file-scanning.
 *
 * Every scene composition mounts the same desktop (js/pc-desktop.js) and the same OneLaunch layer (js/onelaunch-ui.js)
 * and draws it at absolute time T = scene start + local time, so the cuts between scenes are invisible and any frame
 * can be seeked on its own. Every action lands on a word of the narration (OL_CAPTIONS, from timing.build.mjs): after
 * a new take, the clicks move with the words and nothing here changes.
 *
 *   OneLaunchStory.scene(id)     a desktop scene (frames 1–6)
 *   OneLaunchStory.captions(id)  the subtitle track (sparktray-campaign Caption.tsx: one page per line, words light up)
 *   OneLaunchStory.end(id)       the end card
 */
(function () {
  const K = window.ConsentKit;
  const CAP = window.OL_CAPTIONS;
  const PACE = { travel: K.TRAVEL_SECONDS, press: K.PRESS_SECONDS }; // the story clock is in seconds
  const ACCENT = '#ff8163'; // the word being said: Massive's highlight red
  const FRAME_S = 1 / K.FPS;
  /** A composition's slice of the film, from OL_CAPTIONS (timing.build.mjs). */
  function slice(compId) {
    if (compId === 'ol-captions') return { start: 0, duration: CAP.total };
    const f = CAP.frames.find((x) => x.id === compId);
    if (!f) throw new Error(`OneLaunchStory: no frame "${compId}" in OL_CAPTIONS: run node timing.build.mjs`);
    return f;
  }

  // ── Marks: each action on its word, found in the scene it's said in (so adding or removing a line never moves one) ──
  const clean = (w) => w.toLowerCase().replace(/[^a-z']/g, '');
  function word(frame, text) {
    for (const L of CAP.lines.filter((l) => l.frame === frame)) {
      const w = L.words.find((x) => clean(x.text) === text.toLowerCase());
      if (w) return L.from + w.start;
    }
    throw new Error(`OneLaunchStory: no "${text}" in Frame ${frame}'s narration (OL_CAPTIONS)`);
  }
  const frameStart = (n) => CAP.frames.find((f) => f.n === n).start;
  const E = {
    launch: word(1, 'OneLaunch'), // click OneLaunch in the taskbar: the dock drops in
    plus: word(2, 'Apps'), // click + in the dock: the Apps Library opens
    get: word(2, 'Get'), // click Get: the consent dialog pops up
    accept: word(4, 'Accept'), // click Accept: scanning turns on
    more: word(5, 'Changing'), // click ⋮ in the dock
    settings: word(5, 'Settings'), // click Settings in the menu
    nav: word(6, 'Turn'), // click "File Scanning"
    toggle: word(6, 'Massive'), // flip the switch off
  };

  const { at, ease, pulse, clamp01 } = K;
  /** Eased 0..1 over [a, a + d] seconds. */
  const win = (T, a, d) => ease(at(T, a, a + d));
  /** Within the last moment of travel onto a control, and just after its click. */
  const hovering = (T, click) => T >= click - 0.12 && T < click + 0.3;
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, p) => `rgb(${hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * p)).join(',')})`;

  function panel(el, open, close) {
    el.style.opacity = open * (1 - close);
    el.style.transform = `translateY(${-10 * (1 - open)}px) scale(${0.97 + 0.03 * open})`;
  }
  function toast(el, inn, out) {
    el.style.opacity = inn * (1 - out);
    el.style.transform = `translateX(${(1 - inn) * 24}px)`;
  }

  /** Every OneLaunch part at absolute time T. */
  function apply(T, r) {
    // The dock drops in after the launch click; its logo shows OneLaunch is the active app.
    const dock = win(T, E.launch + 0.05, 0.45);
    r.dock.style.opacity = dock;
    r.dock.style.transform = `translateY(${-(1 - dock) * 48}px)`;
    r.active.style.opacity = dock;

    // Apps Library: opens on +, closes when Settings opens.
    const libOpen = win(T, E.plus + 0.05, 0.45);
    const libClose = win(T, E.settings + 0.05, 0.25);
    panel(r.lib, libOpen, libClose);
    r.plusOn.style.opacity = libOpen * (1 - libClose);

    // Get: hover, press; after Accept it reads On.
    r.getLabel.style.background = hovering(T, E.get) ? '#0f74db' : '#1f8fff';
    r.get.style.transform = `scale(${1 - 0.04 * pulse(T, E.get, PACE.press)})`;
    const on = win(T, E.accept + 0.45, 0.3);
    r.getLabel.style.opacity = 1 - on;
    r.getOn.style.opacity = on;

    // The update dialog with Massive's consent: opens after Get, closes after Accept.
    const dOpen = win(T, E.get + 0.05, 0.45);
    const dClose = win(T, E.accept + 0.08, 0.22);
    r.dlg.style.opacity = dOpen * (1 - dClose);
    r.dlg.style.transform = `scale(${0.94 * (0.93 + 0.07 * dOpen) * (1 - 0.03 * dClose)})`;
    const acceptHover = hovering(T, E.accept);
    r.accept.style.background = acceptHover ? '#0f74db' : '#1f8fff';
    r.accept.style.borderColor = acceptHover ? '#0f74db' : '#1f8fff';
    r.accept.style.transform = `scale(${1 - 0.04 * pulse(T, E.accept, PACE.press)})`;

    // The shield in the dock while scanning is on.
    const shieldOn = win(T, E.accept + 0.45, 0.35);
    const shieldOff = win(T, E.toggle + 0.25, 0.35);
    r.shield.style.opacity = shieldOn * (1 - shieldOff);
    r.shield.style.transform = `scale(${0.6 + 0.4 * shieldOn - 0.3 * shieldOff})`;

    // "File Reputation Scanning is on": in after Accept, gone as the Settings scene starts.
    toast(r.toastOn, win(T, E.accept + 0.3, 0.35), win(T, TOAST.on[1] - 0.25, 0.25));

    // The ⋮ menu.
    const menuOpen = win(T, E.more + 0.03, 0.18);
    const menuClose = win(T, E.settings + 0.05, 0.15);
    r.menu.style.opacity = menuOpen * (1 - menuClose);
    r.menu.style.transform = `scale(${0.96 + 0.04 * menuOpen})`;
    r.miSettings.style.background = hovering(T, E.settings) ? '#eaf1fb' : 'transparent';

    // Settings: opens on General, then the "File Scanning" page.
    panel(r.set, win(T, E.settings + 0.05, 0.45), 0);
    const page = win(T, E.nav + 0.03, 0.18);
    r.general.style.opacity = 1 - page;
    r.am.style.opacity = page;
    r.navGeneral.classList.toggle('is-on', page < 0.5);
    r.navAm.classList.toggle('is-on', page >= 0.5);
    r.navAm.style.background = page < 0.5 && hovering(T, E.nav) ? '#f3f3f3' : '';

    // The switch flips off on its word; Massive stops and scanning goes with it.
    const off = win(T, E.toggle, 0.22);
    r.knob.style.transform = `translateX(${-22 * off}px)`;
    r.knob.style.background = mix('#ffffff', '#333333', off);
    r.track.style.background = mix('#0a64d8', '#ffffff', off);
    r.track.style.borderColor = mix('#0a64d8', '#767676', off);
    const flipped = off >= 0.5 ? 1 : 0;
    r.tgOn.style.opacity = 1 - flipped;
    r.tgOff.style.opacity = flipped;
    r.stOn.style.opacity = 1 - flipped;
    r.stOff.style.opacity = flipped;
    toast(r.toastOff, win(T, E.toggle + 0.3, 0.35), 0);
  }

  // When each toast is on screen (bottom right, above the taskbar). The "on" toast leaves as the Settings scene starts.
  const TOAST = { on: [E.accept + 0.3, frameStart(5)], off: [E.toggle + 0.3, frameStart(7)] };

  /** Cursor stops in frame pixels; idle stops too close to an action are dropped (the arrow needs 0.55 s to travel). */
  function stopsFor(P, pinned) {
    const raw = [
      { t: 0, at: [1240, 640] },
      { t: E.launch, at: pinned, click: true },
      { t: E.launch + 1.0, at: [760, 300] },
      { t: E.plus, at: P.plus, click: true },
      { t: E.plus + 1.0, at: [P.get[0] - 170, P.get[1] + 96] },
      { t: E.get, at: P.get, click: true },
      { t: E.get + 1.0, at: [1590, 640] },
      { t: E.accept, at: P.accept, click: true },
      { t: E.accept + 1.0, at: [1560, 430] },
      { t: E.more, at: P.more, click: true },
      { t: E.settings, at: P.settings, click: true },
      { t: E.nav, at: P.nav, click: true },
      { t: E.toggle, at: P.toggle, click: true },
      { t: E.toggle + 1.0, at: [P.toggle[0] + 110, P.toggle[1] + 120] },
    ].sort((a, b) => a.t - b.t);
    return raw.filter((s, i) => s.click || s.t === 0 || !raw[i + 1] || raw[i + 1].t - s.t >= 0.75);
  }

  function scene(compId) {
    K.mount(compId, (h) => {
      const desk = h.$('.pc-desktop');
      const d = window.PcDesktop.build(desk, compId);
      const layer = document.createElement('div');
      layer.setAttribute('style', 'position:absolute;left:0;top:0;width:1920px;height:1080px;');
      layer.innerHTML = window.OneLaunchUI.spaceHTML();
      desk.insertBefore(layer, desk.querySelector('.pc-wallpaper').nextSibling); // under the taskbar, ring and cursor

      // Windows stack on a desktop on purpose: the dialog, menu, toasts and Settings cover the Apps Library, and the
      // Settings pages cross-fade. Mark that layering for the layout audit (the covered text, and the covering windows).
      const hasText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      layer.querySelectorAll('.ol-lib *, .ol-set-general *').forEach((el) => {
        if (!hasText(el)) return;
        el.setAttribute('data-layout-allow-overlap', '');
        el.setAttribute('data-layout-allow-occlusion', '');
      });
      layer.querySelectorAll('.ol-dlg, .ol-menu, .ol-toast, .ol-set').forEach((el) => el.setAttribute('data-layout-allow-occlusion', ''));
      // The centred subtitles may pass over a notification's text (the user's call): mark that side of the overlap too.
      layer.querySelectorAll('.ol-toast *').forEach((el) => hasText(el) && el.setAttribute('data-layout-allow-overlap', ''));

      const q = (s) => layer.querySelector(s);
      const r = {
        dock: q('.ol-dock'), active: q('.ol-dk-active'), plusOn: q('.ol-dk-plus-on'), shield: q('.ol-dk-shield'),
        lib: q('.ol-lib'), get: q('.ol-get'), getLabel: q('.ol-get-label'), getOn: q('.ol-get-on'),
        dlg: q('.ol-dlg'), accept: q('.ol-accept'), toastOn: q('.ol-toast-on'), toastOff: q('.ol-toast-off'),
        menu: q('.ol-menu'), miSettings: q('.ol-mi-settings'),
        set: q('.ol-set'), general: q('.ol-set-general'), am: q('.ol-set-am'), navGeneral: q('.ol-nav-general'), navAm: q('.ol-nav-am'),
        knob: q('.ol-tg-knob'), track: q('.ol-tg'), tgOn: q('.ol-tg-on'), tgOff: q('.ol-tg-off'),
        stOn: q('.ol-am-status-on'), stOff: q('.ol-am-status-off'),
      };

      // Where the arrow lands, measured from the laid-out UI (before anything moves), in frame pixels.
      const box = desk.getBoundingClientRect();
      const k = box.width / 1920;
      const point = (el, fx = 0.5, fy = 0.5) => {
        const b = el.getBoundingClientRect();
        return [(b.left + b.width * fx - box.left) / k, (b.top + b.height * fy - box.top) / k];
      };
      const P = {
        plus: point(q('.ol-dk-plus')), get: point(r.get, 0.45, 0.55), accept: point(r.accept, 0.45, 0.58),
        more: point(q('.ol-dk-more'), 0.5, 0.55), settings: point(r.miSettings, 0.3, 0.55),
        nav: point(r.navAm, 0.3, 0.55), toggle: point(r.track, 0.62, 0.55),
      };
      const stops = stopsFor(P, d.geometry.pinnedCenter);

      return (t) => {
        const T = h.start + t * (h.seconds - FRAME_S);
        apply(T, r);
        const dock = win(T, E.launch + 0.05, 0.45);
        d.set({ open: 0, pill: dock, cursor: K.cursorAt(stops, T, PACE, (s) => s.at) });
      };
    }, slice(compId));
  }

  function captions(compId) {
    K.mount(compId, (h) => {
      const holder = h.$('.ol-caps');
      const pages = CAP.lines.map((L) => {
        const page = document.createElement('div');
        page.className = 'ol-cap-page';
        const p = document.createElement('p');
        p.className = 'ol-cap-text';
        // Subtitles stay centred and may sit over a notification in the corner: intentional layering for the audit.
        p.setAttribute('data-layout-allow-overlap', '');
        p.setAttribute('data-layout-allow-occlusion', '');
        const spans = L.words.map((w, i) => {
          const s = document.createElement('span');
          s.textContent = w.text;
          p.appendChild(s);
          if (i < L.words.length - 1) p.appendChild(document.createTextNode(' '));
          return s;
        });
        page.appendChild(p);
        holder.appendChild(page);
        return { L, page, spans };
      });
      return (t) => {
        const T = h.start + t * (h.seconds - FRAME_S);
        pages.forEach(({ L, page, spans }, i) => {
          const next = CAP.lines[i + 1];
          // A page cuts in at its line's cue and holds until the next one; the last clears when its line ends.
          const shown = T >= L.from && (next ? T < next.from : T < L.to);
          page.style.opacity = shown ? 1 : 0;
          if (!shown) return;
          const e = T - L.from;
          spans.forEach((s, j) => {
            const w = L.words[j];
            s.style.opacity = 0.42 + 0.58 * clamp01((e - w.start) / 0.07);
            s.style.color = e >= w.start && e < w.end ? ACCENT : '#ededf2';
          });
        });
      };
    }, slice(compId));
  }

  function end(compId) {
    K.mount(compId, (h) => {
      // The product shot: OneLaunch with scanning on (dock shield, the tile reading On, the toast).
      const shot = h.$('.ol-end-shot');
      shot.innerHTML = '<div class="pc-wallpaper" style="position:absolute;left:0;top:0;width:100%;height:100%;"></div>' + window.OneLaunchUI.spaceHTML();
      shot.setAttribute('data-layout-ignore', ''); // a picture of the product, not copy to audit
      const show = (sel, css) => shot.querySelectorAll(sel).forEach((el) => Object.assign(el.style, css));
      show('.ol-lib, .ol-get-on, .ol-dk-shield, .ol-dk-active, .ol-dk-plus-on, .ol-toast-on', { opacity: 1 });
      show('.ol-get-label', { opacity: 0 });
      const row = h.$('.ol-end-row');
      const claims = h.$('.ol-end-claims');
      return (t) => {
        const T = t * (h.seconds - FRAME_S);
        const e = ease(at(T, 0, 0.85));
        row.style.opacity = e;
        row.style.transform = `scale(${0.94 + 0.06 * e})`;
        const c = ease(at(T, 0.35, 1.1));
        claims.style.opacity = c;
        claims.style.transform = `translateY(${(1 - c) * 14}px)`;
      };
    }, slice(compId));
  }

  window.OneLaunchStory = { E, scene, captions, end };
})();
