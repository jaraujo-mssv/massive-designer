import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Link2, Check } from 'lucide-react';
import { Campaign, CampaignTheme, Post, PostTemplateType, SidebarTab } from '../types';
import { FONT_OPTIONS } from '../constants';

interface Props {
  campaign: Campaign;
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  selectedPostId: string | null;
  onSelectPost: (post: Post) => void;
  onUpdateTheme: (theme: Partial<CampaignTheme>) => void;
}

const TEMPLATE_ORDER: PostTemplateType[] = [
  'hero-image',
  'blog-announcement',
  'feature-announcement',
  'quote',
  'terminal',
  'logo-pair',
  'logo-showcase',
  'geo-comparison',
];

const TEMPLATE_LABELS: Record<PostTemplateType, string> = {
  'hero-image':           'Hero Image',
  'blog-announcement':    'Blog Banner',
  'feature-announcement': 'Feature Announcement',
  'quote':                'Quote',
  'terminal':             'Terminal Code',
  'logo-pair':            'Logo Pair',
  'logo-showcase':        'Logo Showcase',
  'geo-comparison':       'Geo Comparison',
};

const TEMPLATE_COLORS: Record<PostTemplateType, string> = {
  'hero-image':           '#7c6aff',
  'blog-announcement':    '#3b8beb',
  'feature-announcement': '#d74939',
  'quote':                '#f59e0b',
  'terminal':             '#27c93f',
  'logo-pair':            '#f472b6',
  'logo-showcase':        '#06b6d4',
  'geo-comparison':       '#E8602E',
};

const TAB_STYLE = (active: boolean) => ({
  flex: 1,
  padding: '9px 0',
  background: 'none',
  border: 'none',
  borderBottom: `2px solid ${active ? '#d74939' : 'transparent'}`,
  color: active ? '#faf4ec' : 'rgba(250,244,236,0.4)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  fontWeight: active ? 600 : 400,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  transition: 'color 0.15s, border-color 0.15s',
});

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(250,244,236,0.45)', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="color"
          value={value.startsWith('rgba') ? '#faf4ec' : value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(250,244,236,0.15)', padding: 2, background: 'transparent', cursor: 'pointer' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, background: 'rgba(250,244,236,0.06)', border: '1px solid rgba(250,244,236,0.12)', borderRadius: 6, padding: '6px 10px', color: '#faf4ec', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}
        />
      </div>
    </div>
  );
}

function FontField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(250,244,236,0.45)', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ background: 'rgba(250,244,236,0.06)', border: '1px solid rgba(250,244,236,0.12)', borderRadius: 6, padding: '6px 10px', color: '#faf4ec', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, cursor: 'pointer' }}
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f} value={f} style={{ background: '#16151f' }}>{f}</option>
        ))}
      </select>
    </div>
  );
}

export function LeftSidebar({ campaign, activeTab, setActiveTab, selectedPostId, onSelectPost, onUpdateTheme }: Props) {
  const { theme } = campaign;
  const [collapsed, setCollapsed] = useState<Set<PostTemplateType>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const postButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (selectedPostId && postButtonRefs.current[selectedPostId]) {
      postButtonRefs.current[selectedPostId]!.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedPostId]);

  function copyAnchorLink(postId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#${postId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(postId);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function toggleGroup(type: PostTemplateType) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  // Group posts by template type, preserving calendar order within each group
  const grouped: Partial<Record<PostTemplateType, Post[]>> = {};
  for (const type of TEMPLATE_ORDER) {
    const posts = campaign.posts.filter((p) => p.templateType === type);
    if (posts.length > 0) grouped[type] = posts;
  }

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        borderRight: '1px solid rgba(250,244,236,0.07)',
        background: '#0f0e18',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Campaign name */}
      <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid rgba(250,244,236,0.06)' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, color: '#faf4ec' }}>
          {campaign.name}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(250,244,236,0.3)', marginTop: 4 }}>
          {campaign.posts.length} posts
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(250,244,236,0.07)', padding: '0 4px' }}>
        <button style={TAB_STYLE(activeTab === 'posts')} onClick={() => setActiveTab('posts')}>Posts</button>
        <button style={TAB_STYLE(activeTab === 'theme')} onClick={() => setActiveTab('theme')}>Theme</button>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── Posts tab ──────────────────────────────────────────── */}
        {activeTab === 'posts' && (
          <div style={{ paddingBottom: 16 }}>
            {(Object.entries(grouped) as [PostTemplateType, Post[]][]).map(([type, posts]) => {
              const isCollapsed = collapsed.has(type);
              const color = TEMPLATE_COLORS[type];
              const label = TEMPLATE_LABELS[type];

              return (
                <div key={type}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(type)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px 10px 20px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderTop: '1px solid rgba(250,244,236,0.05)',
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'rgba(250,244,236,0.5)',
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        flex: 1,
                        textAlign: 'left',
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        color: 'rgba(250,244,236,0.25)',
                        marginRight: 4,
                      }}
                    >
                      {posts.length}
                    </span>
                    {isCollapsed
                      ? <ChevronRight size={12} color="rgba(250,244,236,0.3)" />
                      : <ChevronDown size={12} color="rgba(250,244,236,0.3)" />
                    }
                  </button>

                  {/* Post items */}
                  {!isCollapsed && posts.map((post) => {
                    const selected = selectedPostId === post.id;
                    const copied = copiedId === post.id;
                    return (
                      <button
                        key={post.id}
                        ref={(el) => { postButtonRefs.current[post.id] = el; }}
                        onClick={() => onSelectPost(post)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '9px 12px 9px 36px',
                          background: selected ? `${color}18` : 'transparent',
                          border: 'none',
                          borderLeft: `3px solid ${selected ? color : 'transparent'}`,
                          color: selected ? '#faf4ec' : 'rgba(250,244,236,0.5)',
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: 13,
                          fontWeight: selected ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'background 0.12s, color 0.12s',
                          lineHeight: 1.3,
                        }}
                      >
                        <span style={{ flex: 1, textAlign: 'left' }}>{post.name}</span>
                        <span
                          onClick={(e) => copyAnchorLink(post.id, e)}
                          title="Copy link"
                          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4, opacity: copied ? 1 : 0.4, transition: 'opacity 0.15s' }}
                        >
                          {copied
                            ? <Check size={11} color="#27c93f" />
                            : <Link2 size={11} color="currentColor" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Theme tab ──────────────────────────────────────────── */}
        {activeTab === 'theme' && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(250,244,236,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: -4 }}>Colors</div>
            <ColorField label="Background" value={theme.background} onChange={(v) => onUpdateTheme({ background: v })} />
            <ColorField label="Surface"    value={theme.surface}    onChange={(v) => onUpdateTheme({ surface: v })} />
            <ColorField label="Accent"     value={theme.accent}     onChange={(v) => onUpdateTheme({ accent: v })} />
            <ColorField label="Heading Color" value={theme.headingColor} onChange={(v) => onUpdateTheme({ headingColor: v })} />
            <ColorField label="Body Color"    value={theme.bodyColor}    onChange={(v) => onUpdateTheme({ bodyColor: v })} />
            <div style={{ height: 1, background: 'rgba(250,244,236,0.07)', margin: '4px 0' }} />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(250,244,236,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: -4 }}>Typography</div>
            <FontField label="Heading Font" value={theme.headingFont} onChange={(v) => onUpdateTheme({ headingFont: v })} />
            <FontField label="Body Font"    value={theme.bodyFont}    onChange={(v) => onUpdateTheme({ bodyFont: v })} />
          </div>
        )}
      </div>
    </div>
  );
}
