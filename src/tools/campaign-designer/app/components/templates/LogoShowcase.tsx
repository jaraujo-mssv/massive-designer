import { CampaignTheme, LogoItem, Platform, PostContent } from '../../types';

const LOGO = 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/logo-dark.png';

const LLM_COLORS: Record<string, string> = {
  ChatGPT: '#10A37F',
  Gemini: '#4285F4',
  Perplexity: '#20808D',
  Copilot: '#2165DC',
};

interface Props {
  content: PostContent;
  theme: CampaignTheme;
  platform: Platform;
}

function LogoIcon({ item, size, isLinkedin }: { item: LogoItem; size: number; isLinkedin: boolean }) {
  const bg = LLM_COLORS[item.name] || '#333';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isLinkedin ? 16 : 10 }}>
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
              fontSize: size * 0.35,
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
          fontSize: isLinkedin ? 24 : 17,
          color: 'rgba(250,244,236,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {item.name}
      </span>
    </div>
  );
}

export function LogoShowcase({ content, theme, platform }: Props) {
  const { logos = [], showcaseTitle } = content;
  const isLinkedin = platform === 'linkedin';

  const iconSize = isLinkedin ? 150 : 100;
  const gap = isLinkedin ? 48 : 36;
  const dockPadding = isLinkedin ? '32px 56px' : '20px 36px';

  const displayLogos = logos.length > 0 ? logos : [
    { url: '', name: 'ChatGPT' },
    { url: '', name: 'Gemini' },
    { url: '', name: 'Perplexity' },
    { url: '', name: 'Copilot' },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: theme.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isLinkedin ? 80 : 56,
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: 'absolute',
          width: '60%',
          height: '40%',
          background: `radial-gradient(ellipse, ${theme.accent}18, transparent 70%)`,
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Title above dock */}
      <h2
        style={{
          fontFamily: `${theme.headingFont}, sans-serif`,
          fontSize: isLinkedin ? 80 : 52,
          fontWeight: 900,
          color: theme.headingColor,
          margin: `0 0 ${isLinkedin ? 64 : 40}px`,
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {showcaseTitle || 'One API. Any LLM.'}
      </h2>

      {/* Dock container — logos sit inside */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: dockPadding,
          background: 'rgba(250,244,236,0.06)',
          border: '1px solid rgba(250,244,236,0.12)',
          borderRadius: isLinkedin ? 56 : 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap,
        }}
      >
        {displayLogos.map((item) => (
          <LogoIcon key={item.name} item={item} size={iconSize} isLinkedin={isLinkedin} />
        ))}
      </div>

      {/* Massive logo at bottom */}
      <div style={{ position: 'absolute', bottom: isLinkedin ? 64 : 44 }}>
        <img src={LOGO} alt="Massive" style={{ height: isLinkedin ? 84 : 60 }} />
      </div>
    </div>
  );
}
