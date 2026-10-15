import { createContext, useContext, useState } from "react";
import { Label } from "@/shared/components/ui/label";
import { Segmented } from "./DesignPanel";

type Version = "new" | "legacy";

const ToolVersionContext = createContext<{ version: Version; setVersion: (v: Version) => void } | null>(null);

const VERSIONS: { id: Version; label: string }[] = [
  { id: "new", label: "New" },
  { id: "legacy", label: "Legacy" },
];

/**
 * Serves a tool's current app and its pre-revamp legacy app from the same URL.
 * The choice lives in state only, so links (?e= …) never change; switching
 * remounts the other app, which loads ?e= again if it's still in the address.
 */
export function VersionedTool({
  newApp: NewApp,
  legacyApp: LegacyApp,
  legacyWhen,
}: {
  newApp: React.ComponentType;
  legacyApp: React.ComponentType;
  /** Opens in Legacy when the query asks for something only Legacy understands. */
  legacyWhen?: (params: URLSearchParams) => boolean;
}) {
  const [version, setVersion] = useState<Version>(() =>
    legacyWhen?.(new URLSearchParams(window.location.search)) ? "legacy" : "new",
  );
  return (
    <ToolVersionContext.Provider value={{ version, setVersion }}>
      {version === "legacy" ? <LegacyApp /> : <NewApp />}
    </ToolVersionContext.Provider>
  );
}

/**
 * New | Legacy switch for a VersionedTool's sidebar; renders nothing outside one.
 * Switching unmounts the app, so `confirmLeave` can stop it (unsaved edits).
 */
export function VersionSwitch({ confirmLeave }: { confirmLeave?: () => boolean }) {
  const ctx = useContext(ToolVersionContext);
  if (!ctx) return null;
  const change = (v: Version) => {
    if (v !== ctx.version && (!confirmLeave || confirmLeave())) ctx.setVersion(v);
  };
  return (
    <div className="p-4 space-y-2 border-b border-border-subtle shrink-0">
      <Label className="text-xs font-medium text-text-dim uppercase tracking-wide">Version</Label>
      <Segmented options={VERSIONS} value={ctx.version} onChange={change} />
      {ctx.version === "legacy" && (
        <p className="text-xs text-text-dim">The pre-September editor: manual columns, drag-and-drop, TSV export.</p>
      )}
    </div>
  );
}
