import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { visibleTools } from '@/shared/components/Header'
import { ToolGrid } from './home/ToolGrid'

/** Old names that redirect, so a near miss of one is still caught. */
const ALIASES = [
  { name: 'bento-map', route: '/top-list', label: 'Top List' },
  { name: 'image-upload', route: '/logo-encoder', label: 'Logo Encoder' },
]

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Edit distance, for "did you mean": /imagez, /teamphoto, /merchh. */
function distance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = row
  }
  return prev[b.length]
}

/** The tool a mistyped path most likely meant: its first segment within two edits of a route, or a prefix of one. */
function guess(pathname: string): { route: string; label: string } | undefined {
  const asked = squash(pathname.split('/').filter(Boolean)[0] ?? '')
  if (asked.length < 3) return undefined
  const candidates = [...visibleTools.map((t) => ({ name: t.route, route: t.route, label: t.label })), ...ALIASES]
  let best: { route: string; label: string; d: number } | undefined
  for (const c of candidates) {
    const name = squash(c.name)
    const d = name.startsWith(asked) || asked.startsWith(name) ? 0 : distance(asked, name)
    if (d <= 2 && (!best || d < best.d)) best = { route: c.route, label: c.label, d }
  }
  return best
}

/**
 * Any path the router doesn't know. `reason` replaces the usual line, for a page that exists but not
 * here (Video and Content, on the deployed site).
 */
export function NotFound({ reason }: { reason?: ReactNode }) {
  const { pathname } = useLocation()
  const meant = reason ? undefined : guess(pathname)
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
      <div className="max-w-2xl">
        <div className="text-sm font-semibold uppercase tracking-[0.08em] text-brand-light">404</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-text-primary md:text-4xl">Page not found</h1>
        <p className="mt-3 text-text-mid">
          {reason ?? (
            <>
              There's nothing at <span className="break-all text-text-primary">{pathname}</span>.
            </>
          )}
        </p>
        {meant && (
          <p className="mt-2 text-text-mid">
            Did you mean{' '}
            <Link className="font-semibold text-brand-light hover:underline underline-offset-2" to={meant.route}>
              {meant.label}
            </Link>
            ?
          </p>
        )}
        <p className="mt-6 text-sm text-text-dim">
          Pick a tool below, or go to the{' '}
          <Link className="text-brand-light hover:underline underline-offset-2" to="/">
            brand kit
          </Link>
          .
        </p>
      </div>
      <div className="mt-8">
        <ToolGrid />
      </div>
    </main>
  )
}
