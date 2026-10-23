import { MockBar, MockCanvas, MockHeader, MockLogo, ThemePreviewProps } from "@/shared/canvas/ThemePicker";

/** The Top List in a theme card: ranked rows, or under a legacy theme, the old two columns of cards. */
export function ThemePreview({ legacy }: ThemePreviewProps) {
  if (legacy) {
    return (
      <MockCanvas>
        <MockHeader centered />
        <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 3 }}>
          {[0, 1].map((c) => (
            <span key={c} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              {[0, 1, 2].map((r) => {
                const i = c * 3 + r;
                return (
                  <span
                    key={r}
                    style={{
                      boxSizing: "border-box",
                      height: 11,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      padding: "0 3px",
                      borderRadius: 2,
                      backgroundColor: "var(--canvas-card-bg)",
                      border: "1px solid var(--canvas-border)",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        boxSizing: "border-box",
                        flexShrink: 0,
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        border: "1px solid var(--canvas-text)",
                      }}
                    />
                    <MockLogo size={6} i={i} />
                    <MockBar w={`${30 + (i * 9) % 15}%`} h={2} color="var(--canvas-text)" />
                    <span style={{ flex: 1 }} />
                    <span
                      style={{
                        boxSizing: "border-box",
                        flexShrink: 0,
                        width: 9,
                        height: 5,
                        borderRadius: 2.5,
                        backgroundColor: "var(--canvas-card-bg-2)",
                        border: "1px solid var(--canvas-border-15)",
                      }}
                    />
                  </span>
                );
              })}
            </span>
          ))}
        </span>
      </MockCanvas>
    );
  }

  return (
    <MockCanvas>
      <MockHeader />
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 3,
              padding: "0 3px",
              borderRadius: 2,
              backgroundColor: "var(--canvas-card-bg)",
              borderBottom: "1px solid var(--canvas-border-15)",
            }}
          >
            <span
              style={{ display: "block", flexShrink: 0, width: 5, height: 5, borderRadius: "50%", backgroundColor: "var(--canvas-red)" }}
            />
            <MockLogo size={6} i={i} />
            <span
              style={{
                display: "block",
                width: `${30 + (i * 11) % 14}%`,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: "var(--canvas-card-bg-2)",
              }}
            />
            <span style={{ flex: 1 }} />
            <MockBar w={9} h={2} color="var(--canvas-text-85)" />
          </span>
        ))}
      </span>
    </MockCanvas>
  );
}
