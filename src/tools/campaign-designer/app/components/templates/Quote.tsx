import { CampaignTheme, Platform, PostContent } from '../../types';

const LOGO = 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/logo-dark.png';

interface Props {
  content: PostContent;
  theme: CampaignTheme;
  platform: Platform;
}

export function Quote({ content, theme, platform }: Props) {
  const { quoteText, quoteAuthor, quoteRole } = content;
  const isLinkedin = platform === 'linkedin';

  const quoteFontSize = isLinkedin ? 76 : 52;
  const quoteMarkSize = isLinkedin ? 260 : 170;
  const padding = isLinkedin ? 80 : 56;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: theme.background,
        display: 'flex',
        flexDirection: 'column',
        padding,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Content centered vertically */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Decorative quote mark above text */}
        <div
          style={{
            fontSize: quoteMarkSize,
            lineHeight: 0.75,
            color: theme.accent,
            opacity: 0.25,
            fontFamily: 'Georgia, serif',
            fontWeight: 700,
            pointerEvents: 'none',
            userSelect: 'none',
            marginBottom: isLinkedin ? 16 : 10,
          }}
        >
          "
        </div>

        {/* Quote text */}
        <p
          style={{
            fontFamily: `${theme.headingFont}, sans-serif`,
            fontSize: quoteFontSize,
            fontWeight: 700,
            color: theme.headingColor,
            lineHeight: 1.2,
            margin: '0 0 48px',
          }}
        >
          {quoteText || 'Your quote goes here.'}
        </p>

        {/* Divider */}
        <div
          style={{
            width: isLinkedin ? 80 : 56,
            height: 3,
            background: theme.accent,
            marginBottom: 32,
            borderRadius: 2,
          }}
        />

        {/* Author */}
        <div>
          <div
            style={{
              fontFamily: `${theme.headingFont}, sans-serif`,
              fontSize: isLinkedin ? 38 : 28,
              fontWeight: 700,
              color: theme.headingColor,
              lineHeight: 1.2,
            }}
          >
            {quoteAuthor || 'Author Name'}
          </div>
          {quoteRole && (
            <div
              style={{
                fontFamily: `${theme.bodyFont}, sans-serif`,
                fontSize: isLinkedin ? 28 : 20,
                color: theme.bodyColor,
                marginTop: 6,
              }}
            >
              {quoteRole}
            </div>
          )}
        </div>
      </div>

      {/* Massive logo at bottom */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
        <img src={LOGO} alt="Massive" style={{ height: isLinkedin ? 84 : 60 }} />
      </div>
    </div>
  );
}
