import { CampaignTheme, Platform, PostContent } from '../../types';

const LOGO = 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/logo-dark.png';

interface Props {
  content: PostContent;
  theme: CampaignTheme;
  platform: Platform;
}

export function HeroImage({ content, theme, platform }: Props) {
  const { heroTitle, heroImageUrl } = content;
  const isLinkedin = platform === 'linkedin';

  const titleFontSize = isLinkedin ? 110 : 78;
  const padding = isLinkedin ? 72 : 52;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: theme.background,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background image */}
      {heroImageUrl ? (
        <img
          src={heroImageUrl}
          alt="Hero"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${theme.surface} 0%, #1a0a1a 50%, #0a0a1a 100%)`,
          }}
        />
      )}

      {/* Dark gradient overlay — stronger at bottom */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.88) 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <h1
          style={{
            fontFamily: `${theme.headingFont}, sans-serif`,
            fontSize: titleFontSize,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.05,
            margin: `0 0 ${isLinkedin ? 48 : 32}px`,
            textShadow: '0 4px 32px rgba(0,0,0,0.5)',
          }}
        >
          {heroTitle || 'Your headline'}
        </h1>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src={LOGO} alt="Massive" style={{ height: isLinkedin ? 84 : 60 }} />
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: isLinkedin ? 22 : 18,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            joinmassive.com
          </span>
        </div>
      </div>
    </div>
  );
}
