import { FORMATS } from "../constants";
import type { Campaign, ScriptDoc, Shot } from "../types";
import { section } from "./parseDoc";
import { fmtSeconds, totalSeconds } from "./shots";

const stripComments = (text: string) => text.replace(/<!--[\s\S]*?-->/g, "").trim();

/**
 * Dialogue with every speaker named. The script can leave a legend's line bare
 * (`"Even the Constitution needed a yes."`); a generator needs to be told who says it.
 */
const dialogue = (shot: Shot) =>
  [
    ...shot.lines.map((l) => `${l.speaker ?? "Unknown speaker"}${l.manner ? `, ${l.manner}` : ""}: "${l.text}"`),
    ...shot.directions.map((d) => `(${d})`),
  ].join(" ");

/**
 * A script as one plain-text brief, to paste into a video generation agent
 * (ElevenLabs Flow). Everything a shot needs is spelled out: the shared look,
 * each character's fixed description, the sets, then every shot's camera,
 * action, screen text, dialogue and sound, and the end card copy.
 */
export function flowBrief(doc: ScriptDoc, campaign: Campaign): string {
  const { w, h, label } = FORMATS[doc.format];
  const brief = campaign.brief;
  const look = brief && section(brief, "Look and feel");
  const legends = campaign.legends.filter((l) => doc.legends.includes(l.id));
  const out: string[] = [];

  out.push(doc.title.toUpperCase());
  out.push(
    `${doc.format === "vertical" ? "Vertical" : "Horizontal"} ${label} video, ${w}×${h}, about ${fmtSeconds(totalSeconds(doc.shots))}, ${doc.shots.length} shots. Each shot is its own clip, cut together in order.`,
  );
  if (doc.intro) out.push(stripComments(doc.intro));

  if (look?.body) out.push("LOOK AND FEEL", stripComments(look.body));

  const characters = [...legends.map((l) => ({ name: l.short, look: l.look })), ...doc.cast];
  if (characters.length) {
    out.push(
      "CHARACTERS\nUse these exact descriptions every time the character appears.",
      characters.map((c) => `- ${c.name}: ${c.look ?? "(no description yet)"}`).join("\n"),
    );
  }
  const refs = legends.flatMap((l) => l.refs.map((r) => `- ${r.file}: ${l.short}, ${r.use}`));
  if (refs.length) out.push("REFERENCE IMAGES\nAttach these for the legends' identity and wardrobe.", refs.join("\n"));
  if (doc.sets.length) out.push("SETS", doc.sets.map((s) => `- ${s.name}: ${s.look}`).join("\n"));

  out.push("SHOTS");
  for (const shot of doc.shots) {
    const head = `Shot ${shot.n} (${fmtSeconds(shot.seconds)})${shot.endCard ? ": END CARD" : ""}`;
    if (shot.endCard) {
      const card = [doc.endCard, brief?.tagline, brief?.signoff, brief?.url].filter(Boolean);
      out.push(
        [
          head,
          shot.camera && `Camera: ${shot.camera}`,
          shot.action && `Action: ${shot.action}`,
          `On screen, in order: ${card.map((c) => `"${c}"`).join(" / ")}`,
          `Set in Massive's type on a near-black background with a coral accent.`,
          shot.lines.length > 0 && `Dialogue: ${dialogue(shot)}`,
          shot.sound && `Sound: ${shot.sound}`,
        ]
          .filter(Boolean)
          .join("\n"),
      );
      continue;
    }
    out.push(
      [
        head,
        `Visual: ${shot.visual}`,
        shot.camera && `Camera: ${shot.camera}`,
        shot.action && `Action: ${shot.action}`,
        shot.screen && `Screen: ${shot.screen}`,
        shot.lines.length > 0 && `Dialogue: ${dialogue(shot)}`,
        shot.sound && `Sound: ${shot.sound}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return out.join("\n\n");
}
