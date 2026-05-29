import { domToBlob } from 'modern-screenshot';

export type ExportFormat = 'jpg' | 'png';

export const exportCanvas = async (
  canvasRef: React.RefObject<HTMLDivElement>,
  format: ExportFormat
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

  const filename = `Partnership Post - X-Twitter.${format}`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
