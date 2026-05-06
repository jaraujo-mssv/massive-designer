import { ArticleProps, ORANGE_GRADIENT, DIMENSIONS } from './articleTypes';

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(36,30,30,0.53)',
  border: '2px solid rgba(255,255,255,0.19)',
  borderRadius: 20,
  backdropFilter: 'blur(34px)',
  WebkitBackdropFilter: 'blur(34px)',
};

export function ArticleOne({ content, platform }: ArticleProps) {
  const isLi = platform === 'linkedin';
  const isArticle = platform === 'twitter-article';
  const { w: W, h: H } = DIMENSIONS[platform];
  const { title, tagline, endpoints, bgImageUrl, logoUrl } = content;

  // Layout per platform
  // LinkedIn: hero (720×380) + 90 gap + cards (h=240) = 710 total, centered vertically
  const liHeroH = 380;
  const liCardH = 240;
  const liGap = 90;
  const liTopY = (H - (liHeroH + liGap + liCardH)) / 2;

  const heroCard = isLi
    ? { x: (W - 720) / 2, y: liTopY, w: 720, h: liHeroH }
    : isArticle
      ? { x: 80, y: 100, w: 460, h: 300 }
      : { x: 80, y: (H - 280) / 2, w: 460, h: 280 };

  // Cards: stacked vertically on twitter/article, side-by-side on LinkedIn
  const cardW = isLi ? 290 : 444;
  const cardH = isLi ? 240 : isArticle ? 110 : 130;
  const cardGap = isLi ? 30 : isArticle ? 14 : 18;
  const cardsTotalW = cardW * 3 + cardGap * 2;
  const cardsTotalH = cardH * 3 + cardGap * 2;

  const cardsX = isLi ? (W - cardsTotalW) / 2 : 720;
  const cardsY = isLi ? heroCard.y + heroCard.h + 90 : (H - cardsTotalH) / 2;

  // Per-card position
  const cardLeft = (i: number) => isLi ? cardsX + i * (cardW + cardGap) : cardsX;
  const cardTop = (i: number) => isLi ? cardsY : cardsY + i * (cardH + cardGap);

  // Connector geometry
  const fromX = isLi ? W / 2 : heroCard.x + heroCard.w;
  const fromY = isLi ? heroCard.y + heroCard.h : heroCard.y + heroCard.h / 2;
  const targets = [0, 1, 2].map((i) => ({
    x: isLi ? cardLeft(i) + cardW / 2 : cardsX,
    y: isLi ? cardTop(i) : cardTop(i) + cardH / 2,
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
      <img src={bgImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.41 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.7) 100%)' }} />

      {/* Connectors */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {targets.map((t, i) => {
          const d = isLi
            ? `M ${fromX} ${fromY} C ${fromX} ${(fromY + t.y) / 2}, ${t.x} ${(fromY + t.y) / 2}, ${t.x} ${t.y}`
            : `M ${fromX} ${fromY} C ${(fromX + t.x) / 2} ${fromY}, ${(fromX + t.x) / 2} ${t.y}, ${t.x} ${t.y}`;
          return <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.19)" strokeWidth={2} strokeLinecap="round" strokeDasharray="6 8" />;
        })}
      </svg>

      {/* Hero card */}
      <div
        style={{
          ...GLASS_CARD,
          position: 'absolute',
          left: heroCard.x,
          top: heroCard.y,
          width: heroCard.w,
          height: heroCard.h,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isLi ? 28 : 22,
          padding: '0 36px',
        }}
      >
        <img src={logoUrl} alt="Massive" style={{ height: isLi ? 80 : isArticle ? 48 : 56, width: 'auto' }} />
        <div
          style={{
            fontSize: isLi ? 76 : isArticle ? 40 : 48,
            fontWeight: 800,
            background: ORANGE_GRADIENT,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1.13,
            letterSpacing: '0.01em',
            textAlign: 'center',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: isLi ? 28 : isArticle ? 18 : 20,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.71)',
            lineHeight: 1.18,
            textAlign: 'center',
          }}
        >
          {tagline}
        </div>
      </div>

      {/* Endpoint cards */}
      {endpoints.map((ep, i) => (
        <div
          key={ep.name}
          style={{
            ...GLASS_CARD,
            position: 'absolute',
            left: cardLeft(i),
            top: cardTop(i),
            width: cardW,
            height: cardH,
            padding: isLi ? '24px 20px' : isArticle ? '16px 28px' : '20px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isLi ? 'center' : 'stretch',
            justifyContent: 'center',
            gap: isLi ? 14 : isArticle ? 4 : 6,
          }}
        >
          <div
            style={{
              fontSize: isLi ? 56 : isArticle ? 36 : 40,
              fontWeight: 800,
              background: ORANGE_GRADIENT,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              lineHeight: 1.13,
              letterSpacing: '0.01em',
              textAlign: isLi ? 'center' : 'left',
            }}
          >
            {ep.name}
          </div>
          <div
            style={{
              fontSize: isLi ? 22 : isArticle ? 17 : 20,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.71)',
              lineHeight: 1.22,
              textAlign: isLi ? 'center' : 'left',
            }}
          >
            {ep.description}
          </div>
        </div>
      ))}
    </div>
  );
}
