import { Fragment } from 'react'
import { Link, useMatch } from 'react-router'
import {
  DotsNine,
  Handshake,
  ImageSquare,
  Megaphone,
  ShareNetwork,
  SquaresFour,
  Trophy,
  VideoCamera,
  type Icon,
} from '@phosphor-icons/react'

// Order is the nav order. `group` splits the nav with a divider: the
// sheet-driven canvas tools first, then the rest. Deprecated tools stay
// routable by direct URL but are hidden from the nav.
const tools: { label: string; route: string; icon: Icon; group: string; deprecated?: boolean }[] = [
  { label: 'Market Map', route: '/market-map', icon: SquaresFour, group: 'canvas' },
  { label: 'Top List', route: '/top-list', icon: Trophy, group: 'canvas' },
  { label: 'Partnership Post', route: '/partnership-post', icon: Handshake, group: 'other' },
  { label: 'Video', route: '/video', icon: VideoCamera, group: 'other' },
  { label: 'Image Converter', route: '/image-upload', icon: ImageSquare, group: 'other' },
  { label: 'Social Media', route: '/social-media', icon: ShareNetwork, group: 'other', deprecated: true },
  { label: 'Campaign Designer', route: '/campaign-designer', icon: Megaphone, group: 'other', deprecated: true },
  { label: 'Dither', route: '/dither', icon: DotsNine, group: 'other', deprecated: true },
]

function NavLink({ to, label, icon: ToolIcon }: { to: string; label: string; icon: Icon }) {
  const match = useMatch(to)
  return (
    <Link
      to={to}
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.78rem',
        fontWeight: match ? 600 : 400,
        letterSpacing: '0.02em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '6px',
        textDecoration: 'none',
        transition: 'color 0.15s, background-color 0.15s',
        color: match ? 'var(--red-light)' : 'var(--text-dim)',
        backgroundColor: match ? 'rgba(215, 73, 57, 0.1)' : 'transparent',
        border: match ? '1px solid rgba(215, 73, 57, 0.2)' : '1px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!match) {
          e.currentTarget.style.color = 'var(--text)'
          e.currentTarget.style.backgroundColor = 'var(--surface-2)'
        }
      }}
      onMouseLeave={(e) => {
        if (!match) {
          e.currentTarget.style.color = 'var(--text-dim)'
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      <ToolIcon size={15} weight="fill" />
      {label}
    </Link>
  )
}

export function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '0.75rem 1.5rem',
        backgroundColor: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Brand */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        <img src="/logo.svg" alt="Massive" style={{ height: '20px', width: 'auto' }} />
      </Link>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '18px',
          backgroundColor: 'var(--border-subtle)',
          flexShrink: 0,
        }}
      />

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
        {tools
          .filter((t) => !t.deprecated)
          .map((t, i, visible) => (
            <Fragment key={t.route}>
              {i > 0 && visible[i - 1].group !== t.group && (
                <div
                  aria-hidden
                  style={{ width: '1px', height: '18px', margin: '0 0.5rem', backgroundColor: 'var(--border-subtle)' }}
                />
              )}
              <NavLink to={t.route} label={t.label} icon={t.icon} />
            </Fragment>
          ))}
      </nav>
    </header>
  )
}
