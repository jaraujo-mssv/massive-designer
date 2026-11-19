/**
 * The themed backgrounds: square SVGs that scripts/team-photo/themes.mjs makes in
 * public/team-photo/themes/ (`node scripts/team-photo/themes.mjs`). A tile shows its theme behind the
 * face, and a download draws the same file under it. Add a theme there and here.
 */
export interface Theme {
  id: string;
  name: string;
  src: string;
  /** The ground colour, shown while the SVG loads. */
  hex: string;
}

export const THEMES: Theme[] = [
  { id: "world-map", name: "World map", src: "/team-photo/themes/world-map.svg", hex: "#fff7f2" },
  { id: "grid", name: "Massive grid", src: "/team-photo/themes/grid.svg", hex: "#fff7f2" },
  { id: "holidays", name: "Holidays", src: "/team-photo/themes/holidays.svg", hex: "#fff7f2" },
  { id: "summer", name: "Summer", src: "/team-photo/themes/summer.svg", hex: "#FFF2C4" },
  { id: "confetti", name: "Confetti", src: "/team-photo/themes/confetti.svg", hex: "#fff7f2" },
];

export const themeById = (id: string): Theme | undefined => THEMES.find((t) => t.id === id);
