import { CampaignTheme, Platform, PostContent } from '../../types';
import { CompanyLogo } from '../logos/CompanyLogos';

const MASSIVE_LOGO = 'https://raw.githubusercontent.com/jaraujo-mssv/post-gen/main/logo-dark.png';

interface Props {
  content: PostContent;
  theme: CampaignTheme;
  platform: Platform;
}

export function LogoPair({ content, theme, platform }: Props) {
  const { companyName, imageUrl } = content;
  const isLinkedin = platform === 'linkedin';

  const massiveLogoH = isLinkedin ? 111 : 87;
  const xSize = isLinkedin ? 88 : 64;

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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gradient background at 20% opacity */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.2,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Logos */}
      <div
        style={{
          display: 'flex',
          flexDirection: isLinkedin ? 'column' : 'row',
          alignItems: 'center',
          gap: isLinkedin ? 56 : 52,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Massive logo */}
        <img src={MASSIVE_LOGO} alt="Massive" style={{ height: massiveLogoH, width: 'auto' }} />

        {/* × symbol */}
        <div
          style={{
            fontSize: xSize,
            fontWeight: 300,
            color: 'rgba(250,244,236,0.35)',
            lineHeight: 1,
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          ×
        </div>

        {/* Company logo */}
        <CompanyLogo name={companyName || ''} height={massiveLogoH} />
      </div>

    </div>
  );
}
