/**
 * Brand-like colours for initials logos: saturated enough to read as a logo,
 * dark enough for white text.
 */
const PALETTE = [
  "#e5484d", // red
  "#f76b15", // orange
  "#d6409f", // pink
  "#8e4ec6", // purple
  "#6e56cf", // violet
  "#3e63dd", // indigo
  "#0090ff", // blue
  "#0d74ce", // azure
  "#12a594", // teal
  "#30a46c", // green
  "#5c7c2f", // olive
  "#ad7f58", // bronze
];

/** A stable colour per company name, the same in the preview and the export. */
export function initialsColor(name: string): string {
  let hash = 2166136261;
  for (const ch of name.trim().toLowerCase()) {
    hash ^= ch.codePointAt(0)!;
    hash = Math.imul(hash, 16777619);
  }
  return PALETTE[(hash >>> 0) % PALETTE.length];
}

/** The first letter or digit of the name, upper-cased. */
export function initialOf(name: string): string {
  const match = name.match(/[\p{L}\p{N}]/u);
  return (match?.[0] ?? "?").toUpperCase();
}

/**
 * Stands in for a company with no usable logo: its initial in white bold on a
 * colour picked from its name, shaped like an app icon so it sits among real
 * logos.
 */
export function InitialsLogo({ name, size, style }: { name: string; size: number; style?: React.CSSProperties }) {
  return (
    <div
      aria-label={name}
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: size * 0.22,
        backgroundColor: initialsColor(name),
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Outfit, sans-serif",
        fontSize: size * 0.52,
        fontWeight: 700,
        lineHeight: 1,
        ...style,
      }}
    >
      {initialOf(name)}
    </div>
  );
}
