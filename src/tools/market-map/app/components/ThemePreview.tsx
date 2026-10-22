import { MockBar, MockCanvas, MockHeader, MockLogo, ThemePreviewProps } from "@/shared/canvas/ThemePicker";
import type { MapView } from "./MapCanvas";

/** A modern tile: outlined, with the category name over flowing company pills. */
const TILE: React.CSSProperties = {
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  padding: 3,
  border: "1px solid var(--canvas-border-strong)",
  borderRadius: 3,
  overflow: "hidden",
};

function Pills({ count, from }: { count: number; from: number }) {
  return (
    <span style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 2 }}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            height: 6,
            padding: "0 2px",
            borderRadius: 3,
            backgroundColor: "var(--canvas-pill-bg)",
          }}
        >
          <MockLogo size={3} i={from + i} round />
          <MockBar w={5 + ((from + i) * 5) % 8} h={1.5} color="var(--canvas-text)" />
        </span>
      ))}
    </span>
  );
}

/** Company rows per card, column by column. */
const COLUMNS = [
  [3, 2],
  [4, 1],
  [2, 3],
];

/** The modern Columns' rules between categories and between columns. */
const RULE = "1px solid var(--canvas-border-strong)";

/**
 * Columns of categories: the old tool's filled cards (legacy), or plain names
 * and pills with rules between categories and columns (modern).
 */
function ColumnsMock({ legacy }: { legacy: boolean }) {
  return (
    <MockCanvas>
      <MockHeader />
      <span style={{ flex: 1, display: "flex", gap: 3, alignItems: legacy ? "flex-start" : "stretch" }}>
        {COLUMNS.map((cards, c) => (
          <span
            key={c}
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              ...(!legacy && c > 0 && { borderLeft: RULE, paddingLeft: 3 }),
            }}
          >
            {cards.map((rows, j) => (
              <span
                key={j}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: legacy ? 2 : 1.5,
                  ...(legacy
                    ? {
                        padding: 3,
                        borderRadius: 3,
                        backgroundColor: "var(--canvas-card-bg)",
                        border: "1px solid var(--canvas-legacy-card-border, var(--canvas-border))",
                      }
                    : j > 0 && { borderTop: RULE, paddingTop: 3 }),
                }}
              >
                {legacy ? (
                  <MockBar w="60%" h={3} color="var(--canvas-text)" />
                ) : (
                  <MockBar w="65%" h={3} color="var(--canvas-category)" />
                )}
                {Array.from({ length: rows }, (_, r) => (
                  <span
                    key={r}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      ...(!legacy && { height: 5, padding: "0 1.5px", borderRadius: 2.5, backgroundColor: "var(--canvas-pill-bg)" }),
                    }}
                  >
                    <MockLogo size={legacy ? 4 : 3} i={c * 3 + j * 2 + r} round={!legacy} />
                    <MockBar
                      w={`${45 + ((c + j + r) * 13) % 35}%`}
                      h={legacy ? 2 : 1.5}
                      color={legacy ? "var(--canvas-text-85)" : "var(--canvas-text)"}
                    />
                  </span>
                ))}
              </span>
            ))}
          </span>
        ))}
      </span>
    </MockCanvas>
  );
}

/**
 * The Market Map in a theme card, in the chosen layout: columns of cards or
 * tiles and pills. Legacy themes are always the old columns.
 */
export function ThemePreview({ legacy, view }: ThemePreviewProps & { view: MapView }) {
  if (legacy || view === "columns") return <ColumnsMock legacy={legacy} />;

  return (
    <MockCanvas>
      <MockHeader />
      <span style={{ flex: 1, display: "grid", gridTemplateColumns: "58fr 42fr", gridTemplateRows: "1fr 1fr", gap: 2 }}>
        <span style={{ ...TILE, gridRow: "span 2" }}>
          <MockBar w="45%" h={3} color="var(--canvas-category)" />
          <Pills count={6} from={0} />
        </span>
        <span style={TILE}>
          <MockBar w="60%" h={3} color="var(--canvas-category)" />
          <Pills count={2} from={6} />
        </span>
        <span style={TILE}>
          <MockBar w="60%" h={3} color="var(--canvas-category)" />
          <Pills count={3} from={8} />
        </span>
      </span>
    </MockCanvas>
  );
}
