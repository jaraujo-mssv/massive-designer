import { useEffect, useMemo, useRef } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/shared/components/ui/popover";

interface EditPopoverProps {
  /** The clicked pill or tile (or sidebar button); null closes the popover. */
  anchor: HTMLElement | null;
  /** Esc: close without applying. */
  onCancel: () => void;
  /** A form whose submit applies the edit and closes (or shows an error and stays open). */
  children: React.ReactNode;
}

/**
 * Edits one canvas item in place. The popover is portalled to <body>, outside
 * the scaled export area, so it never lands in the JPG, and Radix anchors it
 * from the item's on-screen rect, so the preview's scale needs no maths.
 *
 * Enter submits the form inside; clicking away submits it too; Esc cancels.
 * While open, the anchor gets `data-editing` so it keeps its outline.
 */
export function EditPopover({ anchor, onCancel, children }: EditPopoverProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const virtualRef = useMemo(() => ({ current: anchor }), [anchor]);

  useEffect(() => {
    if (!anchor) return;
    anchor.setAttribute("data-editing", "");
    return () => anchor.removeAttribute("data-editing");
  }, [anchor]);

  return (
    <Popover
      open={anchor !== null}
      // Click-away: apply, the same as Enter. The form closes the popover itself.
      onOpenChange={(open) => {
        if (!open) contentRef.current?.querySelector("form")?.requestSubmit();
      }}
    >
      <PopoverAnchor virtualRef={virtualRef as React.RefObject<HTMLElement>} />
      <PopoverContent
        side="bottom"
        align="center"
        collisionPadding={12}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onCancel();
        }}
        className="w-80 p-3 bg-surface text-text-primary border-border-subtle shadow-2xl"
      >
        {/* React 18 function components drop `ref`, so hold the form from inside. */}
        <div ref={contentRef}>{children}</div>
      </PopoverContent>
    </Popover>
  );
}
