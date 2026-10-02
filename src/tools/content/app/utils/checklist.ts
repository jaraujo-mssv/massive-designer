import type { ChecklistItem } from "../types";

const ITEM = /^(\s*)[-*] \[( |x|X)\] (.*)$/;
const FENCE = /^\s*(```|~~~)/;
const CONTINUATION = /^(\s{2,}|\t)\S/;

/**
 * Every task-list item in the body, with the line it sits on.
 *
 * `firstLine` is the 1-based line of `lines[0]` in the file, so the numbers
 * here point at the file itself and the dev server can flip the right one.
 */
export function parseChecklist(lines: string[], firstLine: number): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let section: string | null = null;
  let fenced = false;

  lines.forEach((source, i) => {
    if (FENCE.test(source)) fenced = !fenced;
    if (fenced) return;
    if (source.startsWith("## ")) {
      section = source.slice(3).trim();
      return;
    }
    const m = ITEM.exec(source);
    if (!m) return;
    // Indented, non-item lines straight after the item belong to it.
    const detail: string[] = [];
    for (let j = i + 1; j < lines.length && CONTINUATION.test(lines[j]) && !ITEM.test(lines[j]); j++) detail.push(lines[j].trim());
    items.push({
      line: firstLine + i,
      source,
      label: m[3].trim(),
      checked: m[2] !== " ",
      depth: Math.floor(m[1].replace(/\t/g, "  ").length / 2),
      section,
      detail: detail.length ? detail.join("\n") : null,
    });
  });

  return items;
}

export const progress = (items: ChecklistItem[]) => ({
  done: items.filter((i) => i.checked).length,
  total: items.length,
});
