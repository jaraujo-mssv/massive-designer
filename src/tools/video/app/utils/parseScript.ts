/**
 * Light reader for HyperFrames' SCRIPT.md (locked narration). The format is free-form
 * markdown: a header of **Key:** lines, then one "## Line N — label (Frame N)" section
 * per spoken line with **Time:** / **Delivery:** notes and an indented spoken block.
 */
export interface ScriptLine {
  heading: string;
  time: string | null;
  delivery: string | null;
  spoken: string;
}

export interface ParsedScript {
  title: string | null;
  header: { key: string; value: string }[];
  lines: ScriptLine[];
}

const FIELD = /^\*\*([^*]+):\*\*\s*(.*)$/;

export function parseScript(md: string): ParsedScript {
  const [head, ...sections] = md.split(/^## /m);
  const title = head.match(/^# (.+)$/m)?.[1]?.trim() ?? null;
  const header = head
    .split("\n")
    .map((l) => l.trim().match(FIELD))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ key: m[1].trim(), value: m[2].trim() }));

  const lines = sections.map((section) => {
    const [heading, ...rest] = section.split("\n");
    let time: string | null = null;
    let delivery: string | null = null;
    const spoken: string[] = [];
    for (const raw of rest) {
      const field = raw.trim().match(FIELD);
      if (field?.[1] === "Time") time = field[2];
      else if (field?.[1] === "Delivery") delivery = field[2];
      else if (/^( {4}|\t)/.test(raw) && raw.trim()) spoken.push(raw.trim());
    }
    return { heading: heading.trim(), time, delivery, spoken: spoken.join(" ") };
  });

  return { title, header, lines };
}
