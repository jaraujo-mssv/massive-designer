---
workflow: general-video
flow: companion
storyboard: yes
message: "OneLaunch users turn on free file scanning with Massive's consent, and turn it off with one switch"
destination: partner-pitch
aspect: 1920x1080
language: en
audience: the OneLaunch team (OneLaunch × Massive)
length: 45-50s
voice: Mark (ElevenLabs, eleven_v3, via npm run video:voice)
---

## Intent

An animated screen recording of Windows, in the style of the sparktray-campaign guide videos: a user opens OneLaunch,
finds free File Reputation Scanning in the Apps Library, Massive's consent pops up, they Accept, the feature unlocks, they
go to OneLaunch Settings, switch it off, and the feature goes away. Narrated, with word-by-word subtitles above the
taskbar (subtitles first; the voice is recorded later), and an OneLaunch × Massive end card. For the OneLaunch team; a
local file, not posted.

## Assets

- assets/images/wallpaper.jpg: the dark Windows 11 bloom from sparktray-campaign (as in the consent video).
- assets/onelaunch/icons/: OneLaunch's dock and Apps Library icons, cropped from OneLaunch's 3x marketing images and an Apps Library screenshot.
- assets/onelaunch/onelaunch-logo.png, onelaunch-logo-round.png, onelaunch-small.png: OneLaunch's logo at three sizes.
- assets/onelaunch/desktop-plate.png: a OneLaunch desktop mockup (reference only).
- assets/brand/massive-logo-negative.svg: Massive's logo for the end-card lock-up.
- assets/music/calm-lo-fi.mp3: the music bed from what-does-consent-look-like, at 0.07 with 1.5 s fades.
- assets/fonts/: Inter (subtitles, clock), Selawik (a Segoe UI stand-in, for OneLaunch's UI), Outfit (end card). All OFL.

## Customizations

- Style: a full-screen Windows 11 screen recording (dark bloom wallpaper, taskbar, cursor, karaoke subtitles). OneLaunch's
  own light UI (dock, Apps Library, Settings) drawn from the real screenshots and icons.
- Story (2026-11-24): open → offer → consent → unlocked → Settings → off → end card.
- 2026-11-24: no focus on Avira (the feature is unbranded File Reputation Scanning) and no Clearware: OneLaunch × Massive only.
  The end card is in Massive's colours with OneLaunch's logo.
- Notifications sit where Windows puts them, bottom right above the taskbar; subtitles stay centred and may pass over them.
- Line 1 (2026-11-24): "A free feature in OneLaunch, that could pay for itself." "That's what keeps it free." was cut.

## Notes

- Every claim comes from the pitch or the dialog's text. No revenue figures.
- Narration says what the consent text says ("free resources and IP address, used to download public web data"), never less.
- Accept is filled and Decline is outlined in the mockup, so the copy says "same size", never "equal weight".
- The dialog reads "OneLaunch 7.0", as in the mockup; today's installer is 5.33.
- No fade to black at the end: `posterFromEnd` makes the last frame the thumbnail.
