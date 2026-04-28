import { CampaignTheme, GeoCountryItem, GeoPickItem, Platform, PostContent } from '../../types';

const LOGO = 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/logo-dark.png';

interface Props {
  content: PostContent;
  theme: CampaignTheme;
  platform: Platform;
}

function OnlyHereBadge({ fontSize, accent }: { fontSize: number; accent: string }) {
  return (
    <div
      style={{
        background: `${accent}18`,
        border: `1px solid ${accent}55`,
        borderRadius: 4,
        padding: `1px ${Math.round(fontSize * 0.5)}px`,
        fontSize,
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 700,
        color: accent,
        whiteSpace: 'nowrap',
        letterSpacing: '0.05em',
        flexShrink: 0,
      }}
    >
      ONLY HERE
    </div>
  );
}

function CountryCard({
  item,
  isLinkedin,
  accent,
  maxPicks,
}: {
  item: GeoCountryItem;
  isLinkedin: boolean;
  accent: string;
  maxPicks: number;
}) {
  const pad = isLinkedin ? 28 : 18;
  const flagSize = isLinkedin ? 34 : 22;
  const nameSize = isLinkedin ? 26 : 17;
  const codeSize = isLinkedin ? 14 : 10;
  const labelSize = isLinkedin ? 13 : 9;
  const pickSize = isLinkedin ? 22 : 15;
  const numSize = isLinkedin ? 17 : 11;
  const badgeSize = isLinkedin ? 11 : 8;
  const itemGap = isLinkedin ? 14 : 9;
  const snippetSize = isLinkedin ? 17 : 0;

  const visiblePicks = item.picks.slice(0, maxPicks);

  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: isLinkedin ? 16 : 10,
        padding: pad,
        display: 'flex',
        flexDirection: 'column',
        gap: isLinkedin ? 20 : 13,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Country header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isLinkedin ? 10 : 7 }}>
        <span style={{ fontSize: flagSize, lineHeight: 1, flexShrink: 0 }}>{item.flag}</span>
        <span
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 700,
            fontSize: nameSize,
            color: '#FAF4EC',
            flex: 1,
            lineHeight: 1.1,
          }}
        >
          {item.country}
        </span>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: codeSize,
            color: 'rgba(250,244,236,0.4)',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            padding: isLinkedin ? '3px 9px' : '2px 6px',
            flexShrink: 0,
          }}
        >
          {item.code}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

      {/* TOP PICKS label */}
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: labelSize,
          fontWeight: 600,
          color: 'rgba(250,244,236,0.3)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Top Picks
      </div>

      {/* Picks list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap }}>
        {visiblePicks.map((pick: GeoPickItem, idx: number) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: isLinkedin ? 10 : 7 }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: numSize,
                color: 'rgba(250,244,236,0.3)',
                width: isLinkedin ? 22 : 14,
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              {idx + 1}.
            </span>
            <span
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: pickSize,
                color: '#FAF4EC',
                fontWeight: 500,
                flex: 1,
                lineHeight: 1.2,
              }}
            >
              {pick.name}
            </span>
            {pick.onlyHere && <OnlyHereBadge fontSize={badgeSize} accent={accent} />}
          </div>
        ))}
      </div>

      {/* Snippet — LinkedIn only */}
      {isLinkedin && item.snippet && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
          <p
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: snippetSize,
              color: 'rgba(250,244,236,0.45)',
              margin: 0,
              lineHeight: 1.6,
              flex: 1,
            }}
          >
            {item.snippet}
          </p>
        </>
      )}
    </div>
  );
}

export function GeoComparison({ content, theme, platform }: Props) {
  const isLinkedin = platform === 'linkedin';
  const { geoPrompt, geoItems = [] } = content;
  const accent = theme.accent;

  const pad = isLinkedin ? 64 : 44;
  const headlineSize = isLinkedin ? 80 : 48;
  const subtitleSize = isLinkedin ? 22 : 14;
  const promptSize = isLinkedin ? 26 : 17;
  const compareSize = isLinkedin ? 22 : 14;
  const statsSize = isLinkedin ? 18 : 12;
  const logoH = isLinkedin ? 84 : 60;
  const cardGap = isLinkedin ? 20 : 14;
  const maxPicks = isLinkedin ? 5 : 4;

  const prompt = geoPrompt || 'best CRM for a small startup';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0E0C0A',
        display: 'flex',
        flexDirection: 'column',
        padding: pad,
        boxSizing: 'border-box',
        gap: 0,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isLinkedin ? 44 : 28,
          flexShrink: 0,
        }}
      >
        <img src={LOGO} alt="Massive" style={{ height: logoH }} />
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: subtitleSize,
            color: 'rgba(250,244,236,0.3)',
          }}
        >
          joinmassive.com
        </span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 900,
          fontSize: headlineSize,
          lineHeight: 1.1,
          marginBottom: isLinkedin ? 20 : 12,
          flexShrink: 0,
        }}
      >
        {isLinkedin ? (
          <>
            <div style={{ color: '#FAF4EC' }}>Same prompt.</div>
            <div style={{ color: '#FAF4EC' }}>Three countries.</div>
            <div style={{ color: accent }}>Different answers.</div>
          </>
        ) : (
          <>
            <div style={{ color: '#FAF4EC' }}>Same prompt. Three countries.</div>
            <div style={{ color: accent }}>Different answers.</div>
          </>
        )}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: subtitleSize,
          color: 'rgba(250,244,236,0.35)',
          marginBottom: isLinkedin ? 32 : 20,
          flexShrink: 0,
        }}
      >
        /ai endpoint · ChatGPT · 3 geos compared
      </div>

      {/* Prompt bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isLinkedin ? 16 : 10,
          background: 'rgba(250,244,236,0.05)',
          border: '1px solid rgba(250,244,236,0.12)',
          borderRadius: isLinkedin ? 12 : 8,
          padding: isLinkedin ? '16px 20px' : '10px 14px',
          marginBottom: isLinkedin ? 16 : 10,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: promptSize,
            color: 'rgba(250,244,236,0.55)',
            flex: 1,
          }}
        >
          {prompt}
        </span>
        <div
          style={{
            background: accent,
            borderRadius: isLinkedin ? 8 : 6,
            padding: isLinkedin ? '10px 22px' : '6px 14px',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 700,
            fontSize: compareSize,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          ▶ Compare
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: statsSize,
          color: 'rgba(250,244,236,0.35)',
          marginBottom: isLinkedin ? 36 : 20,
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#4CAF50' }}>✓ done</span>
        {' · 32.60s · '}
        <span style={{ color: accent }}>18 unique mentions</span>
        {' across 3 geos'}
      </div>

      {/* Country cards */}
      <div
        style={{
          display: 'flex',
          gap: cardGap,
          flex: 1,
          minHeight: 0,
        }}
      >
        {geoItems.map((item, i) => (
          <CountryCard
            key={i}
            item={item}
            isLinkedin={isLinkedin}
            accent={accent}
            maxPicks={maxPicks}
          />
        ))}
      </div>
    </div>
  );
}
