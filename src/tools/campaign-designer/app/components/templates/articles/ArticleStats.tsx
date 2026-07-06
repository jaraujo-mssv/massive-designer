import { ArticleProps, ArticleStat, ORANGE_GRADIENT, DIMENSIONS } from './articleTypes';

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(36,30,30,0.53)',
  border: '2px solid rgba(255,255,255,0.19)',
  borderRadius: 20,
  backdropFilter: 'blur(34px)',
  WebkitBackdropFilter: 'blur(34px)',
};

interface StatCardProps {
  stat: ArticleStat;
  width: number;
  height: number;
  numberSize: number;
  labelSize: number;
  descriptionSize: number;
  padding: string;
  innerGap: number;
  textGap: number;
}

function StatCard({ stat, width, height, numberSize, labelSize, descriptionSize, padding, innerGap, textGap }: StatCardProps) {
  return (
    <div
      style={{
        ...GLASS_CARD,
        width,
        height,
        padding,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: innerGap,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: numberSize,
          fontWeight: 800,
          background: ORANGE_GRADIENT,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          lineHeight: 1.0,
          letterSpacing: '0.01em',
          flexShrink: 0,
        }}
      >
        {stat.value}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: textGap, flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: labelSize, fontWeight: 700, color: '#faf4ec', lineHeight: 1.15 }}>
          {stat.label}
        </div>
        <div style={{ fontSize: descriptionSize, fontWeight: 400, color: 'rgba(255,255,255,0.66)', lineHeight: 1.3 }}>
          {stat.description}
        </div>
      </div>
    </div>
  );
}

export function ArticleStats({ content, platform }: ArticleProps) {
  const isLi = platform === 'linkedin';
  const { w: W, h: H } = DIMENSIONS[platform];
  const { title, tagline, stats = [], bgImageUrl, logoUrl } = content;
  const statsArr = stats as ArticleStat[];

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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isLi
            ? 'radial-gradient(ellipse at 50% 35%, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.72) 100%)'
            : 'radial-gradient(ellipse at 30% 50%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {isLi ? (
        // ── LinkedIn 1080×1080 ─ centered stack: title → 2×2 cards → logo ──
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '100px 110px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 56,
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <div
              style={{
                fontSize: 84,
                fontWeight: 800,
                background: ORANGE_GRADIENT,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1.04,
                letterSpacing: '0.01em',
              }}
            >
              {title}
            </div>
            {tagline && (
              <div style={{ fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,0.72)', lineHeight: 1.2 }}>
                {tagline}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 410px)', gap: 28, justifyContent: 'center' }}>
            {statsArr.map((stat) => (
              <StatCard
                key={`${stat.value}-${stat.label}`}
                stat={stat}
                width={410}
                height={170}
                numberSize={78}
                labelSize={24}
                descriptionSize={16}
                padding="14px 26px"
                innerGap={24}
                textGap={4}
              />
            ))}
          </div>

          <img src={logoUrl} alt="Massive" style={{ height: 32, width: 'auto' }} />
        </div>
      ) : (
        // ── X / Twitter 1200×675 ─ title-left + cards-right with connectors ──
        <TwitterLayout
          title={title}
          tagline={tagline}
          stats={statsArr}
          logoUrl={logoUrl}
        />
      )}
    </div>
  );
}

function TwitterLayout({ title, tagline, stats, logoUrl }: { title: string; tagline?: string; stats: ArticleStat[]; logoUrl: string }) {
  const W = 1200;
  const H = 675;

  // Hero block on the left
  const heroX = 80;
  const heroW = 460;
  const heroH = 320;
  const heroY = (H - heroH) / 2;

  // Stat cards on the right
  const cardW = 444;
  const cardH = 110;
  const cardGap = 14;
  const cardsX = 700;
  const cardsTotalH = cardH * stats.length + cardGap * Math.max(0, stats.length - 1);
  const cardsY = (H - cardsTotalH) / 2;
  const cardTop = (i: number) => cardsY + i * (cardH + cardGap);

  // Connector geometry: from right edge of hero to left edge of each card
  const fromX = heroX + heroW;
  const fromY = heroY + heroH / 2;
  const targets = stats.map((_, i) => ({ x: cardsX, y: cardTop(i) + cardH / 2 }));

  return (
    <>
      {/* Connectors */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {targets.map((t, i) => {
          const midX = (fromX + t.x) / 2;
          const d = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${t.y}, ${t.x} ${t.y}`;
          return <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.19)" strokeWidth={2} strokeLinecap="round" strokeDasharray="6 8" />;
        })}
      </svg>

      {/* Hero block (title + tagline + logo) — centered vertically and horizontally */}
      <div
        style={{
          position: 'absolute',
          left: heroX,
          top: heroY,
          width: heroW,
          height: heroH,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            background: ORANGE_GRADIENT,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1.04,
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </div>
        {tagline && (
          <div style={{ fontSize: 24, fontWeight: 400, color: 'rgba(255,255,255,0.72)', lineHeight: 1.2 }}>
            {tagline}
          </div>
        )}
        <img src={logoUrl} alt="Massive" style={{ height: 28, width: 'auto', marginTop: 8 }} />
      </div>

      {/* Stat cards */}
      {stats.map((stat, i) => (
        <div
          key={`${stat.value}-${stat.label}`}
          style={{
            position: 'absolute',
            left: cardsX,
            top: cardTop(i),
            zIndex: 2,
          }}
        >
          <StatCard
            stat={stat}
            width={cardW}
            height={cardH}
            numberSize={56}
            labelSize={20}
            descriptionSize={13}
            padding="14px 22px"
            innerGap={20}
            textGap={3}
          />
        </div>
      ))}
    </>
  );
}
