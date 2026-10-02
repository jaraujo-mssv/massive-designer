/**
 * Animatic frames, drawn at true video pixels (see FrameBox).
 *
 * Inline styles in real px rather than Tailwind: these are artwork, exported as
 * PNGs, and every size here is a size in the video.
 */

import { FORMATS } from "../constants";
import type { ScriptFormat, Shot, ShotLine } from "../types";

const C = {
  bg: "#0a0a0f",
  surface: "#121117",
  red: "#d74939",
  redLight: "#ff8163",
  text: "#faf4ec",
  mid: "rgba(250,244,236,0.75)",
  dim: "rgba(250,244,236,0.5)",
  line: "rgba(250,244,236,0.14)",
};
const OUTFIT = "'Outfit', sans-serif";
const MONO = "'JetBrains Mono', monospace";

/** Type scale per format: a 9:16 frame is narrow, so its text is set for width. */
const SIZE: Record<ScriptFormat, { pad: number; meta: number; visual: number; caption: number; speaker: number; tagline: number }> = {
  vertical: { pad: 80, meta: 30, visual: 50, caption: 60, speaker: 26, tagline: 112 },
  landscape: { pad: 96, meta: 26, visual: 44, caption: 52, speaker: 22, tagline: 120 },
};

const Glow = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 80% 55% at 50% 100%, rgba(215,73,57,0.22), transparent 70%)`,
    }}
  />
);

/** Burned-in captions: who's speaking, then the line, set to read on a muted phone. */
function Captions({ lines, format }: { lines: ShotLine[]; format: ScriptFormat }) {
  const s = SIZE[format];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: s.caption * 0.55 }}>
      {lines.map((l, i) => (
        <div key={i}>
          {l.speaker && (
            <div
              style={{
                fontFamily: MONO,
                fontSize: s.speaker,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: l.speaker === "VO" ? C.dim : C.redLight,
                marginBottom: s.speaker * 0.5,
              }}
            >
              {l.speaker}
              {l.manner && <span style={{ color: C.dim, textTransform: "none", letterSpacing: 0 }}> · {l.manner}</span>}
            </div>
          )}
          <div
            style={{
              fontFamily: OUTFIT,
              fontSize: s.caption,
              fontWeight: 700,
              lineHeight: 1.18,
              letterSpacing: "-0.01em",
              color: l.speaker === "VO" ? C.mid : C.text,
              fontStyle: l.speaker === "VO" ? "italic" : "normal",
              textShadow: "0 2px 18px rgba(0,0,0,0.6)",
            }}
          >
            {l.text}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShotFrame({ shot, format, label }: { shot: Shot; format: ScriptFormat; label: string }) {
  const { w, h } = FORMATS[format];
  const s = SIZE[format];
  const landscape = format === "landscape";

  return (
    <div style={{ position: "relative", width: w, height: h, background: C.bg, color: C.text, overflow: "hidden" }}>
      {shot.still ? (
        <>
          <img src={shot.still} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,10,15,0.55), transparent 30%, transparent 45%, rgba(10,10,15,0.9))" }} />
        </>
      ) : (
        <Glow />
      )}

      <div style={{ position: "absolute", inset: 0, padding: s.pad, display: "flex", flexDirection: "column", gap: s.pad * 0.6 }}>
        {/* Slate */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontFamily: MONO, fontSize: s.meta, color: C.dim, letterSpacing: "0.08em" }}>
          <span style={{ color: C.text, fontWeight: 600 }}>SHOT {String(shot.n).padStart(2, "0")}</span>
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label.toUpperCase()}</span>
          <span style={{ border: `2px solid ${C.line}`, borderRadius: 999, padding: "6px 18px" }}>{shot.duration === null ? "~" : ""}{Math.round(shot.seconds)}s</span>
        </div>

        {/* What the camera sees, until there's a still */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: landscape ? "row" : "column", gap: s.pad * 0.6 }}>
          {!shot.still && (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                border: `3px dashed ${C.line}`,
                borderRadius: 32,
                padding: s.pad * 0.7,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 28,
              }}
            >
              <div style={{ fontFamily: OUTFIT, fontSize: s.visual, lineHeight: 1.3, color: C.mid }}>{shot.visual}</div>
              {shot.directions.map((d, i) => (
                <div key={i} style={{ fontFamily: OUTFIT, fontSize: s.visual * 0.75, fontStyle: "italic", color: C.dim }}>
                  {d}
                </div>
              ))}
            </div>
          )}
          {shot.still && <div style={{ flex: 1 }} />}
          {shot.lines.length > 0 && (
            <div style={{ flex: landscape ? "0 0 42%" : "0 0 auto", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <Captions lines={shot.lines} format={format} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The end card every piece closes on: the legend's earned-it line, the tagline,
 * the sign-off and the URL. Lines said on camera in the same shot (Caesar's
 * "Trust your partners") sit above it as captions; the voice-over is the card.
 */
export function EndCardFrame({
  format,
  endCard,
  tagline,
  signoff,
  url,
  onCamera = [],
}: {
  format: ScriptFormat;
  endCard: string | null;
  tagline: string | null;
  signoff: string | null;
  url: string | null;
  onCamera?: ShotLine[];
}) {
  const { w, h } = FORMATS[format];
  const s = SIZE[format];
  // "Massive. Proxies with permission." → the logo, then the rest.
  const afterLogo = signoff?.replace(/^Massive\.\s*/, "") ?? null;
  const [lead, last] = splitLast(tagline ?? "");

  return (
    <div style={{ position: "relative", width: w, height: h, background: C.bg, color: C.text, overflow: "hidden" }}>
      <Glow />
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: s.pad * 1.2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: s.pad * 0.8,
          textAlign: format === "vertical" ? "left" : "center",
          alignItems: format === "vertical" ? "flex-start" : "center",
        }}
      >
        {onCamera.length > 0 && <Captions lines={onCamera} format={format} />}
        {endCard && (
          <div style={{ fontFamily: OUTFIT, fontSize: s.caption * 0.9, lineHeight: 1.25, color: C.mid, maxWidth: 1400 }}>{endCard}</div>
        )}
        {tagline && (
          <div style={{ fontFamily: OUTFIT, fontSize: s.tagline, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.035em", maxWidth: 1500 }}>
            {lead} <span style={{ color: C.red }}>{last}</span>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 28, alignItems: "inherit", marginTop: s.pad * 0.4 }}>
          <img src="/logo-negative.svg" alt="Massive" style={{ height: 112, width: "auto" }} />
          {afterLogo && <div style={{ fontFamily: OUTFIT, fontSize: s.caption * 0.75, fontWeight: 500, color: C.text }}>{afterLogo}</div>}
          {url && <div style={{ fontFamily: MONO, fontSize: s.meta * 1.15, color: C.redLight, letterSpacing: "0.04em" }}>{url}</div>}
        </div>
      </div>
    </div>
  );
}

/** "Earned trust beats paid fame." → ["Earned trust beats paid", "fame."], so the last word can take the coral. */
function splitLast(text: string): [string, string] {
  const at = text.trimEnd().lastIndexOf(" ");
  return at < 0 ? ["", text] : [text.slice(0, at), text.slice(at + 1)];
}
