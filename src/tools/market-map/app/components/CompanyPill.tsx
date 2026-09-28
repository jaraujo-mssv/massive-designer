import { useState } from "react";
import type { PillMetrics } from "../utils/pills";
import { PILL_WEIGHT } from "../utils/pills";

interface CompanyPillProps {
  name: string;
  logoUrl: string;
  x: number;
  y: number;
  width: number;
  metrics: PillMetrics;
}

/** A company as a pill: logo then name, in the theme's pill colours. */
export function CompanyPill({ name, logoUrl, x, y, width, metrics: m }: CompanyPillProps) {
  const [logoFailed, setLogoFailed] = useState(!logoUrl);

  return (
    <div
      title={name}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height: m.height,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: m.innerGap,
        padding: `${m.padY}px ${m.padX}px`,
        borderRadius: 999,
        backgroundColor: "var(--canvas-card-bg-2)",
        border: "1px solid var(--canvas-border-15)",
        color: "var(--canvas-text)",
        fontSize: m.fontSize,
        fontWeight: PILL_WEIGHT,
        lineHeight: 1,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {logoFailed ? (
        <span
          style={{
            width: m.logo,
            height: m.logo,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: m.logo * 0.6,
            fontWeight: 700,
            color: "var(--canvas-text-dim)",
          }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      ) : (
        <img
          src={logoUrl}
          alt={name}
          onError={() => setLogoFailed(true)}
          style={{ width: m.logo, height: m.logo, objectFit: "contain", flexShrink: 0, borderRadius: 4 }}
        />
      )}
      <span>{name}</span>
    </div>
  );
}
