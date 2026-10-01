import { useEffect, useRef, useState } from 'react';
import ReactCrop, { PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import type { SquareMode } from '../utils/encode';

/** Checkerboard behind transparent images, in the app's dark tones. */
export const CHECKERBOARD = 'repeating-conic-gradient(#2a2933 0% 25%, #1f1e26 0% 50%) 50% / 16px 16px';

/** Small images are shown up to this many times their size, so they can still be cropped. */
const MAX_ZOOM = 4;

interface StageProps {
  src: string;
  natural: { width: number; height: number };
  mode: SquareMode;
  crop: PercentCrop | undefined;
  onCropChange: (crop: PercentCrop) => void;
  /** Fired when a drag ends; the output is encoded from this crop. */
  onCropComplete: (crop: PercentCrop) => void;
}

/**
 * The image, as large as the area allows: with a square crop box to drag in
 * Crop mode, or framed as a square (what Fit produces) in Fit mode.
 */
export function Stage({ src, natural, mode, crop, onCropChange, onCropComplete }: StageProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ready = box.w > 0 && box.h > 0;
  const zoom = Math.min(box.w / natural.width, box.h / natural.height, MAX_ZOOM);
  const frame = Math.min(box.w, box.h);

  return (
    <div ref={boxRef} className="absolute inset-0 flex items-center justify-center">
      {ready && mode === 'crop' && (
        <ReactCrop
          crop={crop}
          aspect={1}
          keepSelection
          onChange={(_, percent) => onCropChange(percent)}
          onComplete={(_, percent) => onCropComplete(percent)}
          style={{ background: CHECKERBOARD }}
        >
          <img
            src={src}
            alt="Source"
            draggable={false}
            style={{ display: 'block', width: natural.width * zoom, height: natural.height * zoom }}
          />
        </ReactCrop>
      )}
      {ready && mode === 'fit' && (
        <div
          className="flex items-center justify-center rounded-md border border-border-subtle"
          style={{ width: frame, height: frame, background: CHECKERBOARD }}
        >
          <img src={src} alt="Source" draggable={false} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}

/** The output on a checkerboard, light and dark, so transparency and contrast both show. */
export function ResultPreview({ dataUrl, side }: { dataUrl: string; side: number }) {
  const display = Math.min(side, 96);
  const tiles = [
    { label: 'Transparent', background: CHECKERBOARD },
    { label: 'Light', background: '#f6f0e8' },
    { label: 'Dark', background: '#221f27' },
  ];
  return (
    <div className="flex items-end justify-center gap-4">
      {tiles.map((t) => (
        <div key={t.label} className="flex flex-col items-center gap-1.5">
          <div
            className="flex items-center justify-center rounded-md border border-border-subtle p-2"
            style={{ background: t.background }}
          >
            {dataUrl ? (
              <img src={dataUrl} alt={`Result on ${t.label.toLowerCase()}`} style={{ width: display, height: display }} />
            ) : (
              <div style={{ width: display, height: display }} />
            )}
          </div>
          <span className="text-[10px] font-mono text-text-dim">{t.label}</span>
        </div>
      ))}
    </div>
  );
}
