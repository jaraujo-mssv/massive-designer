import { domToBlob } from 'modern-screenshot';
import { ExportFormat, Template } from '../types';

export const exportCanvas = async (
  canvasRef: React.RefObject<HTMLDivElement>,
  template: Template,
  format: ExportFormat,
  designTitle: string
): Promise<void> => {
  if (!canvasRef.current) {
    throw new Error('Canvas reference not found');
  }

  const width = template === 'linkedin' ? 1080 : 1200;
  const height = template === 'linkedin' ? 1350 : 675;

  const blob = await domToBlob(canvasRef.current, {
    width,
    height,
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

  const templateName = template === 'linkedin' ? 'LinkedIn' : 'X-Twitter';
  const filename = `${designTitle} - ${templateName}.${format}`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
