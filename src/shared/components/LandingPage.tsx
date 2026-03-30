import { Link } from 'react-router'
import { LayoutGrid, Share2, Trophy, ImageIcon, ArrowRight } from 'lucide-react'

const tools = [
  {
    route: '/market-map',
    title: 'Market Map Generator',
    description:
      'Visualize competitive landscapes with drag-and-drop category management, CSV import, and Google Sheets integration.',
    icon: LayoutGrid,
    tag: 'Visualization',
    accent: '#8b5cf6',
    accentGlow: 'rgba(139, 92, 246, 0.12)',
    accentBorder: 'rgba(139, 92, 246, 0.2)',
  },
  {
    route: '/social-media',
    title: 'Social Media Post Designer',
    description:
      'Design LinkedIn and Twitter content cards with multi-theme templates, block-based editing, and one-click export.',
    icon: Share2,
    tag: 'Content',
    accent: '#3b82f6',
    accentGlow: 'rgba(59, 130, 246, 0.12)',
    accentBorder: 'rgba(59, 130, 246, 0.2)',
  },
  {
    route: '/top-list',
    title: 'Top List Generator',
    description:
      'Create ranked list and thumbnail visualizations with CSV import, drag-and-drop ordering, and screenshot export.',
    icon: Trophy,
    tag: 'Rankings',
    accent: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.12)',
    accentBorder: 'rgba(245, 158, 11, 0.2)',
  },
  {
    route: '/image-upload',
    title: 'Image Upload & Converter',
    description:
      'Upload, crop, and resize images to standard presets or custom dimensions. Copy as base64 or download.',
    icon: ImageIcon,
    tag: 'Utility',
    accent: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.12)',
    accentBorder: 'rgba(16, 185, 129, 0.2)',
  },
]

export function LandingPage() {
  return (
    <div
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}
    >
      {/* Grid background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(250, 244, 236, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(250, 244, 236, 0.025) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Red radial glow at top */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, var(--red-glow), transparent)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }}>
        {/* Hero */}
        <div style={{ paddingTop: '6rem', paddingBottom: '5rem', textAlign: 'center' }}>
          {/* Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--red)',
                boxShadow: '0 0 8px var(--red)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.72rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--red)',
              }}
            >
              Design Tools Suite
            </span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 'clamp(2.6rem, 6vw, 4.8rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              marginBottom: '1.25rem',
            }}
          >
            Build better{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #d74939, #ff8163)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              visuals
            </span>
            , faster.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '1.15rem',
              fontWeight: 300,
              lineHeight: 1.7,
              color: 'var(--text-mid)',
              maxWidth: '520px',
              margin: '0 auto 2.5rem',
            }}
          >
            A suite of browser-based design tools for market maps, social posts,
            ranked lists, and image processing — no installs required.
          </p>

          {/* Stat pills */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            {['4 Tools', 'No Sign-up', 'Export Ready', 'CSV Import'].map((s) => (
              <span
                key={s}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.75rem',
                  letterSpacing: '0.04em',
                  padding: '0.4rem 1rem',
                  borderRadius: '999px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'rgba(250, 244, 236, 0.04)',
                  backdropFilter: 'blur(8px)',
                  color: 'var(--text-dim)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Tool cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '1.25rem',
            paddingBottom: '5rem',
          }}
        >
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.route}
                to={tool.route}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  padding: '1.75rem',
                  borderRadius: '16px',
                  border: `1px solid var(--border-subtle)`,
                  backgroundColor: 'var(--surface)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = tool.accentBorder
                  el.style.backgroundColor = 'var(--surface-2)'
                  el.style.boxShadow = `0 8px 40px ${tool.accentGlow}`
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = 'var(--border-subtle)'
                  el.style.backgroundColor = 'var(--surface)'
                  el.style.boxShadow = 'none'
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: `${tool.accentGlow}`,
                      border: `1px solid ${tool.accentBorder}`,
                    }}
                  >
                    <Icon size={18} style={{ color: tool.accent }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.65rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--text-dim)',
                        border: '1px solid var(--border-subtle)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                      }}
                    >
                      {tool.tag}
                    </span>
                    <ArrowRight size={15} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                  </div>
                </div>

                {/* Card body */}
                <div>
                  <h2
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      marginBottom: '0.5rem',
                      color: 'var(--text)',
                    }}
                  >
                    {tool.title}
                  </h2>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 300,
                      lineHeight: 1.65,
                      color: 'var(--text-dim)',
                    }}
                  >
                    {tool.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.72rem',
            letterSpacing: '0.04em',
            color: 'var(--text-dim)',
          }}
        >
          Massive Designer Tools — built for speed
        </span>
      </div>
    </div>
  )
}
