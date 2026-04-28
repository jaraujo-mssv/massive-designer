import { X } from 'lucide-react';
import { Post, PostContent } from '../types';

interface Props {
  post: Post | null;
  onClose: () => void;
  onUpdatePost: (postId: string, content: Partial<PostContent>) => void;
}

const LABEL = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  color: 'rgba(250,244,236,0.45)',
  letterSpacing: '0.04em',
  marginBottom: 6,
  display: 'block' as const,
};

const INPUT = {
  width: '100%',
  background: 'rgba(250,244,236,0.06)',
  border: '1px solid rgba(250,244,236,0.12)',
  borderRadius: 8,
  padding: '9px 12px',
  color: '#faf4ec',
  fontFamily: 'Outfit, sans-serif',
  fontSize: 13,
  boxSizing: 'border-box' as const,
  outline: 'none',
};

const TEXTAREA = {
  ...INPUT,
  minHeight: 88,
  resize: 'vertical' as const,
  lineHeight: 1.5,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: 'rgba(250,244,236,0.3)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        paddingTop: 4,
      }}
    >
      {title}
    </div>
  );
}

export function RightPanel({ post, onClose, onUpdatePost }: Props) {
  if (!post) return null;

  function update(content: Partial<PostContent>) {
    onUpdatePost(post!.id, content);
  }

  const { content, templateType } = post;

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        borderLeft: '1px solid rgba(250,244,236,0.07)',
        background: '#0f0e18',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(250,244,236,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 700, color: '#faf4ec' }}>
            {post.name}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(250,244,236,0.35)', marginTop: 2 }}>
            {templateType}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(250,244,236,0.4)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {templateType === 'blog-announcement' && (
          <>
            <Section title="Content" />
            <Field label="Title">
              <textarea
                style={TEXTAREA}
                value={content.title || ''}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="Blog post title"
              />
            </Field>
            <Field label="Author">
              <input style={INPUT} type="text" value={content.author || ''} onChange={(e) => update({ author: e.target.value })} placeholder="Author name" />
            </Field>
            <Field label="Author Role">
              <input style={INPUT} type="text" value={content.authorRole || ''} onChange={(e) => update({ authorRole: e.target.value })} placeholder="CEO, Company" />
            </Field>
            <Field label="Image URL">
              <input style={INPUT} type="text" value={content.imageUrl || ''} onChange={(e) => update({ imageUrl: e.target.value })} placeholder="https://..." />
            </Field>
          </>
        )}

        {templateType === 'logo-pair' && (
          <>
            <Section title="Content" />
            <Field label="Company Name">
              <input style={INPUT} type="text" value={content.companyName || ''} onChange={(e) => update({ companyName: e.target.value })} placeholder="Partner name" />
            </Field>
            <Field label="Company Logo URL">
              <input style={INPUT} type="text" value={content.companyLogoUrl || ''} onChange={(e) => update({ companyLogoUrl: e.target.value })} placeholder="https://..." />
            </Field>
          </>
        )}

        {templateType === 'quote' && (
          <>
            <Section title="Content" />
            <Field label="Quote">
              <textarea
                style={TEXTAREA}
                value={content.quoteText || ''}
                onChange={(e) => update({ quoteText: e.target.value })}
                placeholder="Your quote here"
              />
            </Field>
            <Field label="Author">
              <input style={INPUT} type="text" value={content.quoteAuthor || ''} onChange={(e) => update({ quoteAuthor: e.target.value })} placeholder="Author name" />
            </Field>
            <Field label="Role / Title">
              <input style={INPUT} type="text" value={content.quoteRole || ''} onChange={(e) => update({ quoteRole: e.target.value })} placeholder="CEO, Company" />
            </Field>
          </>
        )}

        {templateType === 'feature-announcement' && (
          <>
            <Section title="Content" />
            <Field label="Tag">
              <input style={INPUT} type="text" value={content.featureTag || ''} onChange={(e) => update({ featureTag: e.target.value })} placeholder="New" />
            </Field>
            <Field label="Title">
              <textarea
                style={TEXTAREA}
                value={content.title || ''}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="Feature title"
              />
            </Field>
            <Field label="Image URL">
              <input style={INPUT} type="text" value={content.imageUrl || ''} onChange={(e) => update({ imageUrl: e.target.value })} placeholder="https://..." />
            </Field>
          </>
        )}

        {templateType === 'logo-showcase' && (
          <>
            <Section title="Content" />
            <Field label="Title">
              <input style={INPUT} type="text" value={content.showcaseTitle || ''} onChange={(e) => update({ showcaseTitle: e.target.value })} placeholder="One API. Any LLM." />
            </Field>
            <Section title="Logos" />
            {(content.logos || []).map((logo, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px', background: 'rgba(250,244,236,0.04)', borderRadius: 8 }}>
                <label style={{ ...LABEL, marginBottom: 0 }}>Logo {i + 1} — {logo.name}</label>
                <input
                  style={INPUT}
                  type="text"
                  value={logo.url}
                  onChange={(e) => {
                    const logos = [...(content.logos || [])];
                    logos[i] = { ...logos[i], url: e.target.value };
                    update({ logos });
                  }}
                  placeholder={`${logo.name} logo URL`}
                />
              </div>
            ))}
          </>
        )}

        {templateType === 'terminal' && (
          <>
            <Section title="Content" />
            <Field label="Title above terminal">
              <input style={INPUT} type="text" value={content.codeTitle || ''} onChange={(e) => update({ codeTitle: e.target.value })} placeholder="Title above window" />
            </Field>
            <Field label="Terminal window title">
              <input style={INPUT} type="text" value={content.terminalTitle || ''} onChange={(e) => update({ terminalTitle: e.target.value })} placeholder="bash" />
            </Field>
            <Field label="Code snippet">
              <textarea
                style={{ ...TEXTAREA, minHeight: 180, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                value={content.codeSnippet || ''}
                onChange={(e) => update({ codeSnippet: e.target.value })}
                placeholder="curl -X POST ..."
              />
            </Field>
          </>
        )}

        {templateType === 'hero-image' && (
          <>
            <Section title="Content" />
            <Field label="Headline">
              <textarea
                style={TEXTAREA}
                value={content.heroTitle || ''}
                onChange={(e) => update({ heroTitle: e.target.value })}
                placeholder="Your headline"
              />
            </Field>
            <Field label="Background Image URL">
              <input style={INPUT} type="text" value={content.heroImageUrl || ''} onChange={(e) => update({ heroImageUrl: e.target.value })} placeholder="https://..." />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}
