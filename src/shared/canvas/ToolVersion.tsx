import { createContext, useContext, useState } from "react";
import { readRemembered, remember } from "./remembered";

type Version = "new" | "legacy";

const ToolVersionContext = createContext<{ version: Version; setVersion: (v: Version) => void } | null>(null);

const VERSIONS: { id: Version; label: string; hint: string }[] = [
  { id: "new", label: "New", hint: "Automatic layout, themes and click-to-edit" },
  { id: "legacy", label: "Legacy", hint: "The pre-September editor: manual columns, drag-and-drop, TSV export" },
];

/**
 * Serves a tool's current app and its pre-revamp legacy app from the same URL.
 * The choice isn't in the URL, so links (?e= …) never change; switching
 * remounts the other app, which loads ?e= again if it's still in the address.
 * The browser remembers the version last picked (`storageKey`) and opens in it
 * next time.
 */
export function VersionedTool({
  newApp: NewApp,
  legacyApp: LegacyApp,
  defaultVersion = "new",
  legacyWhen,
  storageKey,
}: {
  newApp: React.ComponentType;
  legacyApp: React.ComponentType;
  /** The version a first visit opens in. */
  defaultVersion?: Version;
  /** Opens in Legacy when the query asks for something only Legacy understands (not remembered). */
  legacyWhen?: (params: URLSearchParams) => boolean;
  /** Where the version last picked is remembered, e.g. "market-map.version". */
  storageKey?: string;
}) {
  const [version, setVersionState] = useState<Version>(() => {
    if (legacyWhen?.(new URLSearchParams(window.location.search))) return "legacy";
    return (storageKey && readRemembered(storageKey, ["new", "legacy"] as const)) || defaultVersion;
  });
  const setVersion = (v: Version) => {
    setVersionState(v);
    if (storageKey) remember(storageKey, v);
  };
  return (
    <ToolVersionContext.Provider value={{ version, setVersion }}>
      {version === "legacy" ? <LegacyApp /> : <NewApp />}
    </ToolVersionContext.Provider>
  );
}

/**
 * New | Legacy switch for a VersionedTool; renders nothing outside one. It sits
 * in the top-left corner of the canvas area (which must be position: relative),
 * over the preview but outside the exported image, in the same place in both
 * versions. Switching unmounts the app, so `confirmLeave` can stop it (unsaved edits).
 */
export function VersionSwitch({ confirmLeave }: { confirmLeave?: () => boolean }) {
  const ctx = useContext(ToolVersionContext);
  if (!ctx) return null;
  const change = (v: Version) => {
    if (v !== ctx.version && (!confirmLeave || confirmLeave())) ctx.setVersion(v);
  };
  return (
    <div
      role="group"
      aria-label="Version"
      className="absolute top-3 left-3 z-10 flex gap-0.5 p-0.5 rounded-lg border border-border-subtle bg-surface/85 backdrop-blur-sm shadow-md"
    >
      {VERSIONS.map((v) => (
        <button
          key={v.id}
          title={v.hint}
          aria-pressed={ctx.version === v.id}
          onClick={() => change(v.id)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            ctx.version === v.id ? "bg-brand text-white" : "text-text-dim hover:text-text-primary"
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
