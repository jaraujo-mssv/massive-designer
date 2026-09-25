import { Copy, Terminal } from "lucide-react";
import { toast } from "sonner";

export function RenderCommand({ id }: { id: string }) {
  const command = `npm run video:render ${id}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      toast.success("Render command copied", { description: "Run it in the repo (Node 22+, `nvm use`)." });
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  return (
    <button
      onClick={copy}
      title="Copy render command"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-2 text-xs font-mono text-text-mid hover:border-brand hover:text-brand-light transition-colors"
    >
      <Terminal className="w-3.5 h-3.5" />
      <span className="hidden lg:inline">{command}</span>
      <span className="lg:hidden">Render</span>
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}
