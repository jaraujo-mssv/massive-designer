import { Link, useMatch } from 'react-router'

const tools = [
  { label: 'Market Map', route: '/market-map' },
  { label: 'Social Media', route: '/social-media' },
  { label: 'Top List', route: '/top-list' },
  { label: 'Image Converter', route: '/image-upload' },
]

function NavLink({ to, label }: { to: string; label: string }) {
  const match = useMatch(to)
  return (
    <Link
      to={to}
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.78rem',
        fontWeight: match ? 600 : 400,
        letterSpacing: '0.02em',
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
        {tools.map((t) => (
          <NavLink key={t.route} to={t.route} label={t.label} />
        ))}
      </nav>
    </header>
  )
}
