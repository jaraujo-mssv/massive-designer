import { useEffect, useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import { useRemembered } from "@/shared/canvas/remembered";
import { saveFile } from "@/shared/utils/saveFile";
import { GROUPS, MIX, MIX_BACKGROUND, PICKS, swatchById, swatchesFor, type Pick, type Swatch } from "./palette";

/**
 * The team's faces, cut out of their backdrops and set on pastel grounds. The cut-outs and team.json
 * come from `npm run team-photo:cutouts` (the photo picked for each teammate in
 * content/team-shoot/photos.md, or a better one from its originals/profiles/), committed in
 * public/team-photo/.
 */
interface Person {
  id: string;
  /** Missing for a photo nobody has named yet. */
  name?: string;
  /** Missing for a placeholder. */
  src?: string;
  /** A teammate with no photo yet. */
  placeholder?: true;
}

type TeamState = { status: "loading" } | { status: "error"; error: string } | { status: "ready"; people: Person[] };

/** The side of a downloaded JPG, as the cut-outs. */
const SIZE = 1080;

/** The grid's columns by width: 2 on phones, then 3, 4 and 6 from Tailwind's sm, lg and xl. */
const WIDER = ["(min-width: 40rem)", "(min-width: 64rem)", "(min-width: 80rem)"];
const COLUMNS = [2, 3, 4, 6];
const columnsNow = () => COLUMNS[WIDER.filter((q) => window.matchMedia(q).matches).length];

/** How many columns the grid has now. Mix needs it to keep neighbours apart. */
function useColumns(): number {
  const [cols, setCols] = useState(columnsNow);
  useEffect(() => {
    const queries = WIDER.map((q) => window.matchMedia(q));
    const update = () => setCols(columnsNow());
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, []);
  return cols;
}

function useTeam(): TeamState {
  const [state, setState] = useState<TeamState>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    fetch("/team-photo/team.json", { cache: "no-cache" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const people = (await res.json()) as Person[];
        if (!cancelled) setState({ status: "ready", people });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: "error", error: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** The face on its colour as a square JPG, drawn the same way the tile shows it. */
async function downloadTile(person: Person & { src: string }, swatch: Swatch) {
  const img = new Image();
  img.src = person.src;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = swatch.hex;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (blob) await saveFile(blob, `${slug(person.name ?? person.id)}.jpg`);
}

function SwatchButton({
  label,
  background,
  checked,
  onPick,
}: {
  label: string;
  background: string;
  checked: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={onPick}
      className={`size-8 shrink-0 rounded-full border border-black/10 transition-shadow focus-visible:outline-none ${
        checked
          ? "ring-2 ring-brand-light ring-offset-2 ring-offset-bg"
          : "hover:ring-2 hover:ring-text-dim/40 hover:ring-offset-2 hover:ring-offset-bg focus-visible:ring-2 focus-visible:ring-text-mid focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      }`}
      style={{ background }}
    />
  );
}

function BackgroundPicker({ pick, onPick }: { pick: Pick; onPick: (pick: Pick) => void }) {
  const current = pick === MIX ? "Mix" : (swatchById(pick)?.name ?? "Mix");
  return (
    <div role="radiogroup" aria-label="Background colour" className="space-y-3">
      <p className="text-sm text-text-mid">
        Background: <span className="font-semibold text-text-primary">{current}</span>
      </p>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="space-y-1.5">
          <p className="text-xs text-text-dim">Mix</p>
          <div className="flex">
            <SwatchButton label="Mix" background={MIX_BACKGROUND} checked={pick === MIX} onPick={() => onPick(MIX)} />
          </div>
        </div>
        {GROUPS.map((group) => (
          <div key={group.name} className="space-y-1.5">
            <p className="text-xs text-text-dim">{group.name}</p>
            <div className="flex gap-2">
              {group.swatches.map((s) => (
                <SwatchButton key={s.id} label={s.name} background={s.hex} checked={pick === s.id} onPick={() => onPick(s.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** "Mohie Eddine Lakhdar" → ML. */
const initials = (name = "") => {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0]?.[0] ?? "");
};

/** A teammate with no photo yet: their initials on the tile's colour. */
function Placeholder({ name }: { name?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${name ?? "Teammate"}: no photo yet`}
      className="block size-full font-display"
    >
      <text
        x="50"
        y="47"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="30"
        fontWeight="800"
        fill="rgba(23, 22, 21, 0.3)"
      >
        {initials(name).toUpperCase()}
      </text>
      <text x="50" y="88" textAnchor="middle" fontSize="6.5" fontWeight="500" fill="rgba(23, 22, 21, 0.45)">
        No photo yet
      </text>
    </svg>
  );
}

function Tile({ person, swatch }: { person: Person; swatch: Swatch }) {
  const [saving, setSaving] = useState(false);
  const { src } = person;
  const save = async () => {
    if (!src) return;
    setSaving(true);
    try {
      await downloadTile({ ...person, src }, swatch);
    } finally {
      setSaving(false);
    }
  };
  return (
    <figure className="space-y-2">
      <div className="group relative aspect-square overflow-hidden rounded-xl" style={{ backgroundColor: swatch.hex }}>
        {src ? (
          <img src={src} alt={person.name ?? ""} title={person.name} loading="lazy" className="block size-full" />
        ) : (
          <Placeholder name={person.name} />
        )}
        {src && (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            aria-label={`Download ${person.name ?? "this photo"} on ${swatch.name}`}
            title="Download JPG"
            className="absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-60 [@media(hover:none)]:opacity-100"
          >
            <DownloadSimple size={18} weight="bold" />
          </button>
        )}
      </div>
      <figcaption className="min-h-5 truncate text-sm text-text-mid">{person.name}</figcaption>
    </figure>
  );
}

export default function App() {
  const team = useTeam();
  const [pick, setPick] = useRemembered<Pick>("team-photo.bg", MIX, PICKS);
  const cols = useColumns();
  const people = team.status === "ready" ? team.people : [];
  const swatches = swatchesFor(
    pick,
    people.map((p) => p.name),
    cols,
  );

  return (
    <div className="h-full overflow-y-auto bg-bg">
      <header className="z-10 space-y-4 border-b border-border-subtle bg-bg/95 px-4 py-4 backdrop-blur md:sticky md:top-0 md:px-6 md:py-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl">Team photo</h1>
          <p className="max-w-3xl text-sm text-text-dim">
            The team's portraits, cut out of the backdrop. Pick a background, and download any face as a 1080 px
            JPG.
          </p>
        </div>
        <BackgroundPicker pick={pick} onPick={setPick} />
      </header>
      {team.status === "loading" && <p className="px-4 py-6 text-sm text-text-dim md:px-6">Loading…</p>}
      {team.status === "error" && (
        <p className="px-4 py-6 text-sm text-text-dim md:px-6">Couldn't load the team ({team.error}).</p>
      )}
      {team.status === "ready" && (
        <div className="grid gap-4 px-4 py-6 md:px-6" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {people.map((person, i) => (
            <Tile key={person.id} person={person} swatch={swatches[i]} />
          ))}
        </div>
      )}
    </div>
  );
}
