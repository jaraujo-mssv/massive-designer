import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Notebook } from "@phosphor-icons/react";
import { Toaster } from "sonner";
import { SidebarLayout } from "@/shared/components/SidebarLayout";
import { useIsMobile } from "@/shared/components/ui/use-mobile";
import { CampaignOverview } from "./components/CampaignOverview";
import { DocList } from "./components/DocList";
import { DocPane } from "./components/DocPane";
import { SCRIPT_VIEWS, type ScriptView } from "./constants";
import { CAMPAIGNS, findCampaign, findDoc } from "./content";

/**
 * Campaign content (scripts, legends, photo shotlists, landing pages) from the
 * markdown under content/. URL: `?doc=<campaign>/<id>&view=script|animatic`,
 * or `?c=<campaign>` for a campaign's overview.
 */
export default function App() {
  const [params, setParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const main = useRef<HTMLDivElement>(null);

  const doc = findDoc(params.get("doc"));
  const campaign = (doc && findCampaign(doc.campaign)) ?? findCampaign(params.get("c")) ?? CAMPAIGNS[0] ?? null;
  const view: ScriptView = params.get("view") === "animatic" ? "animatic" : "script";

  // Merge, never replace, so picking a doc keeps ?view=.
  const update = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    setParams(p);
  };

  const open = (key: string | null) => {
    update(key ? { doc: key, c: null } : { doc: null, c: campaign?.id ?? null });
    setDrawerOpen(false);
  };

  // A new doc starts at the top.
  useEffect(() => main.current?.scrollTo({ top: 0 }), [doc?.key]);

  if (!campaign) {
    return (
      <p className="p-4 text-sm text-text-dim md:p-8">
        No content yet. Add markdown under <span className="font-mono text-text-primary">content/&lt;campaign&gt;/</span>.
      </p>
    );
  }

  const list = (
    <DocList
      campaign={campaign}
      campaigns={CAMPAIGNS}
      selectedKey={doc?.key ?? null}
      onSelect={open}
      onCampaign={(id) => {
        update({ doc: null, c: id });
        setDrawerOpen(false);
      }}
    />
  );

  const viewSwitch =
    doc?.kind === "script" ? (
      <div className="flex rounded-lg border border-border-subtle bg-surface p-0.5">
        {SCRIPT_VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => update({ view: v.id })}
            className={`flex-1 rounded-md px-3 py-1 font-mono text-xs transition-colors ${
              view === v.id ? "bg-surface-2 text-brand-light" : "text-text-dim hover:text-text-primary"
            } ${isMobile ? "py-2" : ""}`}
          >
            {v.label}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <>
      <Toaster position="top-center" richColors />
      <SidebarLayout
        sidebar={
          <div className="flex w-80 shrink-0 flex-col border-r border-border-subtle bg-surface">
            <div className="flex shrink-0 items-center border-b border-border-subtle px-4 py-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-text-dim">Content</span>
            </div>
            {list}
          </div>
        }
        drawerTitle="Content"
        drawerContent={list}
        drawerOpen={drawerOpen}
        onDrawerOpenChange={setDrawerOpen}
        editLabel="Library"
        editIcon={Notebook}
        barAction={viewSwitch ?? undefined}
      >
        <div ref={main} className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {doc ? (
            <DocPane doc={doc} campaign={campaign} view={view} viewSwitch={isMobile ? null : viewSwitch} onOpen={open} />
          ) : (
            <CampaignOverview campaign={campaign} onOpen={open} />
          )}
        </div>
      </SidebarLayout>
    </>
  );
}
