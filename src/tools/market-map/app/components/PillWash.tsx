import { initialsColor } from "@/shared/canvas/logos/InitialsLogo";

/**
 * How strongly the blurred logo colours a pill. Set per theme as
 * --canvas-pill-wash-opacity (theme-canvas.css); this is the fallback.
 */
const LOGO_WASH_OPACITY = 0.18;

/**
 * A pill's logo wash: the logo as a square centred on the pill, `size` wide,
 * heavily blurred and faded, so the pill takes on the logo's colours. Blur
 * fades out at an image's edges, so the image overhangs by twice the blur and
 * the pill (overflow: hidden) clips it. Without a logo, the pill is tinted in
 * its initials logo's colour. What the pill draws after it needs
 * position: relative to paint above.
 */
export function PillWash({ src, name, size, blur }: { src: string | null; name: string; size: number; blur: number }) {
  const opacity = `var(--canvas-pill-wash-opacity, ${LOGO_WASH_OPACITY})`;
  return src ? (
    <img
      aria-hidden
      alt=""
      src={src}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size + blur * 4,
        height: size + blur * 4,
        transform: "translate(-50%, -50%)",
        objectFit: "cover",
        objectPosition: "center",
        filter: `blur(${blur}px) saturate(1.4)`,
        opacity,
        pointerEvents: "none",
      }}
    />
  ) : (
    <div
      aria-hidden
      style={{ position: "absolute", inset: 0, backgroundColor: initialsColor(name), opacity, pointerEvents: "none" }}
    />
  );
}
