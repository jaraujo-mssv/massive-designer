import { useState } from "react";
import { SlidersHorizontal, Warning, X, type Icon } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/shared/components/ui/drawer";
import { useIsMobile } from "@/shared/components/ui/use-mobile";

export const sidebarButtonClass =
  "w-full flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border-subtle text-text-primary rounded-lg hover:border-brand hover:text-brand-light text-sm transition-colors";
export const sidebarInputClass =
  "w-full px-3 py-2 border border-border-subtle rounded-lg text-sm bg-surface text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand";
export const sidebarHeadingClass = "text-xs font-semibold text-text-dim uppercase tracking-widest";

/** The desktop side column: tool name, scrolling sections, and a pinned footer (Export). */
export function SidebarColumn({
  toolName,
  footer,
  children,
}: {
  toolName: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-96 shrink-0 flex flex-col bg-surface border-r border-border-subtle">
      <div className="flex items-center px-4 py-3 border-b border-border-subtle shrink-0">
        <span className="text-xs font-semibold text-text-dim uppercase tracking-widest font-mono">{toolName}</span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
      {footer && <div className="border-t border-border-subtle p-4 shrink-0 space-y-2">{footer}</div>}
    </div>
  );
}

/**
 * An amber callout for the Export area; `children` can add a toggle or details.
 * The x hides it until it's next shown (it unmounts, e.g. on unload, and comes back).
 */
export function SidebarWarning({ children }: { children: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 leading-relaxed">
      <Warning size={16} weight="fill" className="shrink-0 mt-px text-amber-400" />
      <div className="min-w-0 flex-1 space-y-2">{children}</div>
      <button
        onClick={() => setDismissed(true)}
        title="Close"
        aria-label="Close warning"
        className="shrink-0 self-start -mt-1 -mr-1 p-1 rounded text-amber-200/60 hover:text-amber-100 hover:bg-amber-500/15 transition-colors"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );
}

interface SidebarLayoutProps {
  /** Desktop: the side column, drawn left of the main area. */
  sidebar: React.ReactNode;
  /** Phones: the drawer's title (the tool name). */
  drawerTitle: string;
  /** Phones: what the drawer holds, usually the sidebar's sections. */
  drawerContent: React.ReactNode;
  drawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  /** Phones: label of the bar button that opens the drawer. */
  editLabel?: string;
  editIcon?: Icon;
  /** Phones: a dot on the Edit button, for warnings waiting in the drawer. */
  attention?: boolean;
  /** Phones: the tool's main action, right of Edit in the bottom bar. */
  barAction?: React.ReactNode;
  /** The main area: canvas, preview or editor. */
  children: React.ReactNode;
}

/**
 * Layout of every tool with a sidebar.
 *
 * - Desktop (md and up): the sidebar column, then the main area.
 * - Phones: the main area fills the screen, above a bottom bar with Edit (opens
 *   the drawer) and the tool's main action, so the preview stays as big as it can be.
 */
export function SidebarLayout({
  sidebar,
  drawerTitle,
  drawerContent,
  drawerOpen,
  onDrawerOpenChange,
  editLabel = "Edit",
  editIcon: EditIcon = SlidersHorizontal,
  attention = false,
  barAction,
  children,
}: SidebarLayoutProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <div className="flex h-full overflow-hidden bg-bg">
        {sidebar}
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg">
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>

      <div
        className="shrink-0 flex items-center gap-2 px-3 pt-3 border-t border-border-subtle bg-surface"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={() => onDrawerOpenChange(true)}
          className="relative flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-2 border border-border-subtle text-text-primary rounded-lg text-sm font-medium"
        >
          <EditIcon size={16} weight="fill" />
          {editLabel}
          {attention && (
            <span aria-label="Has warnings" className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
          )}
        </button>
        <div className="flex-1 min-w-0">{barAction}</div>
      </div>

      <Drawer open={drawerOpen} onOpenChange={onDrawerOpenChange}>
        <DrawerContent className="bg-surface border-border-subtle data-[vaul-drawer-direction=bottom]:max-h-[85dvh]">
          <DrawerTitle className="px-4 pt-3 pb-2 text-xs font-semibold text-text-dim uppercase tracking-widest font-mono">
            {drawerTitle}
          </DrawerTitle>
          <DrawerDescription className="sr-only">Settings for {drawerTitle}</DrawerDescription>
          <div
            className="flex-1 min-h-0 overflow-y-auto border-t border-border-subtle"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {drawerContent}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
