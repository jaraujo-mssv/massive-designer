import { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Campaign } from '../types';
import { ArticleTemplate } from './templates/articles/articleTemplates';
import { exportPostCanvas } from '../utils/export';

interface Props {
  template: ArticleTemplate;
  campaign: Campaign;
  isSelected: boolean;
  onClick: () => void;
}

const LI_W = 1080;
const LI_H = 1350;
const TW_W = 1200;
const TW_H = 675;
const TA_W = 1244;
const TA_H = 500;
const LI_SCALE = 0.3;
const TW_SCALE = 0.38;
const TA_SCALE = 0.38;

type ExportPlatform = 'linkedin' | 'twitter' | 'twitter-article';

export function TemplatePair({ template, campaign, isSelected, onClick }: Props) {
  const liRef = useRef<HTMLDivElement>(null);
  const twRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<ExportPlatform | null>(null);
  const { Component, content, name } = template;

  async function handleExport(platform: ExportPlatform) {
    const ref = platform === 'linkedin' ? liRef : platform === 'twitter' ? twRef : taRef;
    try {
      setExporting(platform);
      await exportPostCanvas(ref, platform, name, campaign.name);
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(null);
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
        {name}
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* LinkedIn */}
        <Canvas
          label="LinkedIn"
          dimensions="1080×1350"
          width={LI_W}
          height={LI_H}
          scale={LI_SCALE}
          ref_={liRef}
          loading={exporting === 'linkedin'}
          onExport={(e) => { e.stopPropagation(); handleExport('linkedin'); }}
        >
          <Component content={content} platform="linkedin" />
        </Canvas>

        {/* Twitter */}
        <Canvas
          label="X / Twitter Post and Blog Post"
          dimensions="1200×675"
          width={TW_W}
          height={TW_H}
          scale={TW_SCALE}
          ref_={twRef}
          loading={exporting === 'twitter'}
          onExport={(e) => { e.stopPropagation(); handleExport('twitter'); }}
        >
          <Component content={content} platform="twitter" />
        </Canvas>

        {/* X / Twitter Article */}
        <Canvas
          label="X / Twitter Article and Email Header"
          dimensions="1244×500"
          width={TA_W}
          height={TA_H}
          scale={TA_SCALE}
          ref_={taRef}
          loading={exporting === 'twitter-article'}
          onExport={(e) => { e.stopPropagation(); handleExport('twitter-article'); }}
        >
          <Component content={content} platform="twitter-article" />
        </Canvas>
      </div>
    </div>
  );
}

interface CanvasProps {
  label: string;
  dimensions: string;
  width: number;
  height: number;
  scale: number;
  ref_: React.RefObject<HTMLDivElement>;
  loading: boolean;
  onExport: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

function Canvas({ label, dimensions, width, height, scale, ref_, loading, onExport, children }: CanvasProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(250,244,236,0.3)', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.4 }}>
        {label}
        <br />
        {dimensions}
      </div>
      <div
        style={{
          width: width * scale,
          height: height * scale,
          overflow: 'hidden',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          flexShrink: 0,
        }}
      >
        <div ref={ref_} style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {children}
        </div>
      </div>
      <button onClick={onExport} disabled={loading} style={EXPORT_BTN(loading)}>
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        Export JPG
      </button>
    </div>
  );
}

const EXPORT_BTN = (loading: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 16px',
  background: loading ? 'rgba(215,73,57,0.3)' : 'rgba(215,73,57,0.15)',
  border: '1px solid rgba(215,73,57,0.4)',
  borderRadius: 8,
  color: '#d74939',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  fontWeight: 600,
  cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.7 : 1,
  transition: 'background 0.15s',
});
