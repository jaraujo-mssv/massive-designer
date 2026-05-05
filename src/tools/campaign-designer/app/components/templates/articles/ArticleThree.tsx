import { ArticleProps, ORANGE_GRADIENT, DIMENSIONS } from './articleTypes';

const LAYOUT = {
  linkedin:          { logoH: 64, titleFs: 110, titleGap: 18, cardW: 260, cardH: 240, cardGap: 24, taglineFs: 36, topGap: 90, botGap: 40, descFs: 22, nameFs: 56, namePadX: 24, padTopY: 28 },
  'twitter-article': { logoH: 32, titleFs: 50,  titleGap: 8,  cardW: 280, cardH: 130, cardGap: 20, taglineFs: 22, topGap: 22, botGap: 22, descFs: 15, nameFs: 36, namePadX: 20, padTopY: 14 },
  twitter:           { logoH: 38, titleFs: 60,  titleGap: 10, cardW: 280, cardH: 160, cardGap: 24, taglineFs: 26, topGap: 30, botGap: 30, descFs: 18, nameFs: 40, namePadX: 24, padTopY: 20 },
} as const;

export function ArticleThree({ content, platform }: ArticleProps) {
  const isLi = platform === 'linkedin';
  const { w: W, h: H } = DIMENSIONS[platform];
  const { title, tagline, endpoints, bgImageUrl, logoUrl } = content;
  const L = LAYOUT[platform];

  // Heights
  const titleTextH = L.titleFs * 1.12;
  const titleBlockH = L.logoH + L.titleGap + titleTextH;
  const taglineH = L.taglineFs * 1.18;
  const totalH = titleBlockH + L.topGap + L.cardH + L.botGap + taglineH;

  // Vertical centering
  const topY = (H - totalH) / 2;
  const titleBlockY = topY;
  const cardsY = topY + titleBlockH + L.topGap;
  const taglineY = cardsY + L.cardH + L.botGap;

  // Horizontal layout for cards
  const totalCardsW = endpoints.length * L.cardW + (endpoints.length - 1) * L.cardGap;
  const cardsX = (W - totalCardsW) / 2;

  // Connector geometry: from bottom-center of title block down to top-center of each card
  const fromX = W / 2;
  const fromY = titleBlockY + titleBlockH;
  const targets = endpoints.map((_, i) => ({
    x: cardsX + i * (L.cardW + L.cardGap) + L.cardW / 2,
    y: cardsY,
  }));

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
      <img src={bgImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.75) 100%)' }} />

      <div style={{ position: 'absolute', inset: 0, ...(isLi && { transform: 'scale(0.9)', transformOrigin: 'center' }) }}>

        {/* Connectors */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {targets.map((t, i) => {
            const midY = (fromY + t.y) / 2;
            const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${t.x} ${midY}, ${t.x} ${t.y}`;
            return <path key={i} d={d} fill="none" stroke="rgba(255,138,90,0.55)" strokeWidth={2} strokeLinecap="round" />;
          })}
        </svg>

        {/* Title block */}
        <div
          style={{
            position: 'absolute',
            top: titleBlockY,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: L.titleGap,
          }}
        >
          <img src={logoUrl} alt="Massive" style={{ height: L.logoH, width: 'auto' }} />
          <div
            style={{
              fontSize: L.titleFs,
              fontWeight: 800,
              background: ORANGE_GRADIENT,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              lineHeight: 1.12,
              letterSpacing: '0.01em',
              textAlign: 'center',
            }}
          >
            {title}
          </div>
        </div>

        {/* Cards row */}
        {endpoints.map((ep, i) => (
          <div
            key={ep.name}
            style={{
              position: 'absolute',
              left: cardsX + i * (L.cardW + L.cardGap),
              top: cardsY,
              width: L.cardW,
              height: L.cardH,
              padding: `${L.padTopY}px ${L.namePadX}px`,
              background: 'rgba(0,0,0,0.67)',
              border: '2px solid transparent',
              backgroundImage: `linear-gradient(rgba(0,0,0,0.67), rgba(0,0,0,0.67)), ${ORANGE_GRADIENT}`,
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isLi ? 14 : 6,
            }}
          >
            <div
              style={{
                fontSize: L.nameFs,
                fontWeight: 800,
                background: ORANGE_GRADIENT,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1.13,
                letterSpacing: '0.01em',
              }}
            >
              {ep.name}
            </div>
            <div
              style={{
                fontSize: L.descFs,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.71)',
                lineHeight: 1.22,
                textAlign: 'center',
                letterSpacing: '0.01em',
              }}
            >
              {ep.description}
            </div>
          </div>
        ))}

        {/* Tagline */}
        <div
          style={{
            position: 'absolute',
            top: taglineY,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: L.taglineFs,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.18,
            letterSpacing: '0.01em',
          }}
        >
          {tagline}
        </div>

      </div>
    </div>
  );
}
