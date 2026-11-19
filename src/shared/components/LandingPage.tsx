import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Toaster, toast } from 'sonner'
import { ArrowSquareOut, Copy, DownloadSimple } from '@phosphor-icons/react'
import { saveFile } from '@/shared/utils/saveFile'
import {
  BACKGROUND,
  FONTS,
  LOGO_GRADIENT,
  LOGOS,
  NOT_THESE,
  PNG_WIDTH,
  REGISTERS,
  RULES,
  SIZES,
  type KitColour,
  type KitLogo,
} from './home/kit'
import { copyPng, svgToPng } from './home/png'
import { ToolGrid } from './home/ToolGrid'

/**
 * The home page: Massive's brand kit, for anything made outside this site (Canva, Slides, Figma,
 * Docs), and the tools underneath. The values come from home/kit.ts, which follows brand/BRAND.md.
 */

const button =
  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border-subtle bg-surface-2 text-xs font-medium text-text-mid hover:text-text-primary hover:border-border-hov transition-colors'
const link = 'text-brand-light hover:underline underline-offset-2'

const SECTIONS = [
  { id: 'logos', label: 'Logos' },
  { id: 'colours', label: 'Colours' },
  { id: 'type', label: 'Type' },
  { id: 'background', label: 'Background' },
  { id: 'sizes', label: 'Sizes' },
  { id: 'tools', label: 'Tools' },
]

async function copyText(text: string, what = text) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`Copied ${what}`)
  } catch {
    toast.error("Couldn't copy: the browser blocked the clipboard.")
  }
}

function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      {intro && <p className="mt-1 max-w-2xl text-sm text-text-dim">{intro}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function LogoCard({ logo }: { logo: KitLogo }) {
  const png = () => svgToPng(logo.src, PNG_WIDTH)
  const download = async () => {
    try {
      await saveFile(await png(), `${logo.file}.png`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't make the PNG")
    }
  }
  const copy = async () => {
    try {
      await copyPng(png())
      toast.success(`${logo.name}: copied as a PNG`)
    } catch {
      toast.error("This browser won't put an image on the clipboard. Download the PNG instead.")
    }
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
      <div className="flex aspect-[16/9] items-center justify-center p-8" style={{ background: logo.ground }}>
        <img src={logo.src} alt={logo.name} className={`${logo.mark ? 'max-h-[30%]' : 'max-h-[45%]'} max-w-[75%] object-contain`} />
      </div>
      <div className="p-4">
        <div className="text-sm font-semibold text-text-primary">{logo.name}</div>
        <div className="mt-0.5 text-[13px] text-text-dim">{logo.use}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className={button} href={logo.src} download={`${logo.file}.svg`}>
            <DownloadSimple size={14} weight="bold" /> SVG
          </a>
          <button className={button} onClick={download} title={`A transparent PNG, ${PNG_WIDTH} px wide`}>
            <DownloadSimple size={14} weight="bold" /> PNG
          </button>
          <button className={button} onClick={copy} title="Copy as a PNG, to paste into Slides, Canva or Figma">
            <Copy size={14} weight="bold" /> Copy
          </button>
        </div>
      </div>
    </div>
  )
}

function Swatch({ colour }: { colour: KitColour }) {
  return (
    <button className="group text-left" onClick={() => copyText(colour.hex)} title={`Copy ${colour.hex}`}>
      <span className="block h-16 rounded-lg border border-border-subtle" style={{ background: colour.hex }} />
      <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-text-primary">
        {colour.name}
        <Copy size={12} className="text-text-dim opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      <span className="block text-[13px] tabular-nums text-text-mid">{colour.hex}</span>
      <span className="block text-xs leading-snug text-text-dim">{colour.use}</span>
    </button>
  )
}

function Colours() {
  const [from, to] = LOGO_GRADIENT
  return (
    <div className="space-y-8">
      {REGISTERS.map((r) => (
        <div key={r.name}>
          <div className="mb-3 text-sm text-text-mid">
            <span className="font-semibold text-text-primary">{r.name}</span> · {r.note}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {r.colours.map((c) => (
              <Swatch key={c.hex} colour={c} />
            ))}
          </div>
        </div>
      ))}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          className="group rounded-xl border border-border-subtle bg-surface p-4 text-left"
          onClick={() => copyText(`${from}, ${to}`, `${from} and ${to}`)}
        >
          <span className="block h-10 rounded-lg" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
          <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-text-primary">
            The logo's gradient
            <Copy size={12} className="text-text-dim opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
          <span className="block text-[13px] tabular-nums text-text-mid">
            {from} → {to}
          </span>
          <span className="block text-xs text-text-dim">The logo's own. Not a fill or a background.</span>
        </button>
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="flex gap-2">
            {NOT_THESE.map((hex) => (
              <span key={hex} className="h-10 flex-1 rounded-lg" style={{ background: hex }} />
            ))}
          </div>
          <div className="mt-2 text-sm font-semibold text-text-primary">Not cream</div>
          <div className="text-[13px] tabular-nums text-text-mid line-through decoration-brand">
            {NOT_THESE.join(', ')}
          </div>
          <div className="text-xs text-text-dim">Older designs used it; new ones don't. It reads too close to Claude's palette.</div>
        </div>
      </div>
    </div>
  )
}

function Type() {
  const card = 'flex flex-col rounded-xl border border-border-subtle bg-surface p-5'
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className={card}>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
          <span className="h-px w-6 bg-brand" />
          Eyebrow, 600
        </div>
        <div className="mt-3 text-4xl font-black leading-none tracking-[-0.04em] text-text-primary">Outfit</div>
        <div className="mt-2 text-lg font-bold text-text-primary">Subheads at 700</div>
        <p className="mt-1 text-sm font-light leading-snug text-text-mid">
          Body at 300 to 400. Titles at 900, tracked tight. Labels at 600, uppercase.
        </p>
        <p className="mt-3 text-xs text-text-dim">For everything: titles, body, labels, numbers and links.</p>
        <a className={`${link} mt-auto pt-4 inline-flex items-center gap-1 text-sm`} href={FONTS.outfit} target="_blank" rel="noreferrer">
          Outfit on Google Fonts <ArrowSquareOut size={13} />
        </a>
      </div>
      <div className={card}>
        <pre className="overflow-x-auto rounded-lg bg-bg p-3 text-[13px] leading-relaxed text-text-primary">
          <code className="font-mono">{'npm run image:render <id>\nGET /api/render/<id>.jpg'}</code>
        </pre>
        <div className="mt-3 text-lg font-bold text-text-primary">JetBrains Mono</div>
        <p className="mt-1 text-sm font-light leading-snug text-text-mid">
          Code only: commands, file paths, API parameters, terminal output.
        </p>
        <p className="mt-3 text-xs text-text-dim">Never for eyebrows, labels, counters or decoration.</p>
        <a className={`${link} mt-auto pt-4 inline-flex items-center gap-1 text-sm`} href={FONTS.mono} target="_blank" rel="noreferrer">
          JetBrains Mono on Google Fonts <ArrowSquareOut size={13} />
        </a>
      </div>
      <div className={card}>
        <style>{`@font-face { font-family: 'Caveat Kit'; src: url('${FONTS.caveat}') format('truetype'); font-display: swap; }`}</style>
        <div className="text-4xl leading-none text-text-primary" style={{ fontFamily: "'Caveat Kit', cursive" }}>
          a note in the margin
        </div>
        <div className="mt-3 text-lg font-bold text-text-primary">Caveat</div>
        <p className="mt-1 text-sm font-light leading-snug text-text-mid">
          Handwriting, for notes and annotations, as in the hiring images.
        </p>
        <p className="mt-3 text-xs text-text-dim">Free to use (SIL Open Font License).</p>
        <a className={`${link} mt-auto pt-4 inline-flex items-center gap-1 text-sm`} href={FONTS.caveat} download="Caveat.ttf">
          Download Caveat.ttf <DownloadSimple size={13} />
        </a>
      </div>
    </div>
  )
}

function Background() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
      <img src={BACKGROUND.src} alt="The dark background" className="block aspect-[16/9] w-full object-cover" loading="lazy" />
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <div className="text-sm font-semibold text-text-primary">Dark background</div>
          <div className="text-[13px] text-text-dim">Near-black, a faint grid, a red glow at the bottom. {BACKGROUND.size}.</div>
        </div>
        <a className={button} href={BACKGROUND.src} download={BACKGROUND.file}>
          <DownloadSimple size={14} weight="bold" /> JPG
        </a>
      </div>
    </div>
  )
}

function Sizes() {
  return (
    <table className="w-full text-sm">
      <tbody>
        {SIZES.map((s) => (
          <tr key={s.channel} className="border-b border-border-subtle last:border-0">
            <td className="py-2 pr-4 text-text-mid">{s.channel}</td>
            <td className="py-2 text-right tabular-nums text-text-primary">{s.size}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-8 md:px-6 md:py-12">
      <Toaster position="top-center" richColors />
      <header className="max-w-3xl">
        <h1 className="text-3xl font-black tracking-[-0.03em] text-text-primary md:text-4xl">Massive brand kit</h1>
        <p className="mt-2 text-text-mid">
          Logos, colours and type for anything Massive made outside this site, in Canva, Slides, Figma or Docs. To make a
          post image here instead, start in{' '}
          <Link className={link} to="/images">
            Images
          </Link>
          .
        </p>
        <nav className="mt-4 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={button}>
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="rounded-xl border border-border-subtle bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-text-dim">The rules</h2>
        <ol className="mt-3 grid gap-x-8 gap-y-2 text-sm text-text-mid sm:grid-cols-2 lg:grid-cols-3">
          {RULES.map((rule, i) => (
            <li key={rule} className="flex gap-2.5">
              <span className="font-semibold tabular-nums text-brand-light">{i + 1}</span>
              {rule}
            </li>
          ))}
        </ol>
      </div>

      <Section
        id="logos"
        title="Logos"
        intro="The white wordmark on dark grounds, the ink one on light grounds. Use the files as they are: never redraw, recolour or stretch them."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LOGOS.map((l) => (
            <LogoCard key={l.src} logo={l} />
          ))}
        </div>
      </Section>

      <Section id="colours" title="Colours" intro="Click a colour to copy it. One accent per design: red on dark, paper red on light.">
        <Colours />
      </Section>

      <Section id="type" title="Type">
        <Type />
      </Section>

      <div className="grid gap-12 lg:grid-cols-2">
        <Section id="background" title="Background" intro="The background image for the dark register. Don't add gradients of your own.">
          <Background />
        </Section>
        <Section id="sizes" title="Sizes by channel" intro="In pixels, unless it says otherwise.">
          <Sizes />
        </Section>
      </div>

      <Section id="tools" title="Make it here" intro="The tools on this site, which keep all of this for you.">
        <ToolGrid />
      </Section>
    </main>
  )
}
