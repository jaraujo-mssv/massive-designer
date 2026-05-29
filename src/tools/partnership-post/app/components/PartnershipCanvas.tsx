import React from 'react';
import { TemplateConfig } from '../constants/templates';
import { MacWindow } from './MacWindow';

interface PartnershipCanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  imageUrl: string;
  template: TemplateConfig;
  onImageLoad?: () => void;
}

interface LockupProps {
  mode: 'dark' | 'light';
  imageUrl: string;
  onImageLoad?: () => void;
  slotWidth: number;
  slotHeight: number;
  timesSize: number;
  fullWidth?: boolean;
}

// The Massive × Partner lockup. Slots cap image height so tall/square images stay balanced.
function Lockup({ mode, imageUrl, onImageLoad, slotWidth, slotHeight, timesSize, fullWidth }: LockupProps) {
  const imgStyle: React.CSSProperties = {
    maxWidth: '100%',
    maxHeight: slotHeight,
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {/* Massive logo — logo-negative.svg (white, dark bg) / logo-positive.svg (dark, light bg); same 290x79 viewBox */}
      <div style={{ width: slotWidth, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={mode === 'light' ? '/logo-positive.svg' : '/logo-negative.svg'} alt="Massive" style={imgStyle} />
      </div>

      <span style={{ fontSize: timesSize, fontWeight: 300, lineHeight: 1, color: 'var(--canvas-text)' }}>×</span>

      {/* Partner logo — fits any aspect ratio / format; 5% horizontal padding */}
      <div style={{ width: slotWidth, padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {imageUrl ? (
          <img src={imageUrl} alt="Partner" crossOrigin="anonymous" onLoad={onImageLoad} style={imgStyle} />
        ) : (
          <div
            style={{
              height: slotHeight,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed var(--canvas-border-15)',
              borderRadius: 12,
              color: 'var(--canvas-text-dim)',
              fontSize: 18,
              textAlign: 'center',
              padding: 16,
            }}
          >
            Partner image
          </div>
        )}
      </div>
    </div>
  );
}

export function PartnershipCanvas({ canvasRef, imageUrl, template, onImageLoad }: PartnershipCanvasProps) {
  const composition = template.framed ? (
    <MacWindow>
      <Lockup mode={template.mode} imageUrl={imageUrl} onImageLoad={onImageLoad} slotWidth={360} slotHeight={300} timesSize={88} />
    </MacWindow>
  ) : (
    <Lockup mode={template.mode} imageUrl={imageUrl} onImageLoad={onImageLoad} slotWidth={500} slotHeight={400} timesSize={112} fullWidth />
  );

  return (
    <div style={{ width: 1200 * 0.5, height: 675 * 0.5 }}>
      <div
        ref={canvasRef}
        className={`canvas-${template.mode} shadow-2xl relative overflow-hidden`}
        style={{
          width: 1200,
          height: 675,
          backgroundColor: 'var(--canvas-bg)',
          backgroundImage: `url(${template.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'scale(0.5)',
          transformOrigin: 'top left',
        }}
      >
        {/* Centered composition */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: template.framed ? 0 : '0 140px',
            // Scale the whole composition per the active template
            transform: `scale(${template.scale})`,
            transformOrigin: 'center center',
          }}
        >
          {composition}
        </div>
      </div>
    </div>
  );
}
