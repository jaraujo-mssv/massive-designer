import { ArticleProps, ORANGE_GRADIENT, DIMENSIONS } from './articleTypes';
import { Brain, Search, Globe } from 'lucide-react';

const ICONS = [Brain, Search, Globe];

export function ArticleTwo({ content, platform }: ArticleProps) {
  const isLi = platform === 'linkedin';
  const isArticle = platform === 'twitter-article';
  const { w: W, h: H } = DIMENSIONS[platform];
  const { title, tagline, endpoints, bgImageUrl, logoUrl } = content;

  // Connectors only on Article variant
  const showConnectors = isArticle;

  // ---- LinkedIn: flex column, compact, centered, scaled 80% ----
  if (isLi) {
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
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.55) 100%)' }} />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 36,
            transform: 'scale(0.8)',
            transformOrigin: 'center',
          }}
        >
          {/* Title block: title + logo + tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            <div
              style={{
                fontSize: 86,
                fontWeight: 800,
                background: ORANGE_GRADIENT,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1.05,
                letterSpacing: '0.01em',
                textAlign: 'center',
              }}
            >
              {title}
            </div>
            <img src={logoUrl} alt="Massive" style={{ height: 110, width: 'auto' }} />
            <div
              style={{
                fontSize: 38,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.18,
                letterSpacing: '0.01em',
                textAlign: 'center',
                maxWidth: 800,
              }}
            >
              {tagline}
            </div>
          </div>

          {/* Cards stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {endpoints.map((ep, i) => {
              const Icon = ICONS[i] ?? Brain;
              return (
                <div
                  key={ep.name}
                  style={{
                    width: 880,
                    height: 170,
                    padding: '20px 36px',
                    background: ORANGE_GRADIENT,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 36,
                    boxShadow: '0 4px 24px rgba(215,73,57,0.25)',
                  }}
                >
                  <Icon size={80} color="#ffffff" strokeWidth={2} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    <div style={{ fontSize: 64, fontWeight: 800, color: '#ffffff', lineHeight: 1.05, letterSpacing: '0.01em' }}>
                      {ep.name}
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 600, color: '#0d0e13', lineHeight: 1.18, letterSpacing: '0.01em' }}>
                      {ep.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ---- Twitter / Article: side-by-side absolute layout ----
  const cardW = 444;
  const cardH = isArticle ? 104 : 130;
  const cardGap = isArticle ? 14 : 18;
  const cardsX = 720;
  const cardsTotalH = cardH * 3 + cardGap * 2;
  const cardsY = (H - cardsTotalH) / 2;
  const titleX = 90;
  const titleY = H / 2;

  // Connector geometry (article only)
  const fromX = titleX + 460;
  const fromY = titleY;
  const targets = [0, 1, 2].map((i) => ({
    x: cardsX,
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
      <img src={bgImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.4) 100%)' }} />

      {showConnectors && (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {targets.map((t, i) => {
            const d = `M ${fromX} ${fromY} C ${(fromX + t.x) / 2} ${fromY}, ${(fromX + t.x) / 2} ${t.y}, ${t.x} ${t.y}`;
            return <path key={i} d={d} fill="none" stroke="rgba(255,138,90,0.55)" strokeWidth={2} strokeLinecap="round" />;
          })}
        </svg>
      )}

      {/* Title block */}
      <div
        style={{
          position: 'absolute',
          left: titleX,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            fontSize: isArticle ? 42 : 50,
            fontWeight: 800,
            background: ORANGE_GRADIENT,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1.13,
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </div>
        <img src={logoUrl} alt="Massive" style={{ height: isArticle ? 50 : 64, width: 'auto' }} />
        <div
          style={{
            marginTop: isArticle ? 16 : 24,
            fontSize: isArticle ? 26 : 32,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.18,
            letterSpacing: '0.01em',
            maxWidth: 420,
          }}
        >
          {tagline}
        </div>
      </div>

      {/* Cards */}
      {endpoints.map((ep, i) => {
        const Icon = ICONS[i] ?? Brain;
        return (
          <div
            key={ep.name}
            style={{
              position: 'absolute',
              left: cardsX,
              top: cardsY + i * (cardH + cardGap),
              width: cardW,
              height: cardH,
              padding: isArticle ? '12px 22px' : '14px 24px',
              background: ORANGE_GRADIENT,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: isArticle ? 18 : 22,
              boxShadow: '0 4px 24px rgba(215,73,57,0.25)',
            }}
          >
            <Icon size={isArticle ? 42 : 50} color="#ffffff" strokeWidth={2} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <div style={{ fontSize: isArticle ? 36 : 40, fontWeight: 800, color: '#ffffff', lineHeight: 1.05, letterSpacing: '0.01em' }}>
                {ep.name}
              </div>
              <div style={{ fontSize: isArticle ? 15 : 17, fontWeight: 600, color: '#0d0e13', lineHeight: 1.18, letterSpacing: '0.01em' }}>
                {ep.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
