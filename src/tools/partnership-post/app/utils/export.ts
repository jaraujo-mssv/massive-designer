import { domToBlob } from 'modern-screenshot';

export type ExportFormat = 'jpg' | 'png';

// Derive a download base name from the partner image URL: last path segment, no extension.
export const fileNameFromUrl = (url: string): string => {
  if (!url) return 'X-Twitter';
  try {
    const path = new URL(url, window.location.href).pathname;
    const last = path.split('/').pop() || '';
    const name = decodeURIComponent(last).replace(/\.[^.]+$/, '').trim();
    return name || 'X-Twitter';
  } catch {
    return 'X-Twitter';
  }
};

export const exportCanvas = async (
  canvasRef: React.RefObject<HTMLDivElement>,
  format: ExportFormat,
  baseName: string
): Promise<void> => {
  if (!canvasRef.current) {
    throw new Error('Canvas reference not found');
  }

  const blob = await domToBlob(canvasRef.current, {
    width: 1200,
    height: 675,
    style: {
      transform: 'none',
      transformOrigin: 'unset',
    },
    quality: format === 'jpg' ? 0.95 : 1,
    type: format === 'jpg' ? 'image/jpeg' : 'image/png',
  });

  if (!blob) {
    throw new Error('Failed to create blob');
  }

  const filename = `Partnership Post - ${baseName}.${format}`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
