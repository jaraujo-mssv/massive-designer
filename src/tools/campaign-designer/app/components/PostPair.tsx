import { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Campaign, Post } from '../types';
import { TemplateRenderer } from './TemplateRenderer';
import { exportPostCanvas } from '../utils/export';

interface Props {
  post: Post;
  campaign: Campaign;
  isSelected: boolean;
  onClick: () => void;
}

const LI_W = 1080;
const LI_H = 1350;
const TW_W = 1200;
const TW_H = 675;
const LI_SCALE = 0.3;
const TW_SCALE = 0.38;

export function PostPair({ post, campaign, isSelected, onClick }: Props) {
  const liRef = useRef<HTMLDivElement>(null);
  const twRef = useRef<HTMLDivElement>(null);
  const [exportingLi, setExportingLi] = useState(false);
  const [exportingTw, setExportingTw] = useState(false);

  async function handleExport(platform: 'linkedin' | 'twitter') {
    const ref = platform === 'linkedin' ? liRef : twRef;
    const setLoading = platform === 'linkedin' ? setExportingLi : setExportingTw;
    try {
      setLoading(true);
      await exportPostCanvas(ref, platform, post.name, campaign.name);
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        padding: '28px 32px',
        borderRadius: 16,
        border: `2px solid ${isSelected ? 'rgba(215,73,57,0.6)' : 'rgba(250,244,236,0.06)'}`,
        background: isSelected ? 'rgba(215,73,57,0.05)' : 'rgba(250,244,236,0.02)',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Post name */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          fontWeight: 600,
          color: isSelected ? '#d74939' : 'rgba(250,244,236,0.5)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}
      >
        {post.name}
      </div>

      {/* Canvases row */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* LinkedIn */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'rgba(250,244,236,0.3)',
              letterSpacing: '0.04em',
            }}
          >
            LinkedIn 1080×1350
          </div>
          <div
            style={{
              width: LI_W * LI_SCALE,
              height: LI_H * LI_SCALE,
              overflow: 'hidden',
              borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              flexShrink: 0,
            }}
          >
            <div
              ref={liRef}
              style={{
                width: LI_W,
                height: LI_H,
                transform: `scale(${LI_SCALE})`,
                transformOrigin: 'top left',
              }}
            >
              <TemplateRenderer post={post} theme={campaign.theme} platform="linkedin" />
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleExport('linkedin'); }}
            disabled={exportingLi}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              background: exportingLi ? 'rgba(215,73,57,0.3)' : 'rgba(215,73,57,0.15)',
              border: '1px solid rgba(215,73,57,0.4)',
              borderRadius: 8,
              color: '#d74939',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 600,
              cursor: exportingLi ? 'not-allowed' : 'pointer',
              opacity: exportingLi ? 0.7 : 1,
              transition: 'background 0.15s',
            }}
          >
            {exportingLi ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Export JPG
          </button>
        </div>

        {/* Twitter */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'rgba(250,244,236,0.3)',
              letterSpacing: '0.04em',
            }}
          >
            X / Twitter 1200×675
          </div>
          <div
            style={{
              width: TW_W * TW_SCALE,
              height: TW_H * TW_SCALE,
              overflow: 'hidden',
              borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              flexShrink: 0,
            }}
          >
            <div
              ref={twRef}
              style={{
                width: TW_W,
                height: TW_H,
                transform: `scale(${TW_SCALE})`,
                transformOrigin: 'top left',
              }}
            >
              <TemplateRenderer post={post} theme={campaign.theme} platform="twitter" />
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleExport('twitter'); }}
            disabled={exportingTw}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              background: exportingTw ? 'rgba(215,73,57,0.3)' : 'rgba(215,73,57,0.15)',
              border: '1px solid rgba(215,73,57,0.4)',
              borderRadius: 8,
              color: '#d74939',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 600,
              cursor: exportingTw ? 'not-allowed' : 'pointer',
              opacity: exportingTw ? 0.7 : 1,
              transition: 'background 0.15s',
            }}
          >
            {exportingTw ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Export JPG
          </button>
        </div>
      </div>
    </div>
  );
}
