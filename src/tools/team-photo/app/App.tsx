import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Circle, DownloadSimple, Square } from "@phosphor-icons/react";
import { Segmented } from "@/shared/canvas/DesignPanel";
import { useRemembered } from "@/shared/canvas/remembered";
import { SidebarColumn, SidebarLayout, sidebarHeadingClass } from "@/shared/components/SidebarLayout";
import { saveFile } from "@/shared/utils/saveFile";
import { GROUPS, MIX, MIX_BACKGROUND, PICKS, swatchById, swatchesFor, type Pick } from "./palette";
import { THEMES, themeById } from "./themes";

/**
 * The team's faces, cut out of their backdrops and set on pastel grounds or themed backgrounds. The
 * cut-outs and team.json come from `npm run team-photo:cutouts` (the photo picked for each teammate in
 * content/team-shoot/photos.md, or a better one from its originals/profiles/), committed in
 * public/team-photo/. The options sit in a sidebar (a drawer on phones), the faces right of it.
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

/** What's behind one face: a colour, and a theme's SVG over it. */
interface Ground {
  name: string;
  hex: string;
  image?: string;
}

/** The side of a downloaded JPG, as the cut-outs. */
const SIZE = 1080;

const ALL_PICKS: readonly Pick[] = [...PICKS, ...THEMES.map((t) => t.id)];

type Crop = "off" | "circle";
const CROPS: readonly Crop[] = ["off", "circle"];

/**
 * The gallery's columns by its own width, since the sidebar takes part of the window: 2, 3, 4 or 6,
 * the counts the Mix and its off-white pins were checked at (palette.ts).
 */
const COLUMNS = [
  { from: 1240, cols: 6 },
  { from: 800, cols: 4 },
  { from: 520, cols: 3 },
  { from: 0, cols: 2 },
];

function useColumns(ref: RefObject<HTMLElement | null>): number {
  const [cols, setCols] = useState(4);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setCols(COLUMNS.find((c) => el.clientWidth >= c.from)!.cols);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
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

/** Each tile's ground, in order: the Mix's colours, one colour for all, or one theme for all. */
function groundsFor(pick: Pick, names: (string | undefined)[], cols: number): Ground[] {
  const theme = themeById(pick);
  if (theme) return names.map(() => ({ name: theme.name, hex: theme.hex, image: theme.src }));
  return swatchesFor(pick, names, cols);
}

/** What the sidebar says is picked. */
function pickName(pick: Pick): string {
  if (pick === MIX) return "Mix";
  return themeById(pick)?.name ?? swatchById(pick)?.name ?? "Mix";
}

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

/** The face on its ground as a square JPG, drawn the same way the tile shows it (always square). */
async function downloadTile(person: Person & { src: string }, ground: Ground) {
  const [face, theme] = await Promise.all([loadImage(person.src), ground.image ? loadImage(ground.image) : null]);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = ground.hex;
  ctx.fillRect(0, 0, SIZE, SIZE);
  if (theme) ctx.drawImage(theme, 0, 0, SIZE, SIZE);
  ctx.drawImage(face, 0, 0, SIZE, SIZE);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (blob) await saveFile(blob, `${slug(person.name ?? person.id)}.jpg`);
}

const ring = (checked: boolean) =>
  checked
    ? "ring-2 ring-brand-light ring-offset-2 ring-offset-surface"
    : "hover:ring-2 hover:ring-text-dim/40 hover:ring-offset-2 hover:ring-offset-surface focus-visible:ring-2 focus-visible:ring-text-mid focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

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
      className={`size-8 shrink-0 rounded-full border border-black/10 transition-shadow focus-visible:outline-none ${ring(checked)}`}
      style={{ background }}
    />
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-text-dim">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function BackgroundSection({ pick, onPick }: { pick: Pick; onPick: (pick: Pick) => void }) {
  return (
    <section className="space-y-4 border-b border-border-subtle p-4">
      <div className="space-y-1">
        <h3 className={sidebarHeadingClass}>Background</h3>
        <p className="text-sm text-text-mid">
          <span className="font-semibold text-text-primary">{pickName(pick)}</span>
        </p>
      </div>
      <div role="radiogroup" aria-label="Background" className="space-y-4">
        <div className="space-y-3">
          <Row label="Mix">
            <SwatchButton label="Mix" background={MIX_BACKGROUND} checked={pick === MIX} onPick={() => onPick(MIX)} />
            <span className="text-xs text-text-dim">Every face its own colour</span>
          </Row>
          {GROUPS.map((group) => (
            <Row key={group.name} label={group.name}>
              {group.swatches.map((s) => (
                <SwatchButton key={s.id} label={s.name} background={s.hex} checked={pick === s.id} onPick={() => onPick(s.id)} />
              ))}
            </Row>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs text-text-dim">Themes</p>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => {
              const checked = pick === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onPick(t.id)}
                  className="group space-y-1.5 text-left focus-visible:outline-none"
                >
                  <img
                    src={t.src}
                    alt=""
                    className={`block aspect-square w-full rounded-lg transition-shadow ${ring(checked)}`}
                    style={{ backgroundColor: t.hex }}
                  />
                  <span className={`block text-xs ${checked ? "text-text-primary" : "text-text-mid group-hover:text-text-primary"}`}>
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function CropSection({ crop, onCrop }: { crop: Crop; onCrop: (crop: Crop) => void }) {
  return (
    <section className="space-y-3 p-4">
      <h3 className={sidebarHeadingClass}>Crop preview</h3>
      <Segmented
        options={[
          { id: "off", label: "Off", icon: Square },
          { id: "circle", label: "Circle", icon: Circle },
        ]}
        value={crop}
        onChange={onCrop}
      />
      <p className="text-xs text-text-dim">
        Circle shows each face as LinkedIn and Google crop a profile photo. Downloads stay square.
      </p>
    </section>
  );
}

/** "Mohie Eddine Lakhdar" → ML. */
const initials = (name = "") => {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0]?.[0] ?? "");
};

/** A teammate with no photo yet: their initials on the tile's ground. */
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

function Tile({ person, ground, circle }: { person: Person; ground: Ground; circle: boolean }) {
  const [saving, setSaving] = useState(false);
  const { src } = person;
  const save = async () => {
    if (!src) return;
    setSaving(true);
    try {
      await downloadTile({ ...person, src }, ground);
    } finally {
      setSaving(false);
    }
  };
  return (
    <figure className="space-y-2">
      {/* The ground and the face are clipped (to the circle, in the crop preview); the button isn't, so it stays in the corner. */}
      <div className="group relative aspect-square">
        <div
          className={`size-full overflow-hidden bg-cover bg-center ${circle ? "rounded-full" : "rounded-xl"}`}
          style={{ backgroundColor: ground.hex, backgroundImage: ground.image ? `url(${ground.image})` : undefined }}
        >
          {src ? (
            <img src={src} alt={person.name ?? ""} title={person.name} loading="lazy" className="block size-full" />
          ) : (
            <Placeholder name={person.name} />
          )}
        </div>
        {src && (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            aria-label={`Download ${person.name ?? "this photo"} on ${ground.name}`}
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
  const [pick, setPick] = useRemembered<Pick>("team-photo.bg", MIX, ALL_PICKS);
  const [crop, setCrop] = useRemembered<Crop>("team-photo.crop", "off", CROPS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const gallery = useRef<HTMLDivElement>(null);
  const cols = useColumns(gallery);
  const people = team.status === "ready" ? team.people : [];
  const grounds = groundsFor(
    pick,
    people.map((p) => p.name),
    cols,
  );

  const sections = (
    <>
      <p className="border-b border-border-subtle p-4 text-sm text-text-dim">
        The team's portraits, cut out of the backdrop. Pick a background, and download any face as a 1080 px JPG.
      </p>
      <BackgroundSection pick={pick} onPick={setPick} />
      <CropSection crop={crop} onCrop={setCrop} />
    </>
  );

  return (
    <SidebarLayout
      sidebar={<SidebarColumn toolName="Team Photo">{sections}</SidebarColumn>}
      drawerTitle="Team Photo"
      drawerContent={sections}
      drawerOpen={drawerOpen}
      onDrawerOpenChange={setDrawerOpen}
      editLabel="Background"
      editFullWidth
    >
      <div ref={gallery} className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {team.status === "loading" && <p className="px-4 py-6 text-sm text-text-dim md:px-6">Loading…</p>}
        {team.status === "error" && (
          <p className="px-4 py-6 text-sm text-text-dim md:px-6">Couldn't load the team ({team.error}).</p>
        )}
        {team.status === "ready" && (
          <div className="grid gap-4 px-4 py-6 md:px-6" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {people.map((person, i) => (
              <Tile key={person.id} person={person} ground={grounds[i]} circle={crop === "circle"} />
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
