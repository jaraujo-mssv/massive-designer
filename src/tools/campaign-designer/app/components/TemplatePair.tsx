import { useRef, useState } from 'react';
import { Download, Loader2, Copy, Check } from 'lucide-react';
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
const LI_H = 1080;
const TW_W = 1200;
const TW_H = 675;
const TA_W = 1244;
const TA_H = 500;
const BE_W = 1200;
const BE_H = 675;
const LI_SCALE = 0.3;
const TW_SCALE = 0.38;
const TA_SCALE = 0.38;
const BE_SCALE = 0.38;

type ExportPlatform = 'linkedin' | 'twitter' | 'twitter-article' | 'blog-email';

export function TemplatePair({ template, campaign, isSelected, onClick }: Props) {
  const liRef = useRef<HTMLDivElement>(null);
  const twRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLDivElement>(null);
  const beRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<ExportPlatform | null>(null);
  const [copiedCaption, setCopiedCaption] = useState<'linkedin' | 'x' | null>(null);
  const { Component, content, name, platforms, linkedinCopy, xCopy } = template;
  const showPlatform = (p: ExportPlatform) => !platforms || platforms.includes(p);

  function handleCopyCaption(kind: 'linkedin' | 'x', text: string) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!text) return;
      navigator.clipboard.writeText(text);
      setCopiedCaption(kind);
      setTimeout(() => setCopiedCaption(null), 1500);
    };
  }

  async function handleExport(platform: ExportPlatform) {
    const ref =
      platform === 'linkedin' ? liRef :
      platform === 'twitter' ? twRef :
      platform === 'twitter-article' ? taRef :
      beRef;
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
        {showPlatform('linkedin') && (
          <Canvas
            label="LinkedIn"
            dimensions="1080×1080"
            width={LI_W}
            height={LI_H}
            scale={LI_SCALE}
            ref_={liRef}
            loading={exporting === 'linkedin'}
            onExport={(e) => { e.stopPropagation(); handleExport('linkedin'); }}
          >
            <Component content={content} platform="linkedin" />
          </Canvas>
        )}

        {/* Twitter */}
        {showPlatform('twitter') && (
          <Canvas
            label="X / Twitter Post"
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
        )}

        {/* X / Twitter Article */}
        {showPlatform('twitter-article') && (
          <Canvas
            label="X / Twitter Article"
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
        )}

        {/* Blog Post and Email Header */}
        {showPlatform('blog-email') && (
          <Canvas
            label="Blog Post and Email Header"
            dimensions="1200×675"
            width={BE_W}
            height={BE_H}
            scale={BE_SCALE}
            ref_={beRef}
            loading={exporting === 'blog-email'}
            onExport={(e) => { e.stopPropagation(); handleExport('blog-email'); }}
          >
            <Component content={content} platform="blog-email" />
          </Canvas>
        )}
      </div>

      {(linkedinCopy || xCopy) && (
        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
          {linkedinCopy && (
            <CaptionBlock
              label="LinkedIn Caption"
              value={linkedinCopy}
              copied={copiedCaption === 'linkedin'}
              onCopy={handleCopyCaption('linkedin', linkedinCopy)}
              flex={3}
            />
          )}
          {xCopy && (
            <CaptionBlock
              label="X Caption"
              value={xCopy}
              copied={copiedCaption === 'x'}
              onCopy={handleCopyCaption('x', xCopy)}
              flex={2}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface CaptionBlockProps {
  label: string;
  value: string;
  copied: boolean;
  onCopy: (e: React.MouseEvent) => void;
  flex: number;
}

function CaptionBlock({ label, value, copied, onCopy, flex }: CaptionBlockProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex, minWidth: 280 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(250,244,236,0.5)',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
        <button onClick={onCopy} style={COPY_BTN(copied)}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <textarea
        readOnly
        value={value}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          minHeight: 280,
          resize: 'vertical',
          background: 'rgba(250,244,236,0.04)',
          border: '1px solid rgba(250,244,236,0.1)',
          borderRadius: 8,
          padding: '12px 14px',
          color: 'rgba(250,244,236,0.85)',
          fontFamily: 'Outfit, sans-serif',
          fontSize: 13,
          lineHeight: 1.5,
          boxSizing: 'border-box',
          flex: 1,
        }}
      />
    </div>
  );
}

const COPY_BTN = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  background: active ? 'rgba(39,201,63,0.15)' : 'rgba(250,244,236,0.06)',
  border: `1px solid ${active ? 'rgba(39,201,63,0.4)' : 'rgba(250,244,236,0.12)'}`,
  borderRadius: 6,
  color: active ? '#27c93f' : 'rgba(250,244,236,0.7)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
});

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
