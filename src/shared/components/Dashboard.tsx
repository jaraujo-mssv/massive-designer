import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  ExternalLink,
  FileSpreadsheet,
  LayoutGrid,
  Share2,
  Trophy,
  PenLine,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react'

// ─── Config ────────────────────────────────────────────────────────────────

const SPREADSHEET_ID = '1dcoRWbE6NqeSReFWSIqYMzF8eraJZqAG6bX71MX7u6Y'
const MASTER_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`

function sheetCsvUrl(sheetName: string) {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`
}

const TABS = [
  { label: 'Market Maps',        sheetName: 'Market Maps',        tool: '/market-map',   icon: LayoutGrid, accent: '#8b5cf6' },
  { label: 'Top Lists',          sheetName: 'Top Lists',          tool: '/top-list',     icon: Trophy,     accent: '#f59e0b' },
  { label: 'Social Media Posts', sheetName: 'Social Media Posts', tool: '/social-media', icon: Share2,     accent: '#3b82f6' },
]

// ─── CSV Parser ─────────────────────────────────────────────────────────────

function parseCSVRow(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

type Row = Record<string, string>

function parseCSV(csv: string): { headers: string[]; rows: Row[] } {
  const lines = csv.split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = parseCSVRow(lines[0]).map(h => h.trim())
  const rows = lines.slice(1).map(line => {
    const values = parseCSVRow(line)
    const row: Row = {}
    headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim() })
    return row
  }).filter(row => headers.some(h => row[h]))
  return { headers, rows }
}

// ─── Column matchers ────────────────────────────────────────────────────────

function findCol(headers: string[], ...keywords: string[]): string | undefined {
  return headers.find(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())))
}

// ─── Status pill ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  done:          { bg: 'rgba(16,185,129,0.12)',  text: '#10b981', dot: '#10b981' },
  published:     { bg: 'rgba(16,185,129,0.12)',  text: '#10b981', dot: '#10b981' },
  complete:      { bg: 'rgba(16,185,129,0.12)',  text: '#10b981', dot: '#10b981' },
  live:          { bg: 'rgba(16,185,129,0.12)',  text: '#10b981', dot: '#10b981' },
  ready:         { bg: 'rgba(20,184,166,0.14)',  text: '#2dd4bf', dot: '#2dd4bf' },
  'in progress': { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', dot: '#f59e0b' },
  wip:           { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', dot: '#f59e0b' },
  draft:         { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8', dot: '#818cf8' },
  review:        { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', dot: '#60a5fa' },
  'stand by':    { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', dot: '#94a3b8' },
  standby:       { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', dot: '#94a3b8' },
  blocked:       { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', dot: '#f87171' },
  cancelled:     { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', dot: '#f87171' },
}

function getStatusStyle(status: string) {
  const key = status.toLowerCase().trim()
  return (
    STATUS_COLORS[key] ??
    Object.entries(STATUS_COLORS).find(([k]) => key.includes(k))?.[1] ??
    { bg: 'rgba(250,244,236,0.06)', text: 'var(--text-dim)', dot: 'var(--text-dim)' }
  )
}

function StatusPill({ value }: { value: string }) {
  if (!value) return <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>
  const s = getStatusStyle(value)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '999px',
        backgroundColor: s.bg,
        fontSize: '0.72rem',
        fontWeight: 500,
        letterSpacing: '0.02em',
        color: s.text,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
      {value}
    </span>
  )
}

// ─── Sorting helpers ────────────────────────────────────────────────────────

type SortKey = 'name' | 'date' | 'status'
type SortDir = 'asc' | 'desc'

/** Parse "Q1 2026" → sortable integer, fallback to string comparison */
function dateSortValue(val: string): number {
  const m = val.match(/Q([1-4])\s+(\d{4})/i)
  if (m) return parseInt(m[2]) * 4 + parseInt(m[1]) - 1
  return 0
}

function compareRows(
  a: Row, b: Row,
  key: SortKey, dir: SortDir,
  cols: { nameCol?: string; dateCol?: string; statusCol?: string }
): number {
  let av = '', bv = ''
  if (key === 'name')   { av = (cols.nameCol   ? a[cols.nameCol]   : '').toLowerCase(); bv = (cols.nameCol   ? b[cols.nameCol]   : '').toLowerCase() }
  if (key === 'status') { av = (cols.statusCol ? a[cols.statusCol] : '').toLowerCase(); bv = (cols.statusCol ? b[cols.statusCol] : '').toLowerCase() }
  if (key === 'date') {
    const an = dateSortValue(cols.dateCol ? a[cols.dateCol] : '')
    const bn = dateSortValue(cols.dateCol ? b[cols.dateCol] : '')
    if (an !== 0 || bn !== 0) return dir === 'asc' ? an - bn : bn - an
    av = (cols.dateCol ? a[cols.dateCol] : '').toLowerCase()
    bv = (cols.dateCol ? b[cols.dateCol] : '').toLowerCase()
  }
  const cmp = av < bv ? -1 : av > bv ? 1 : 0
  return dir === 'asc' ? cmp : -cmp
}

// ─── Icon button ────────────────────────────────────────────────────────────

function IconBtn({
  href, onClick, icon: Icon, label, title, disabled,
}: {
  href?: string; onClick?: () => void; icon: React.ElementType
  label?: string; title?: string; disabled?: boolean
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    padding: label ? '0.28rem 0.65rem' : '0.35rem',
    borderRadius: '6px', border: '1px solid var(--border-subtle)',
    backgroundColor: 'transparent',
    color: disabled ? 'var(--text-dim)' : 'var(--text-mid)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.72rem', fontWeight: 500, textDecoration: 'none',
    opacity: disabled ? 0.4 : 1,
    transition: 'background-color 0.15s, border-color 0.15s, color 0.15s',
    whiteSpace: 'nowrap' as const, fontFamily: 'inherit',
  }
  const hov = { backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-hover-color)', color: 'var(--text)' }

  if (href && !disabled) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" title={title} style={base}
        onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, hov)}
        onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, base)}
      >
        <Icon size={12} />{label && <span>{label}</span>}
      </a>
    )
  }
  return (
    <button onClick={onClick} title={title} disabled={disabled} style={base}
      onMouseEnter={e => !disabled && Object.assign((e.currentTarget as HTMLElement).style, hov)}
      onMouseLeave={e => !disabled && Object.assign((e.currentTarget as HTMLElement).style, base)}
    >
      <Icon size={12} />{label && <span>{label}</span>}
    </button>
  )
}

// ─── Sortable column header ─────────────────────────────────────────────────

function SortableTh({
  children, sortKey, currentKey, currentDir, onSort, style,
}: {
  children: React.ReactNode
  sortKey: SortKey
  currentKey: SortKey | null
  currentDir: SortDir
  onSort: (k: SortKey) => void
  style?: React.CSSProperties
}) {
  const isActive = currentKey === sortKey
  const Icon = isActive ? (currentDir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        padding: '0.6rem 1rem',
        textAlign: 'left',
        color: isActive ? 'var(--text-mid)' : 'var(--text-dim)',
        fontWeight: 500,
        fontSize: '0.7rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontFamily: "'JetBrains Mono', monospace",
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        userSelect: 'none',
        ...style,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
        {children}
        <Icon size={10} style={{ opacity: isActive ? 1 : 0.4 }} />
      </span>
    </th>
  )
}

function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th style={{
      padding: '0.6rem 1rem', textAlign: 'left', color: 'var(--text-dim)',
      fontWeight: 500, fontSize: '0.7rem', letterSpacing: '0.06em',
      textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace",
      whiteSpace: 'nowrap', ...style,
    }}>
      {children}
    </th>
  )
}

function Td({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: '0.65rem 1rem', verticalAlign: 'middle', ...style }}>{children}</td>
}

// ─── Sheet table ────────────────────────────────────────────────────────────

function SheetTable({ sheetName, tool }: { sheetName: string; tool: string }) {
  const navigate = useNavigate()
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ok'; headers: string[]; rows: Row[] }
  >({ status: 'loading' })
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function load() {
    setState({ status: 'loading' })
    fetch(sheetCsvUrl(sheetName))
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text() })
      .then(csv => setState({ status: 'ok', ...parseCSV(csv) }))
      .catch(err => setState({ status: 'error', message: err.message }))
  }

  useEffect(() => { load() }, [sheetName])

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const headers = state.status === 'ok' ? state.headers : []
  const rows    = state.status === 'ok' ? state.rows    : []

  const nameCol        = findCol(headers, 'name', 'title', 'item')
  const statusCol      = findCol(headers, 'status', 'state')
  const dateCol        = findCol(headers, 'date', 'quarter', 'period', 'q1', 'q2', 'q3', 'q4')
  const linearCol      = findCol(headers, 'linear')
  const spreadsheetCol = findCol(headers, 'spreadsheet', 'sheet', 'gsheet')

  const cols = { nameCol, dateCol, statusCol }

  // Filter + sort — must be before any early returns
  const visible = useMemo(() => {
    let result = rows
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r => (nameCol ? r[nameCol] : '').toLowerCase().includes(q))
    }
    if (sortKey) {
      result = [...result].sort((a, b) => compareRows(a, b, sortKey, sortDir, cols))
    }
    return result
  }, [rows, search, sortKey, sortDir])

  // Early returns after all hooks
  if (state.status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        Fetching spreadsheet data…
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem', color: '#f87171', fontSize: '0.85rem' }}>
        <AlertTriangle size={14} />
        <span>Could not load sheet "{sheetName}": {state.message}</span>
        <button onClick={load} style={{ marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
          <RefreshCw size={11} /> Retry
        </button>
      </div>
    )
  }

  if (rows.length === 0) {
    return <div style={{ padding: '2rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>No rows found in this sheet.</div>
  }

  return (
    <div>
      {/* Search bar */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ position: 'relative', maxWidth: 320 }}>
          <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            style={{
              width: '100%',
              paddingLeft: '2rem',
              paddingRight: '0.75rem',
              paddingTop: '0.4rem',
              paddingBottom: '0.4rem',
              borderRadius: '7px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text)',
              fontSize: '0.8rem',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {statusCol && (
                <SortableTh sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={handleSort}>Status</SortableTh>
              )}
              {dateCol && (
                <SortableTh sortKey="date" currentKey={sortKey} currentDir={sortDir} onSort={handleSort}>Date</SortableTh>
              )}
              {nameCol && (
                <SortableTh sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} style={{ width: '99%' }}>Name</SortableTh>
              )}
              <Th style={{ textAlign: 'right' }}>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  No results for "{search}"
                </td>
              </tr>
            ) : visible.map((row, i) => {
              const name       = nameCol        ? row[nameCol]        : ''
              const linearUrl  = linearCol      ? row[linearCol]      : ''
              const sheetUrl   = spreadsheetCol ? row[spreadsheetCol] : ''
              // ?e= carries the item's spreadsheet URL; fall back to name
              const editorUrl  = `${tool}?e=${encodeURIComponent(sheetUrl || name || String(i + 1))}`

              return (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.12s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--surface-2)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  {statusCol && (
                    <Td style={{ whiteSpace: 'nowrap' }}>
                      <StatusPill value={row[statusCol]} />
                    </Td>
                  )}
                  {dateCol && (
                    <Td style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem' }}>
                      {row[dateCol] || '—'}
                    </Td>
                  )}
                  {nameCol && (
                    <Td>
                      <button
                        onClick={() => navigate(editorUrl)}
                        title="Open in editor"
                        style={{
                          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                          color: 'var(--text)', fontWeight: 500, fontSize: 'inherit',
                          fontFamily: 'inherit', textAlign: 'left',
                          textDecoration: 'none',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-mid)'; (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
                      >
                        {name || '—'}
                      </button>
                    </Td>
                  )}
                  <Td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <IconBtn href={linearUrl || undefined} icon={ExternalLink} label="Linear" title="Open Linear task" disabled={!linearUrl} />
                      <IconBtn href={sheetUrl || undefined} icon={FileSpreadsheet} label="Sheet" title="Open spreadsheet" disabled={!sheetUrl} />
                      <IconBtn onClick={() => navigate(editorUrl)} icon={PenLine} label="Open" title="Open in editor" />
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main export ────────────────────────────────────────────────────────────

export function Dashboard() {
  const [activeTab, setActiveTab] = useState(0)
  const tab = TABS[activeTab]

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>
      {/* Subtle grid */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: `linear-gradient(rgba(250,244,236,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(250,244,236,0.02) 1px, transparent 1px)`,
        backgroundSize: '48px 48px', pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Red top glow */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '300px',
        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, var(--red-glow), transparent)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '0 2rem' }}>

        {/* Welcome bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2rem 0 1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.2rem', color: 'var(--text)' }}>
              Good morning — here's what's in flight.
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 300 }}>
              Design pipeline from the master tracker.
            </p>
          </div>
          <a
            href={MASTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.45rem 1rem', borderRadius: '8px',
              border: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface)',
              color: 'var(--text-mid)', fontSize: '0.8rem', fontWeight: 500,
              textDecoration: 'none', flexShrink: 0,
              transition: 'background-color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'var(--surface-2)'; el.style.borderColor = 'var(--border-hover-color)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'var(--surface)'; el.style.borderColor = 'var(--border-subtle)' }}
          >
            <FileSpreadsheet size={13} />
            Master Spreadsheet
            <ExternalLink size={11} style={{ color: 'var(--text-dim)' }} />
          </a>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          {TABS.map((t, i) => {
            const TIcon = t.icon
            const isActive = i === activeTab
            return (
              <button
                key={t.label}
                onClick={() => setActiveTab(i)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.65rem 1rem', borderRadius: '8px 8px 0 0',
                  border: 'none', backgroundColor: 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text-dim)',
                  cursor: 'pointer', fontSize: '0.82rem',
                  fontWeight: isActive ? 600 : 400,
                  borderBottom: isActive ? `2px solid ${t.accent}` : '2px solid transparent',
                  marginBottom: '-1px', transition: 'color 0.15s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-mid)' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)' }}
              >
                <TIcon size={13} style={{ color: isActive ? t.accent : 'currentColor' }} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Panel */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border-subtle)',
          borderTop: 'none', borderRadius: '0 0 12px 12px', marginBottom: '3rem', overflow: 'hidden',
        }}>
          <SheetTable key={tab.sheetName} sheetName={tab.sheetName} tool={tab.tool} />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
