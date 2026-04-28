import { CampaignTheme, Platform, PostContent } from '../../types';

const LOGO = 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/logo-dark.png';

interface Props {
  content: PostContent;
  theme: CampaignTheme;
  platform: Platform;
}

interface Token { text: string; color: string }

const C = {
  keyword: '#FF6B35',
  flag:    '#FFAA5C',
  string:  '#FFD080',
  url:     '#FF9A7A',
  variable:'#FFE4BC',
  punct:   'rgba(250,244,236,0.4)',
  default: '#FAF4EC',
};

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let rem = line;
  let i = 0;

  while (rem.length > 0) {
    if (i++ > 500) break; // safety

    // backslash continuation
    if (rem === '\\') {
      tokens.push({ text: '\\', color: C.punct });
      break;
    }

    // 'curl' keyword
    if (rem.startsWith('curl')) {
      tokens.push({ text: 'curl', color: C.keyword });
      rem = rem.slice(4);
      continue;
    }

    // flag -X, -H, -d
    const flagM = rem.match(/^(-\w+)/);
    if (flagM) {
      tokens.push({ text: flagM[1], color: C.flag });
      rem = rem.slice(flagM[1].length);
      continue;
    }

    // https:// URL
    const urlM = rem.match(/^(https?:\/\/[^\s'"\\]+)/);
    if (urlM) {
      tokens.push({ text: urlM[1], color: C.url });
      rem = rem.slice(urlM[1].length);
      continue;
    }

    // $VARIABLE
    const varM = rem.match(/^(\$\w+)/);
    if (varM) {
      tokens.push({ text: varM[1], color: C.variable });
      rem = rem.slice(varM[1].length);
      continue;
    }

    // single-quoted string
    const sqM = rem.match(/^'([^']*)'/);
    if (sqM) {
      tokens.push({ text: `'${sqM[1]}'`, color: C.string });
      rem = rem.slice(sqM[0].length);
      continue;
    }

    // double-quoted string
    const dqM = rem.match(/^"([^"]*)"/);
    if (dqM) {
      tokens.push({ text: `"${dqM[1]}"`, color: C.string });
      rem = rem.slice(dqM[0].length);
      continue;
    }

    // default: one char
    tokens.push({ text: rem[0], color: C.default });
    rem = rem.slice(1);
  }

  return tokens;
}

function CodeLine({ line, fontSize }: { line: string; fontSize: number }) {
  const tokens = tokenizeLine(line);
  return (
    <div style={{ minHeight: fontSize * 1.6, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', fontFamily: 'JetBrains Mono, monospace' }}>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: t.color, whiteSpace: 'pre', fontFamily: 'JetBrains Mono, monospace' }}>{t.text}</span>
      ))}
    </div>
  );
}

export function Terminal({ content, theme, platform }: Props) {
  const { codeSnippet = '', codeTitle, terminalTitle } = content;
  const isLinkedin = platform === 'linkedin';

  const codeFontSize = isLinkedin ? 32 : 21;
  const padding = isLinkedin ? 80 : 56;
  const windowW = isLinkedin ? 920 : 1088;
  const titleFontSize = isLinkedin ? 68 : 46;

  const lines = codeSnippet.split('\n');

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
        padding,
        boxSizing: 'border-box',
      }}
    >
      {/* Code title */}
      {codeTitle && (
        <h2
          style={{
            fontFamily: `${theme.headingFont}, sans-serif`,
            fontSize: titleFontSize,
            fontWeight: 900,
            color: theme.headingColor,
            margin: `0 0 ${isLinkedin ? 48 : 32}px`,
            textAlign: 'center',
            width: '100%',
          }}
        >
          {codeTitle}
        </h2>
      )}

      {/* Terminal window */}
      <div
        style={{
          width: windowW,
          maxWidth: '100%',
          background: '#1e1e2e',
          borderRadius: isLinkedin ? 16 : 10,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            height: isLinkedin ? 72 : 52,
            background: '#2a2a3e',
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${isLinkedin ? 24 : 18}px`,
            gap: isLinkedin ? 12 : 9,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Traffic lights */}
          {[
            { bg: '#ff5f56' },
            { bg: '#ffbd2e' },
            { bg: '#27c93f' },
          ].map((dot, i) => (
            <div
              key={i}
              style={{
                width: isLinkedin ? 18 : 14,
                height: isLinkedin ? 18 : 14,
                borderRadius: '50%',
                background: dot.bg,
              }}
            />
          ))}
          <span
            style={{
              marginLeft: 'auto',
              marginRight: 'auto',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: codeFontSize,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            {terminalTitle || 'terminal'}
          </span>
        </div>

        {/* Code body */}
        <div
          style={{
            padding: isLinkedin ? '32px 36px' : '20px 24px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: codeFontSize,
            lineHeight: 1.6,
            overflowX: 'hidden',
          }}
        >
          {lines.map((line, i) => (
            <CodeLine key={i} line={line} fontSize={codeFontSize} />
          ))}
        </div>
      </div>

      {/* Massive logo */}
      <div style={{ marginTop: isLinkedin ? 56 : 36 }}>
        <img src={LOGO} alt="Massive" style={{ height: isLinkedin ? 84 : 60 }} />
      </div>
    </div>
  );
}
