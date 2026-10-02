import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Markdown in the Massive tokens. HTML comments (the `<!-- block: … -->`
 * directives) are raw HTML, which react-markdown drops, so they never show.
 */
const components: Components = {
  h1: ({ children }) => <h1 className="mt-6 mb-3 text-2xl text-text-primary first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-8 mb-3 text-lg text-text-primary first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-6 mb-2 text-base text-text-primary first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="my-3 leading-relaxed text-text-mid first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-brand-light underline-offset-2 hover:underline">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-5 text-text-mid marker:text-text-dim">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-5 text-text-mid marker:text-text-dim">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-brand pl-4 text-text-primary [&_p]:text-text-primary">{children}</blockquote>
  ),
  code: ({ children }) => <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em]">{children}</code>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-border-subtle">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border-subtle bg-surface px-3 py-2 text-left font-mono text-[11px] font-semibold uppercase tracking-wider text-text-dim">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-border-subtle px-3 py-2 align-top text-text-mid">{children}</td>,
  hr: () => <hr className="my-6 border-border-subtle" />,
};

export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`text-sm ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
