import { ImageSquare, Warning } from "@phosphor-icons/react";
import { photoUrl } from "../content";
import type { Campaign, Post } from "../types";
import { ImageButton } from "./Lightbox";
import { Markdown } from "./Markdown";
import { CopyPrompt } from "./PhotoGrid";
import { StatusControl } from "./pills";

/** Where each photo sits: one fills the frame, two split it, three put the first large on the left. */
const LAYOUT: Record<number, { grid: string; cells: string[] }> = {
  1: { grid: "grid-cols-1", cells: [""] },
  2: { grid: "grid-cols-2", cells: ["", ""] },
  3: { grid: "grid-cols-3 grid-rows-2", cells: ["col-span-2 row-span-2", "", ""] },
};
const FOUR_PLUS = { grid: "grid-cols-2 grid-rows-2", cells: ["", "", "", ""] };

function PostImages({ campaign, post }: { campaign: string; post: Post }) {
  if (!post.images.length) {
    return (
      <div className="flex aspect-[3/2] flex-col items-center justify-center gap-2 bg-surface-2 text-text-dim/60">
        <ImageSquare size={32} weight="thin" />
        <span className="font-mono text-[11px]">No images yet</span>
      </div>
    );
  }
  // Past four, the grid shows the first four.
  const { grid, cells } = LAYOUT[post.images.length] ?? FOUR_PLUS;
  return (
    <div className={`grid aspect-[3/2] gap-0.5 bg-bg ${grid}`}>
      {post.images.slice(0, cells.length).map((file, i) => (
        <ImageButton
          key={file}
          src={photoUrl(campaign, file)}
          alt={`${post.title}, photo ${i + 1}`}
          caption={file}
          title={`Open ${file}`}
          className={`min-h-0 overflow-hidden ${cells[i]}`}
        >
          <img
            src={photoUrl(campaign, file)}
            alt={`${post.title}, photo ${i + 1}`}
            loading="lazy"
            className="h-full w-full bg-surface-2 object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
        </ImageButton>
      ))}
    </div>
  );
}

/** One post as it would appear in a feed: the company, the copy, then the photos. */
function PostCard({ campaign, post }: { campaign: string; post: Post }) {
  return (
    <article className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <img src="/favicon.png" alt="" className="h-10 w-10 rounded-full border border-border-subtle bg-bg p-2" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">Massive</p>
          <p className="truncate font-mono text-[11px] text-text-dim">{post.title}</p>
        </div>
        <CopyPrompt text={post.text} label="Copy text" title="Copy the post's text, line breaks and all" />
      </div>
      <p className="whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-text-primary">{post.text}</p>
      <PostImages campaign={campaign} post={post} />
    </article>
  );
}

/** The page a campaign opens on: its social posts, from `content/<campaign>/posts.md`. */
export function PostsPage({ campaign }: { campaign: Campaign }) {
  const doc = campaign.posts;
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-text-dim">
          Social posts · {doc?.path ?? campaign.id}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 flex-1 text-2xl md:text-3xl">{campaign.title}</h1>
          {doc && <StatusControl doc={doc} />}
        </div>
        {doc?.intro && <Markdown>{doc.intro}</Markdown>}
      </header>

      {doc && doc.warnings.length > 0 && (
        <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
          <Warning size={16} weight="fill" className="mt-px shrink-0 text-amber-400" />
          <ul className="space-y-1">
            {doc.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {doc?.posts.length ? (
        doc.posts.map((post) => <PostCard key={post.title} campaign={campaign.id} post={post} />)
      ) : (
        <p className="rounded-xl border border-dashed border-border-subtle p-6 text-sm leading-relaxed text-text-dim">
          No posts yet. Add <span className="font-mono text-text-primary">content/{campaign.id}/posts.md</span> with{" "}
          <span className="font-mono text-text-primary">kind: posts</span> and one <span className="font-mono text-text-primary">##</span>{" "}
          section per post: an <span className="font-mono text-text-primary">Images:</span> line naming its photos, then the copy.
        </p>
      )}
    </div>
  );
}
