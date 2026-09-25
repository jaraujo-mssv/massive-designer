# Translation notes: What does consent look like?

Rebuilt from sparktray-campaign's `ScriptVideo` for `content/none/scripts/what-does-consent-look-like.md`.
The source is 1920x1080 at 60 fps, 5934 frames (98.9 s). No Remotion code or package was used. The source
scene components in `brand/ui` are plain React, and they were re-implemented here as HTML + vanilla JS.

## What was rebuilt

| Frame | Source | Here |
|---|---|---|
| pc-app, pc-install, pc-settings, pc-uninstall | `brand/ui/pc/{PcScene,PcDesktop,screens}.tsx`, `app/shell.tsx` (Cursor, SystemTray), `windows/*`, `cursor-track.ts` | `js/pc-desktop.js` builds the desktop, taskbar, tray, pinned app, pointer and click ring. Each screen is static HTML in its composition, with `render(t)` driving the one moving part. |
| funding-models, consent-flow, steps-preview/recap, consent-settled | `FundingModels`, `ConsentCircuit`, `ConsentSteps`, `ConsentSettled`, `diagram.tsx`, the `Diagram` wrapper in `Scene.tsx`, `backgrounds.tsx` | `js/diagram-kit.js` provides the palette, card, node and packet. `js/consent-steps.js` is the shared promise/recap drawing. The grid plate is CSS in `index.html`. |
| sign-off | `MassiveSignoff.tsx` | `compositions/10-signoff.html` |
| top/tail fade, voice, music bed | `ScriptVideo.tsx` | `index.html`: a black veil clip and two `<audio>` clips |

Every constant and mark was copied, not re-derived:
- geometry: `pcGeometry`, TASKBAR_SCALE 1.3, CURSOR_SCALE 1.5, fill, the 0.157 band
- the PcScene marks (APP, INSTALL, SETTINGS, UNINSTALL) and RUN_SECONDS
- the TICKS and pointer in ConsentSteps
- BEAT_05 and BEAT_19
- hub phrases, atom orbits, lap counts
- hot points (INSTALLER_HOT, SETTINGS_HOT, UNINSTALL_HOT)

Lucide icons come from lucide-react 1.24's icon nodes (`ConsentKit.icon`). The on-screen installer disclosure is verbatim from `screens.tsx`.

## Timing

- **Beats and runs.** Beats come from the take's cues (`content/voice.json`, `takeTimings`): beat *i* starts at `round(cue.from × 60)`, and the last beat runs to `round((95.2 + 1.2) × 60) = 5784`. Consecutive beats on one scene form one run (`sceneRuns`), and each run is one sub-composition with a single clock, `t = frame / (runFrames − 1)`, the same as `Beat` in ScriptVideo. Each host clip starts at `runFrom / 60` and runs `runFrames / 60`.
- **Voice.** The take starts at 0 s. There is no lead-in: beat 1's cue is 0 and ScriptVideo places the `<Audio>` at frame 0. So every scene change lands on its beat's cue. The 3-frame click-guard ramp is a 0.05 s volume lane.
- **Sign-off.** 150 frames (2.5 s) after the beats, at 96.4 s, silent.
- **Music.** Constant level 0.07 (MUSIC_LEVEL), with 1.5 s ramps at both ends of the 98.9 s film, written as absolute values in a volume lane. The bed is 160 s long, so it never loops.
- **Top and tail.** An 8-frame fade from and to black: `interpolate(f, [0, 8, D−8, D−1], [0, 1, 1, 0])`.

## Fidelity

- **Reference.** The reference is sparktray's studio storyboard (`/content?doc=none/what-does-consent-look-like&view=storyboard`), which renders the same `ScriptFrame` components. Each panel was captured at 1920x1080 and compared against the last frame of the matching shot here. SSIM is 0.998–0.999 on all nine shots.
- **Page base.** The studio lays frames out on Tailwind v4 preflight (`line-height: 1.5`, `svg { display: block }`, border-box) plus antialiased Inter. The measured cursor hot points in `screens.tsx` match that layout, not the browser default. So `#stage` uses the same base, and the pointer lands on the checkbox, switch and menu exactly.
- **Possible difference from the source MP4.** A Remotion render of the source would have used the browser default `line-height: normal`, because Remotion loads no CSS there. If the shipped MP4 was rendered that way, its text is a little tighter than this build.

## Simplifications and gaps

- **Subtitles.** Left out. ScriptVideo has them off by default (`subtitles: false` in Root.tsx), and the picture still reserves the subtitle band, as in the source.
- **No voiceover carve.** The music bed is not carved against the voice. The source mix is a flat −23.1 dB bed with fades, and it was kept as is. A carve would change the sound.
- **Assets.** Taken as files rather than data URIs:
  - wallpaper, installer banner and white Massive logo are the originals from `sparktray-campaign/brand/assets/…` (listed in `media.json`)
  - the taskbar art is the stripped SVG decoded from `taskbar-data.ts`, stored as a string in `js/taskbar-art.js` (tracked, so it deploys without media). Its ids are prefixed per scene at injection.
- **Contrast warnings.** `check` reports 15 contrast warnings, all on the replica app chrome's ghost text (`rgba(237,242,242,0.28)` and similar). Those colours are the source's own. Raising them would stop the screen matching the reference.
- **Taskbar overflow.** The taskbar is intentionally 1.3x the frame width and runs off both edges. It is marked `data-layout-allow-overflow`.
