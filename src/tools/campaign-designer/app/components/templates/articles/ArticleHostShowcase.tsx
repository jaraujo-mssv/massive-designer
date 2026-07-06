import { ArticleProps, DIMENSIONS } from './articleTypes';
import { LogoItem } from '../../../types';

const HOST_COLORS: Record<string, string> = {
  Claude:   '#DC785C',
  Cursor:   '#1d1d1f',
  Windsurf: '#03B45F',
  Continue: '#635BFF',
};

const ACCENT = '#d74939';

function HostIcon({ item, size, isLi }: { item: LogoItem; size: number; isLi: boolean }) {
  const bg = HOST_COLORS[item.name] || '#333';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isLi ? 16 : 10 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          background: item.url ? 'transparent' : bg,
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {item.url ? (
          <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 700,
              fontSize: size * 0.42,
              color: '#fff',
            }}
          >
            {item.name[0]}
          </span>
        )}
      </div>
      <span
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: isLi ? 24 : 17,
          color: 'rgba(250,244,236,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {item.name}
      </span>
    </div>
  );
}

export function ArticleHostShowcase({ content, platform }: ArticleProps) {
  const isLi = platform === 'linkedin';
  const { w: W, h: H } = DIMENSIONS[platform];
  const { title, tagline, logos = [], logoUrl, bgImageUrl } = content;

  const iconSize = isLi ? 150 : 100;
  const gap = isLi ? 48 : 36;
  const dockPadding = isLi ? '32px 56px' : '20px 36px';

  return (
    <div
      style={{
        width: W,
        height: H,
        background: '#0d0b10',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isLi ? 80 : 56,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      {bgImageUrl && (
        <img src={bgImageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.28 }} />
      )}

      {/* Subtle radial glow */}
      <div
        style={{
          position: 'absolute',
          width: '60%',
          height: '40%',
          background: `radial-gradient(ellipse, ${ACCENT}26, transparent 70%)`,
          top: '28%',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Title */}
      <h2
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: isLi ? 80 : 52,
          fontWeight: 900,
          color: '#faf4ec',
          margin: 0,
          marginBottom: tagline ? (isLi ? 16 : 10) : (isLi ? 64 : 40),
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          maxWidth: '90%',
          lineHeight: 1.05,
        }}
      >
        {title}
      </h2>

      {tagline && (
        <p
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: isLi ? 26 : 19,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.66)',
            margin: 0,
            marginBottom: isLi ? 56 : 36,
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            maxWidth: '85%',
            lineHeight: 1.25,
          }}
        >
          {tagline}
        </p>
      )}

      {/* Dock container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: dockPadding,
          background: 'rgba(250,244,236,0.06)',
          border: '1px solid rgba(250,244,236,0.12)',
          borderRadius: isLi ? 56 : 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap,
        }}
      >
        {logos.map((item) => (
          <HostIcon key={item.name} item={item} size={iconSize} isLi={isLi} />
        ))}
      </div>

      {/* Massive logo at bottom */}
      {logoUrl && (
        <div style={{ position: 'absolute', bottom: isLi ? 110 : 70, zIndex: 1 }}>
          <img src={logoUrl} alt="Massive" style={{ height: isLi ? 32 : 22 }} />
        </div>
      )}
    </div>
  );
}
