import { CampaignTheme, Platform, PostContent } from '../../types';

const LOGO = 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/logo-dark.png';
const JASON_AVATAR = '/web-render-api/jason-grad.jpg';
const VOVA_AVATAR = '/web-render-api/vova.jpg';

interface Props {
  content: PostContent;
  theme: CampaignTheme;
  platform: Platform;
}

function Placeholder({ label, w, h }: { label: string; w: string | number; h: string | number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        background: 'rgba(250,244,236,0.06)',
        border: '2px dashed rgba(250,244,236,0.15)',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(250,244,236,0.3)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 20,
      }}
    >
      {label}
    </div>
  );
}

export function BlogAnnouncement({ content, theme, platform }: Props) {
  const { title, author, authorRole, imageUrl } = content;
  const isLinkedin = platform === 'linkedin';

  if (isLinkedin) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: theme.background,
          display: 'flex',
          flexDirection: 'column',
          padding: 80,
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 64 }}>
          <img src={LOGO} alt="Massive" style={{ height: 90 }} />
          <span style={{ fontFamily: `${theme.bodyFont}, sans-serif`, fontSize: 28, color: theme.bodyColor }}>
            joinmassive.com
          </span>
        </div>

        {/* Hero image */}
        <div style={{ marginBottom: 56, flex: '0 0 auto' }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Blog"
              style={{ width: '100%', height: 480, objectFit: 'cover', borderRadius: 16 }}
            />
          ) : (
            <Placeholder label="Blog image" w="100%" h={480} />
          )}
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: `${theme.headingFont}, sans-serif`,
            fontSize: 80,
            fontWeight: 900,
            color: theme.headingColor,
            lineHeight: 1.1,
            margin: '0 0 40px',
          }}
        >
          {title || 'Blog title goes here'}
        </h1>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(250,244,236,0.15)', marginBottom: 40 }} />

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {author === 'Jason Grad' || author === 'Vova' ? (
            <img
              src={author === 'Jason Grad' ? JASON_AVATAR : VOVA_AVATAR}
              alt={author}
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: theme.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: `${theme.headingFont}, sans-serif`,
                fontSize: 34,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {(author || 'A')[0].toUpperCase()}
            </div>
          )}
          <div>
            <div
              style={{
                fontFamily: `${theme.headingFont}, sans-serif`,
                fontSize: 34,
                fontWeight: 700,
                color: theme.headingColor,
                lineHeight: 1.2,
              }}
            >
              {author || 'Author Name'}
            </div>
            <div
              style={{
                fontFamily: `${theme.bodyFont}, sans-serif`,
                fontSize: 28,
                color: theme.bodyColor,
                marginTop: 4,
              }}
            >
              {authorRole || 'Role'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Twitter landscape
  return (
    <div style={{ width: '100%', height: '100%', background: theme.background, display: 'flex' }}>
      {/* Left: image */}
      <div style={{ flex: '0 0 480px', position: 'relative', overflow: 'hidden' }}>
        {imageUrl ? (
          <img src={imageUrl} alt="Blog" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Placeholder label="image" w="100%" h="100%" />
        )}
      </div>

      {/* Right: content */}
      <div
        style={{
          flex: 1,
          padding: '56px 64px 56px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        <img src={LOGO} alt="Massive" style={{ height: 75, alignSelf: 'flex-start' }} />

        <h1
          style={{
            fontFamily: `${theme.headingFont}, sans-serif`,
            fontSize: 56,
            fontWeight: 900,
            color: theme.headingColor,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {title || 'Blog title goes here'}
        </h1>

        <div>
          <div style={{ height: 1, background: 'rgba(250,244,236,0.15)', marginBottom: 20 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {author === 'Jason Grad' || author === 'Vova' ? (
              <img
                src={author === 'Jason Grad' ? JASON_AVATAR : VOVA_AVATAR}
                alt={author}
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: theme.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: `${theme.headingFont}, sans-serif`,
                  fontSize: 26,
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {(author || 'A')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontFamily: `${theme.headingFont}, sans-serif`, fontSize: 26, fontWeight: 700, color: theme.headingColor }}>
                {author || 'Author Name'}
              </div>
              <div style={{ fontFamily: `${theme.bodyFont}, sans-serif`, fontSize: 20, color: theme.bodyColor }}>
                {authorRole || 'Role'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
