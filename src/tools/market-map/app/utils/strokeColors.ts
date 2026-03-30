// Define 8 stroke colors for category cards
export const STROKE_COLORS = {
  1: "#2C2A30", // Light Orange (default)
  2: "#FFAD5E", // Orange
  3: "#DEDEDE", // Light Gray
  4: "#D53E4F", // Red
  5: "#AC86F9", // Purple
  6: "#66C2A5", // Teal
  7: "#4D8B8D", // Dark Teal
  8: "#3288BD", // Blue
};

export const DEFAULT_STROKE_COLOR = STROKE_COLORS[1];

export function getStrokeColor(stroke?: number): string {
  if (!stroke || stroke < 1 || stroke > 8) {
    return DEFAULT_STROKE_COLOR;
  }
  return STROKE_COLORS[stroke as keyof typeof STROKE_COLORS];
}
