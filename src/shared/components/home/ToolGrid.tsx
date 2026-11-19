import { Link } from 'react-router'
import { visibleTools } from '@/shared/components/Header'

/** The tools as cards, from the nav's own list: the home page's last section, and the 404's way on. */
export function ToolGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {visibleTools.map((t) => (
        <Link
          key={t.route}
          to={t.route}
          className="group flex items-start gap-3 p-4 rounded-xl border border-border-subtle bg-surface hover:bg-surface-2 hover:border-brand/30 transition-colors"
        >
          <t.icon size={20} weight="fill" className="shrink-0 mt-0.5 text-brand-light" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-text-primary">{t.label}</span>
            <span className="block mt-0.5 text-[13px] leading-snug text-text-dim group-hover:text-text-mid">
              {t.blurb}
              {t.localOnly && ' (dev server only)'}
            </span>
          </span>
        </Link>
      ))}
    </div>
  )
}
