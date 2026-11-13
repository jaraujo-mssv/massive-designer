import { useEffect, useState } from "react";
import { AppWindow } from "@phosphor-icons/react";
import { Segmented } from "@/shared/canvas/DesignPanel";
import { SidebarWarning, sidebarHeadingClass } from "@/shared/components/SidebarLayout";
import { useStored } from "../hooks";
import { geminiUrl, openWindow, screenLayout, tiles, type Arrangement, type Rect, type ScreenLayout } from "../windows";

interface Settings {
  count: number;
  arrangement: Arrangement;
  /** Which signed-in Google account Gemini opens in: 0 is the first. */
  account: number;
}

const DEFAULTS: Settings = { count: 3, arrangement: "columns", account: 0 };
const COUNTS = [
  { id: "2", label: "2" },
  { id: "3", label: "3" },
  { id: "4", label: "4" },
];
const ARRANGEMENTS: { id: Arrangement; label: string }[] = [
  { id: "columns", label: "Side by side" },
  { id: "grid", label: "Two rows" },
];
const ACCOUNTS = [
  { id: "0", label: "1st" },
  { id: "1", label: "2nd" },
  { id: "2", label: "3rd" },
];

const readSettings = (raw: unknown): Settings => {
  const s = { ...DEFAULTS, ...(raw as Partial<Settings>) };
  return {
    count: [2, 3, 4].includes(s.count) ? s.count : DEFAULTS.count,
    arrangement: s.arrangement === "grid" ? "grid" : "columns",
    account: [0, 1, 2].includes(s.account) ? s.account : 0,
  };
};

const same = (a: ScreenLayout, b: ScreenLayout) => JSON.stringify(a) === JSON.stringify(b);

/** Where this window sits on its screen. Moving a window fires no event, so it's checked every second. */
function useScreenLayout() {
  const [layout, setLayout] = useState(screenLayout);
  useEffect(() => {
    const update = () => setLayout((prev) => {
      const next = screenLayout();
      return same(prev, next) ? prev : next;
    });
    const timer = setInterval(update, 1000);
    window.addEventListener("resize", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", update);
    };
  }, []);
  return layout;
}

/** The screen in miniature: this window, and where each Gemini window will open. */
function ScreenPreview({ layout, rects }: { layout: ScreenLayout; rects: Rect[] }) {
  const { screen } = layout;
  const place = (r: Rect) => {
    const left = Math.max(r.left, screen.left);
    const top = Math.max(r.top, screen.top);
    const right = Math.min(r.left + r.width, screen.left + screen.width);
    const bottom = Math.min(r.top + r.height, screen.top + screen.height);
    return {
      left: `${((left - screen.left) / screen.width) * 100}%`,
      top: `${((top - screen.top) / screen.height) * 100}%`,
      width: `${(Math.max(0, right - left) / screen.width) * 100}%`,
      height: `${(Math.max(0, bottom - top) / screen.height) * 100}%`,
    };
  };
  return (
    <div
      aria-hidden
      className="relative mx-auto h-28 max-w-full overflow-hidden rounded-md border border-border-subtle bg-bg"
      style={{ aspectRatio: `${screen.width} / ${screen.height}` }}
    >
      {!layout.full && (
        <div
          className="absolute flex items-center justify-center rounded-sm border border-border-subtle bg-surface-2 text-[10px] text-text-dim"
          style={place(layout.self)}
        >
          This tab
        </div>
      )}
      {rects.map((r, i) => (
        <div key={i} className="absolute p-0.5" style={place(r)}>
          <div className="flex h-full items-center justify-center rounded-sm border border-brand/60 bg-brand/10 text-[11px] font-semibold text-brand-light">
            {i + 1}
          </div>
        </div>
      ))}
    </div>
  );
}

export function WindowsPanel() {
  const [settings, setSettings] = useStored("gemini:windows", DEFAULTS, readSettings);
  const layout = useScreenLayout();
  const rects = tiles(settings.count, settings.arrangement, layout.area);
  // The windows the browser blocked last time, with where each should have gone.
  const [blocked, setBlocked] = useState<{ index: number; rect: Rect }[]>([]);
  const url = geminiUrl(settings.account);

  const openAll = () => {
    const fresh = tiles(settings.count, settings.arrangement, screenLayout().area);
    setBlocked(fresh.flatMap((rect, index) => (openWindow(url, rect) ? [] : [{ index, rect }])));
  };
  const openOne = (index: number, rect: Rect) => {
    if (openWindow(url, rect)) setBlocked((b) => b.filter((x) => x.index !== index));
  };

  const set = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <section className="space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
      <div className="space-y-1">
        <h2 className={sidebarHeadingClass}>Gemini windows</h2>
        <p className="text-xs leading-relaxed text-text-dim">
          New Gemini chats, side by side next to this window. Copy the prompt and images from here into each one, then
          paste or drop the results back here to save them.
        </p>
      </div>

      <div className="grid grid-cols-[4.5rem_1fr] items-center gap-x-3 gap-y-2 text-xs text-text-mid">
        <span>Windows</span>
        <Segmented options={COUNTS} value={String(settings.count)} onChange={(v) => set({ count: Number(v) })} />
        <span>Arrange</span>
        <Segmented options={ARRANGEMENTS} value={settings.arrangement} onChange={(v) => set({ arrangement: v })} />
        <span title="The Google account Gemini opens in, in the order you signed in">Account</span>
        <Segmented options={ACCOUNTS} value={String(settings.account)} onChange={(v) => set({ account: Number(v) })} />
      </div>

      <ScreenPreview layout={layout} rects={rects} />
      {layout.full && (
        <p className="text-xs leading-relaxed text-text-dim">
          Make this window narrow and move it to one side of the screen: the Gemini windows then fill the rest, and this
          one stays in view.
        </p>
      )}

      <button
        onClick={openAll}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
      >
        <AppWindow size={16} weight="bold" />
        Open {settings.count} Gemini windows
      </button>

      {blocked.length > 0 && (
        <SidebarWarning>
          <p>
            The browser blocked {blocked.length === 1 ? "one window" : `${blocked.length} windows`}. To open them all in one
            click, use the pop-up icon at the right of the address bar and always allow pop-ups from this site. Or open
            each one:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {blocked.map(({ index, rect }) => (
              <button
                key={index}
                onClick={() => openOne(index, rect)}
                className="rounded-md border border-amber-400/40 px-2 py-1 text-xs text-amber-100 hover:bg-amber-500/15"
              >
                Window {index + 1}
              </button>
            ))}
          </div>
        </SidebarWarning>
      )}
    </section>
  );
}
