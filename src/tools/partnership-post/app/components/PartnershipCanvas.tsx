import React from 'react';

// Each logo slot is ~30% of the 1200px canvas width, with a height cap so tall/square images stay balanced.
const SLOT_WIDTH = 360;
const SLOT_HEIGHT = 280;

interface PartnershipCanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  imageUrl: string;
  onImageLoad?: () => void;
}

export function PartnershipCanvas({ canvasRef, imageUrl, onImageLoad }: PartnershipCanvasProps) {
  return (
    <div style={{ width: 1200 * 0.5, height: 675 * 0.5 }}>
      <div
        ref={canvasRef}
        className="canvas-dark shadow-2xl relative overflow-hidden"
        style={{
          width: 1200,
          height: 675,
          backgroundColor: 'var(--canvas-bg)',
          backgroundImage: 'var(--canvas-export-bg-image)',
          backgroundSize: 'var(--canvas-export-bg-size)',
          backgroundPosition: 'center',
          transform: 'scale(0.5)',
          transformOrigin: 'top left',
        }}
      >
        {/* Centered content row */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 80,
            padding: '0 100px',
          }}
        >
          {/* Massive logo — 30% of canvas width */}
          <div style={{ width: SLOT_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="/logo.svg"
              alt="Massive"
              style={{ maxWidth: '100%', maxHeight: SLOT_HEIGHT, width: 'auto', height: 'auto', objectFit: 'contain' }}
            />
          </div>

          <span
            style={{
              fontSize: 80,
              fontWeight: 300,
              lineHeight: 1,
              color: '#faf4ec',
            }}
          >
            ×
          </span>

          {/* Partner logo — 30% of canvas width, fits any aspect ratio / format */}
          <div style={{ width: SLOT_WIDTH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Partner"
                crossOrigin="anonymous"
                onLoad={onImageLoad}
                style={{ maxWidth: '100%', maxHeight: SLOT_HEIGHT, width: 'auto', height: 'auto', objectFit: 'contain' }}
              />
            ) : (
              <div
                style={{
                  height: SLOT_HEIGHT,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed rgba(250, 244, 236, 0.4)',
                  borderRadius: 12,
                  color: 'rgba(250, 244, 236, 0.6)',
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
      </div>
    </div>
  );
}
