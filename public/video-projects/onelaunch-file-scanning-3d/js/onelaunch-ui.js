/*
 * OneLaunch UI for the screen recording: the dock, the Apps Library, the update dialog with Massive's consent, the
 * toasts and the Settings page. Everything is drawn in OneLaunch's own 1280×720 screen space (the size of the real
 * OneLaunch screenshots) and the .ol-space layer scales it 1.5× to fill 1920×1080. Styles: onelaunch.css. The
 * dialog follows the pitch mockup; the feature is unbranded File Reputation Scanning, funded by Massive.
 *
 * Every builder returns markup for the resting state; js/onelaunch-story.js reveals parts with inline styles.
 */
(function (root) {
  'use strict';

  const SPACE = { w: 1280, h: 720, scale: 1.5 };

  const img = (name, cls) => `<span class="${cls}" style="background-image:url(assets/onelaunch/icons/${name}.png)"></span>`;

  // ── Small vector pieces (from the mockup) ─────────────────────────────
  const CHECK = '<svg width="9" height="9" viewBox="0 0 9 9"><path d="M1 4.6l2.3 2.3L8 2" fill="none" stroke="#fff" stroke-width="1.8"/></svg>';
  const BADGE = '<svg width="54" height="58" viewBox="0 0 54 58">' +
    '<path d="M6 3h28l14 14v35a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" fill="#fff" stroke="#f8f8f8" stroke-width="3"/>' +
    '<path d="M34 3v11a3 3 0 0 0 3 3h11" fill="#e6e6e6"/>' +
    '<path d="M25 19l13 5v9c0 8-6 13-13 16-7-3-13-8-13-16v-9z" fill="#1e9e63"/>' +
    '<path d="M19 33l4.5 4.5L32 29" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SHIELD = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 2.5l8 3.1v5.6c0 5-3.4 8.6-8 10.3-4.6-1.7-8-5.3-8-10.3V5.6z" fill="#1e9e63"/><path d="M8.4 12.2l2.6 2.6 4.8-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const MIN = '<svg width="11" height="11"><path d="M0 5.5h11" stroke="#555"/></svg>';
  const CLOSE = (c = '#555', s = 12) => `<svg width="${s}" height="${s}" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="${c}" stroke-width="1.2"/></svg>`;
  const SEARCH = '<svg width="14" height="14" viewBox="0 0 16 16"><circle cx="9.5" cy="6.5" r="4.6" fill="none" stroke="#444" stroke-width="1.3"/><path d="M6.2 9.8L2 14" stroke="#444" stroke-width="1.3" stroke-linecap="round"/></svg>';
  const PLUS = '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 1.5v13M1.5 8h13" stroke="#222" stroke-width="1.4" stroke-linecap="round"/></svg>';
  const TOAST_ON = '<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#1e9e63"/><path d="M12 20.5l5.5 5.5L28 15" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const TOAST_OFF = '<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#8a8a8a"/><path d="M14 20h12" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></svg>';

  // ── The dock ──────────────────────────────────────────────────────────
  /** The OneLaunch dock across the top (the shield shows while scanning is on). */
  function dockHTML() {
    return `<div class="ol-dock">
  <span class="ol-dk-logo">${img('dock-onelaunch', 'ol-dk-ico ol-dk-ico-lg')}<i class="ol-dk-active"></i></span>
  <span class="ol-dk-sep"></span>
  <span class="ol-dk-pin">${img('dock-dashboard', 'ol-dk-ico')}<b>Dashboard</b></span>
  ${img('dock-shopping', 'ol-dk-ico')}${img('dock-weather', 'ol-dk-ico')}${img('dock-news', 'ol-dk-ico')}${img('dock-dictionary', 'ol-dk-ico')}
  <span class="ol-dk-plus">${PLUS}<i class="ol-dk-plus-on"></i></span>
  <span class="ol-dk-search">${SEARCH}<b>Search the web</b></span>
  <span class="ol-dk-right">
    ${img('dock-sun', 'ol-dk-ico ol-dk-sun')}
    <span class="ol-dk-shield" title="File Reputation Scanning">${SHIELD(20)}</span>
    ${img('dock-scissors', 'ol-dk-ico ol-dk-sm')}${img('dock-video', 'ol-dk-ico ol-dk-sm')}${img('dock-clipboard', 'ol-dk-ico ol-dk-sm')}${img('dock-trash', 'ol-dk-ico ol-dk-sm')}
    ${img('dock-more', 'ol-dk-ico ol-dk-more')}
  </span>
</div>`;
  }

  // ── Apps Library ──────────────────────────────────────────────────────
  const APPS = [
    ['news', 'News'], ['dashboard', 'Dashboard'], ['maps', 'Maps'], ['weather', 'Weather'], ['shopping', 'Shopping'], ['calculator', 'Calculator'], ['dictionary', 'Dictionary'],
    ['flighttracker', 'FlightTracker'], ['tracking', 'Tracking'], ['email', 'Email'], ['tv', 'TV'], ['games', 'Games'], ['recipes', 'Recipes'], ['howto', 'How To'],
  ];

  function libraryHTML() {
    return `<div class="ol-lib">
  <div class="ol-lib-side">
    <p class="ol-lib-title">Apps Library</p>
    <p class="ol-nav is-on">Apps</p><p class="ol-nav">Top Sites</p><p class="ol-nav">Email</p><p class="ol-nav">Watch</p><p class="ol-nav">Games</p><p class="ol-nav">Banking</p>
  </div>
  <div class="ol-lib-main">
    <span class="ol-x">${CLOSE('#333', 16)}</span>
    <p class="ol-lib-h">Apps</p>
    <div class="ol-feat">
      <span class="ol-feat-new">NEW IN ONELAUNCH</span>
      <span class="ol-feat-ico">${BADGE}</span>
      <div class="ol-feat-txt"><p class="ol-feat-t">File Reputation Scanning</p><p class="ol-feat-s">Checks downloads before you open them</p></div>
      <span class="ol-feat-free">Free</span>
      <span class="ol-get"><b class="ol-get-label">Get</b><b class="ol-get-on">${SHIELD(14)} On</b></span>
    </div>
    <div class="ol-grid">${APPS.map(([k, n]) => `<span class="ol-app">${img('app-' + k, 'ol-app-ico')}<b>${n}</b></span>`).join('')}</div>
  </div>
</div>`;
  }

  // ── The dialog (the deck's mockup, word for word) ─────────────────────
  function dialogHTML() {
    return `<div class="ol-dlg">
  <div class="ol-tb"><span class="ol-tb-icon"></span><span>OneLaunch Update</span><span class="ol-sp"></span><span class="ol-wc">${MIN}</span><span class="ol-wc">${CLOSE()}</span></div>
  <div class="ol-body">
    <div class="ol-left">
      <div class="ol-logo">${BADGE}</div>
      <div class="ol-name"><span>File Reputation</span><span>Scanning</span></div>
      <div class="ol-by">Free in OneLaunch</div>
    </div>
    <div class="ol-right">
      <div class="ol-eyebrow">NEW IN THIS UPDATE</div>
      <div class="ol-h1"><span>Free File Reputation Scanning</span><span>for safer browsing</span></div>
      <p class="ol-pitch">Enable File Reputation Scanning now to avoid malicious software &amp; files while browsing the web.</p>
      <ul class="ol-list">
        <li><i>${CHECK}</i>Checks downloads before you open them</li>
        <li><i>${CHECK}</i>Flags known malicious files</li>
        <li><i>${CHECK}</i>Free, no account needed</li>
      </ul>
    </div>
  </div>
  <div class="ol-consent">
    <p>To enable this free security layer, please let Massive use a small amount of your device's free resources and IP address to download public web data. Your participation is optional, and you may opt out anytime. Pressing Accept indicates that you agree to Massive's license and privacy policy. You can opt out at any time after opting in.</p>
    <div class="ol-links"><span>Massive FAQ</span><span>Massive License</span><span>Massive Privacy Policy</span></div>
  </div>
  <div class="ol-foot">
    <span class="ol-ver">OneLaunch 7.0</span>
    <span class="ol-btn ol-decline">Decline</span>
    <span class="ol-btn ol-accept">Accept</span>
  </div>
</div>`;
  }

  function toastHTML(kind) {
    const on = kind === 'on';
    return `<div class="ol-toast ol-toast-${kind}">
  <div class="ol-hd"><span class="ol-hd-icon"></span>OneLaunch<span class="ol-sp"></span>···&nbsp;&nbsp;&nbsp;✕</div>
  <div class="ol-row">${on ? TOAST_ON : TOAST_OFF}<div>
    <div class="ol-tt">${on ? 'File Reputation Scanning is on' : 'File Reputation Scanning is off'}</div>
    <div class="ol-tx">${on
      ? 'Files you download are now checked for known threats. You can opt out anytime in OneLaunch Settings.'
      : 'Massive has stopped on this PC, and scanning is off. You can turn it on again in Settings.'}</div>
  </div></div>
</div>`;
  }

  // ── Settings ──────────────────────────────────────────────────────────
  function settingsHTML() {
    return `<div class="ol-set">
  <div class="ol-lib-side">
    <p class="ol-lib-title">Settings</p>
    <p class="ol-nav ol-nav-general is-on">General</p><p class="ol-nav">Browsing</p><p class="ol-nav">Dock</p><p class="ol-nav">Notifications</p><p class="ol-nav">Startup &amp; Wake</p>
    <p class="ol-nav ol-nav-am">File Scanning <span class="ol-new">NEW</span></p>
  </div>
  <div class="ol-lib-main">
    <span class="ol-x">${CLOSE('#333', 16)}</span>
    <div class="ol-set-general">
      <p class="ol-lib-h">General</p>
      <div class="ol-set-cols">
        <div><p class="ol-st">My Location</p><p class="ol-sd">OneLaunch can detect your location in order to provide you with daily News &amp; Weather results according to your locale.</p>
             <p class="ol-st">Temperature Units</p><p class="ol-sd">OneLaunch offers the ability to change between Celsius &amp; Fahrenheit based on your preference.</p>
             <p class="ol-st">Time Zone</p><p class="ol-sd">Keep the default time zone currently set on your computer system or change to a different time zone of your preference.</p></div>
        <div><p class="ol-st">Check for Updates</p><p class="ol-sd">Click the "Update" button to check and download the latest version of OneLaunch.</p>
             <p class="ol-st">Search Bar Alignment</p><p class="ol-sd">Choose the search bar location on your OneLaunch dock that best fits your needs.</p>
             <p class="ol-st">OneLaunch Theme</p><p class="ol-sd">Choose between our Dark and Light themes, built for both Windows 10 and Windows 11.</p></div>
      </div>
    </div>
    <div class="ol-set-am">
      <p class="ol-lib-h">File Scanning</p>
      <div class="ol-am-card">
        <span class="ol-am-ico">${SHIELD(30)}</span>
        <div class="ol-am-txt">
          <p class="ol-st">File Reputation Scanning <span class="ol-by2">Free with Massive</span></p>
          <p class="ol-sd">Free because Massive uses a small amount of this PC's free resources and IP address to download public web data. Turning this off stops Massive, and scanning with it.</p>
          <p class="ol-am-links"><span>Massive FAQ</span><span>Massive License</span><span>Massive Privacy Policy</span></p>
        </div>
        <span class="ol-tg"><i class="ol-tg-knob"></i></span><b class="ol-tg-label"><span class="ol-tg-on">On</span><span class="ol-tg-off">Off</span></b>
      </div>
      <p class="ol-am-status"><span class="ol-am-status-on">${SHIELD(14)} Scanning is on. Files you download are checked.</span><span class="ol-am-status-off">Scanning is off. Massive is not running on this PC.</span></p>
    </div>
  </div>
</div>`;
  }

  function menuHTML() {
    return `<div class="ol-menu">
  <p class="ol-mi">Dashboard</p><p class="ol-mi">Apps Library</p><p class="ol-mi ol-mi-settings">Settings</p><p class="ol-mi">Help &amp; Feedback</p>
  <i class="ol-mi-sep"></i><p class="ol-mi">Exit OneLaunch</p>
</div>`;
  }

  /** The whole OneLaunch layer (1280×720, scaled by .ol-space). The desktop kit draws the cursor and click ring. */
  function spaceHTML() {
    return `<div class="ol-space">
  ${libraryHTML()}
  ${settingsHTML()}
  ${dialogHTML()}
  ${toastHTML('on')}
  ${toastHTML('off')}
  ${dockHTML()}
  ${menuHTML()}
</div>`;
  }

  root.OneLaunchUI = { SPACE, spaceHTML, dockHTML, libraryHTML, dialogHTML, toastHTML, settingsHTML, menuHTML };
})(typeof window !== 'undefined' ? window : globalThis);
