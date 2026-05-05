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

  // Layout per platform — twitter hero card hugs content
  const heroCard = isLi
    ? { x: 90, y: 90, w: 900, h: 460 }
    : isArticle
      ? { x: 80, y: 100, w: 460, h: 300 }
      : { x: 80, y: (H - 280) / 2, w: 460, h: 280 };

  const cardW = isLi ? 900 : 444;
  const cardH = isLi ? 200 : isArticle ? 110 : 130;
  const cardGap = isLi ? 22 : isArticle ? 14 : 18;
  const cardsX = isLi ? 90 : 720;
  const cardsTotalH = cardH * 3 + cardGap * 2;
  const cardsY = isLi ? heroCard.y + heroCard.h + 50 : (H - cardsTotalH) / 2;

  // Connector geometry
  const fromX = isLi ? W / 2 : heroCard.x + heroCard.w;
  const fromY = isLi ? heroCard.y + heroCard.h : heroCard.y + heroCard.h / 2;
  const targets = [0, 1, 2].map((i) => ({
    x: isLi ? cardsX + cardW / 2 : cardsX,
    y: cardsY + cardH / 2 + i * (cardH + cardGap),
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

      <div style={{ position: 'absolute', inset: 0, ...(isLi && { transform: 'scale(0.8)', transformOrigin: 'center' }) }}>

      {/* Connectors — hidden on LinkedIn */}
      {!isLi && (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {targets.map((t, i) => {
            const d = `M ${fromX} ${fromY} C ${(fromX + t.x) / 2} ${fromY}, ${(fromX + t.x) / 2} ${t.y}, ${t.x} ${t.y}`;
            return <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.19)" strokeWidth={2} strokeLinecap="round" />;
          })}
        </svg>
      )}

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
          gap: isLi ? 36 : 22,
          padding: '0 36px',
        }}
      >
        <img src={logoUrl} alt="Massive" style={{ height: isLi ? 96 : isArticle ? 48 : 56, width: 'auto' }} />
        <div
          style={{
            fontSize: isLi ? 88 : isArticle ? 40 : 48,
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
            fontSize: isLi ? 32 : isArticle ? 18 : 20,
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
            left: cardsX,
            top: cardsY + i * (cardH + cardGap),
            width: cardW,
            height: cardH,
            padding: isLi ? '32px 40px' : isArticle ? '16px 28px' : '20px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: isLi ? 12 : isArticle ? 4 : 6,
          }}
        >
          <div
            style={{
              fontSize: isLi ? 64 : isArticle ? 36 : 40,
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
              fontSize: isLi ? 28 : isArticle ? 17 : 20,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.71)',
              lineHeight: 1.18,
            }}
          >
            {ep.description}
          </div>
        </div>
      ))}

      </div>
    </div>
  );
}
