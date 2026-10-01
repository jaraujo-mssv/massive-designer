import { Fragment, useState } from 'react'
import { Link, matchPath, useLocation, useMatch } from 'react-router'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet'
import {
  DotsNine,
  Handshake,
  ImageSquare,
  List,
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

const visibleTools = tools.filter((t) => !t.deprecated)

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

/**
 * Phones: the current tool's name and a menu button that opens the tool list,
 * instead of the nav row, which would wrap over several lines.
 */
function MobileNav() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const current = visibleTools.find((t) => matchPath(t.route, pathname))

  return (
    <div className="md:hidden flex flex-1 min-w-0 items-center justify-between gap-3">
      {current ? (
        <span className="flex items-center gap-2 min-w-0 font-mono text-[0.78rem] font-semibold text-brand-light">
          <current.icon size={15} weight="fill" className="shrink-0" />
          <span className="truncate">{current.label}</span>
        </span>
      ) : (
        <span />
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Open the tools menu"
            className="shrink-0 -mr-2 p-2 rounded-md text-text-dim hover:text-text-primary hover:bg-surface-2"
          >
            <List size={22} weight="bold" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 gap-0 bg-surface border-border-subtle p-0">
          <SheetTitle className="px-5 pt-5 pb-3 text-xs font-semibold text-text-dim uppercase tracking-widest font-mono">
            Tools
          </SheetTitle>
          <SheetDescription className="sr-only">Go to another tool</SheetDescription>
          <nav className="flex flex-col px-3 pb-4">
            {visibleTools.map((t, i) => {
              const active = t === current
              return (
                <Fragment key={t.route}>
                  {i > 0 && visibleTools[i - 1].group !== t.group && (
                    <div aria-hidden className="h-px my-2 mx-2 bg-border-subtle" />
                  )}
                  <Link
                    to={t.route}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg font-mono text-sm ${
                      active ? 'text-brand-light bg-brand/10 font-semibold' : 'text-text-mid hover:bg-surface-2'
                    }`}
                  >
                    <t.icon size={18} weight="fill" />
                    {t.label}
                  </Link>
                </Fragment>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function Header() {
  return (
    <header
      className="px-4 md:px-6 gap-4 md:gap-6"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
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

      {/* Divider (desktop: phones show the tool name instead) */}
      <div
        className="hidden md:block"
        style={{
          width: '1px',
          height: '18px',
          backgroundColor: 'var(--border-subtle)',
          flexShrink: 0,
        }}
      />

      {/* Nav */}
      <nav className="hidden md:flex items-center flex-wrap" style={{ gap: '0.25rem' }}>
        {visibleTools.map((t, i) => (
          <Fragment key={t.route}>
            {i > 0 && visibleTools[i - 1].group !== t.group && (
              <div
                aria-hidden
                style={{ width: '1px', height: '18px', margin: '0 0.5rem', backgroundColor: 'var(--border-subtle)' }}
              />
            )}
            <NavLink to={t.route} label={t.label} icon={t.icon} />
          </Fragment>
        ))}
      </nav>
      <MobileNav />
    </header>
  )
}
