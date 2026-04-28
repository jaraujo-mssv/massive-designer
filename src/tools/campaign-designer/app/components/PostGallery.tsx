import { useRef, useEffect } from 'react';
import { Campaign, Post } from '../types';
import { PostPair } from './PostPair';

interface Props {
  campaign: Campaign;
  selectedPostId: string | null;
  onSelectPost: (post: Post) => void;
}

export function PostGallery({ campaign, selectedPostId, onSelectPost }: Props) {
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedPostId && postRefs.current[selectedPostId]) {
      postRefs.current[selectedPostId]!.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedPostId]);

  // On initial load, scroll to the post matching the URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = postRefs.current[hash];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
        backgroundImage: `
          linear-gradient(rgba(250, 244, 236, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(250, 244, 236, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
        backgroundColor: '#1a1928',
      }}
    >
      {/* Campaign header */}
      <div style={{ width: '100%', maxWidth: 1100, paddingBottom: 8, borderBottom: '1px solid rgba(250,244,236,0.06)' }}>
        <h2
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 22,
            fontWeight: 700,
            color: 'rgba(250,244,236,0.9)',
            margin: 0,
          }}
        >
          {campaign.name}
        </h2>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: 'rgba(250,244,236,0.3)',
            margin: '6px 0 0',
          }}
        >
          {campaign.posts.length} posts · Click a post to edit
        </p>
      </div>

      {/* Post pairs */}
      {campaign.posts.map((post) => (
        <div
          key={post.id}
          id={post.id}
          ref={(el) => { postRefs.current[post.id] = el; }}
          style={{ width: '100%', maxWidth: 1100 }}
        >
          <PostPair
            post={post}
            campaign={campaign}
            isSelected={selectedPostId === post.id}
            onClick={() => onSelectPost(post)}
          />
        </div>
      ))}
    </div>
  );
}
