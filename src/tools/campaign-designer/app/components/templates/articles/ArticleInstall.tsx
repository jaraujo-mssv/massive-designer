import { ArticleEndpoint, ArticleProps, DIMENSIONS, ORANGE_GRADIENT } from './articleTypes';

const TRAFFIC_LIGHTS = ['#ff5f57', '#febc2e', '#28c840'];

function TerminalCard({ ep, width, height, isLi }: { ep: ArticleEndpoint; width: number; height: number; isLi: boolean }) {
  const headerH = isLi ? 32 : 26;
  const dotSize = isLi ? 12 : 10;
  const dotGap = isLi ? 8 : 6;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        background: '#1c1b22',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* macOS terminal title bar */}
      <div
        style={{
          height: headerH,
          background: 'rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: isLi ? '0 14px' : '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: dotGap,
          flexShrink: 0,
        }}
      >
        {TRAFFIC_LIGHTS.map((color) => (
          <span
            key={color}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              background: color,
              boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.2)',
            }}
          />
        ))}
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: isLi ? '20px 22px' : '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          gap: isLi ? 12 : 9,
          textAlign: 'left',
          minHeight: 0,
        }}
      >
        <div
          style={{
            fontSize: isLi ? 30 : 22,
            fontWeight: 800,
            color: '#faf4ec',
            lineHeight: 1.1,
            fontFamily: 'Outfit, sans-serif',
            flexShrink: 0,
          }}
        >
          {ep.name}
        </div>
        <div
          style={{
            flex: 1,
            width: '100%',
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: isLi ? '10px 12px' : '8px 10px',
            overflow: 'hidden',
            boxSizing: 'border-box',
            minHeight: 0,
          }}
        >
          <pre
            style={{
              margin: 0,
              fontSize: isLi ? 12 : 10,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.78)',
              lineHeight: 1.45,
              fontFamily: ep.descriptionIsCode ? "'JetBrains Mono', monospace" : 'Outfit, sans-serif',
              whiteSpace: ep.descriptionWrap ? 'pre-wrap' : 'pre',
              wordBreak: ep.descriptionWrap ? 'break-word' : 'normal',
              overflow: 'hidden',
            }}
          >
            {ep.description}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function ArticleInstall({ content, platform }: ArticleProps) {
  const isLi = platform === 'linkedin';
  const { w: W, h: H } = DIMENSIONS[platform];
  const { eyebrow, title, tagline, endpoints = [], bgImageUrl, logoUrl } = content;

  const padX = isLi ? 90 : 80;
  const padY = isLi ? 110 : 64;

  const cardW = isLi ? 290 : 320;
  const cardH = isLi ? 220 : 180;
  const cardGap = isLi ? 28 : 24;

  const sectionGap = isLi ? 56 : 36;

  return (
    <div
      style={{
        width: W,
        height: H,
        background: '#0d0b10',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      <img src={bgImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.41 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 35%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.75) 100%)' }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: `${padY}px ${padX}px`,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: sectionGap,
          zIndex: 1,
        }}
      >
        {/* Eyebrow + title (+ optional tagline) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isLi ? 12 : 8, textAlign: 'center' }}>
          {eyebrow && (
            <div
              style={{
                fontSize: isLi ? 36 : 24,
                fontWeight: 600,
                background: ORANGE_GRADIENT,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1.1,
              }}
            >
              {eyebrow}
            </div>
          )}
          <div
            style={{
              fontSize: isLi ? 88 : 56,
              fontWeight: 800,
              color: '#faf4ec',
              lineHeight: 1.04,
              letterSpacing: '0.005em',
            }}
          >
            {title}
          </div>
          {tagline && (
            <div
              style={{
                fontSize: isLi ? 26 : 20,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.2,
                maxWidth: '85%',
              }}
            >
              {tagline}
            </div>
          )}
        </div>

        {/* Step cards (3 across, terminal style) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: cardGap,
            justifyContent: 'center',
          }}
        >
          {endpoints.map((ep) => (
            <TerminalCard key={ep.name} ep={ep} width={cardW} height={cardH} isLi={isLi} />
          ))}
        </div>

        {/* Massive logo at bottom */}
        <img src={logoUrl} alt="Massive" style={{ height: isLi ? 32 : 22, width: 'auto' }} />
      </div>
    </div>
  );
}
