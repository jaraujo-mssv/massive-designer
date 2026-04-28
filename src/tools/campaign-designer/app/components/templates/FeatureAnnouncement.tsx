import { CampaignTheme, Platform, PostContent } from '../../types';

const LOGO = 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/logo-dark.png';

interface Props {
  content: PostContent;
  theme: CampaignTheme;
  platform: Platform;
}

function TagBadge({ tag, size, padding }: { tag: string; size: number; padding: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: '#d74939',
        color: '#fff',
        fontFamily: 'Outfit, sans-serif',
        fontSize: size,
        fontWeight: 600,
        padding,
        borderRadius: 100,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ fontSize: size * 0.9 }}>✦</span>
      {tag}
    </span>
  );
}

export function FeatureAnnouncement({ content, theme, platform }: Props) {
  const { featureTag, title, imageUrl } = content;
  const isLinkedin = platform === 'linkedin';

  // ── Twitter landscape ──────────────────────────────────────────────
  if (!isLinkedin) {
    return (
      <div style={{ width: '100%', height: '100%', background: theme.background, display: 'flex' }}>
        {/* Left: image */}
        <div style={{ flex: '0 0 480px', position: 'relative', overflow: 'hidden' }}>
          {imageUrl ? (
            <img src={imageUrl} alt="Feature" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'rgba(250,244,236,0.05)',
                border: '2px dashed rgba(250,244,236,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(250,244,236,0.25)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 18,
              }}
            >
              Feature image
            </div>
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
          <img src={LOGO} alt="Massive" style={{ height: 60, alignSelf: 'flex-start' }} />

          <div>
            {featureTag && (
              <div style={{ marginBottom: 20 }}>
                <TagBadge tag={featureTag} size={22} padding="7px 18px" />
              </div>
            )}
            <h1
              style={{
                fontFamily: `${theme.headingFont}, sans-serif`,
                fontSize: 60,
                fontWeight: 900,
                color: theme.headingColor,
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {title || 'Feature title goes here'}
            </h1>
          </div>
        </div>
      </div>
    );
  }

  // ── LinkedIn portrait ──────────────────────────────────────────────
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
        overflow: 'hidden',
      }}
    >
      {/* Tag badge */}
      {featureTag && (
        <div style={{ marginBottom: 40 }}>
          <TagBadge tag={featureTag} size={28} padding="10px 24px" />
        </div>
      )}

      {/* Title */}
      <h1
        style={{
          fontFamily: `${theme.headingFont}, sans-serif`,
          fontSize: 100,
          fontWeight: 900,
          color: theme.headingColor,
          lineHeight: 1.1,
          margin: '0 0 48px',
        }}
      >
        {title || 'Feature title goes here'}
      </h1>

      {/* Feature image */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', marginBottom: 48 }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Feature"
            style={{
              width: '100%',
              height: 400,
              objectFit: 'cover',
              borderRadius: 16,
              boxShadow: `0 0 60px ${theme.accent}33`,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: 400,
              background: 'rgba(250,244,236,0.05)',
              border: '2px dashed rgba(250,244,236,0.15)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(250,244,236,0.25)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 20,
            }}
          >
            Feature screenshot
          </div>
        )}
      </div>

      {/* Massive logo */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <img src={LOGO} alt="Massive" style={{ height: 84 }} />
      </div>
    </div>
  );
}
