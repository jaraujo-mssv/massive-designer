import { SidebarWarning } from "@/shared/components/SidebarLayout";
import { LOW_RES_WIDTH } from "./resolve";

/** Names listed before "and N more". */
const MAX_NAMES = 6;

/** "A, B and C", or "A, B, … and 4 more" past MAX_NAMES. */
function listNames(names: string[]): string {
  if (names.length === 1) return names[0];
  const shown = names.slice(0, MAX_NAMES);
  const rest = names.length - shown.length;
  if (rest > 0) return `${shown.join(", ")} and ${rest} more`;
  return `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}`;
}

/**
 * Warns that some logos are only favicons (`useLowResLogos`): nothing sharper
 * was found, so they're drawn from a 16px image and look soft, the export most
 * of all. For SheetSidebar's `warnings`; renders nothing without names.
 */
export function LowResWarning({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const one = names.length === 1;
  return (
    <SidebarWarning>
      {one ? "1 logo is" : `${names.length} logos are`} only {LOW_RES_WIDTH}px, the largest found, so{" "}
      {one ? "it looks" : "they look"} blurry: {listNames(names)}. Click a company to paste or upload a sharper logo.
    </SidebarWarning>
  );
}
