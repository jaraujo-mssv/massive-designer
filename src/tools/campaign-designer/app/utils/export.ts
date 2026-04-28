import { domToBlob } from 'modern-screenshot';
import { Platform } from '../types';

export async function exportPostCanvas(
  ref: React.RefObject<HTMLDivElement>,
  platform: Platform,
  postName: string,
  campaignName: string
): Promise<void> {
  if (!ref.current) throw new Error('Canvas ref not found');

  const width = platform === 'linkedin' ? 1080 : 1200;
  const height = platform === 'linkedin' ? 1350 : 675;
  const platformLabel = platform === 'linkedin' ? 'LinkedIn' : 'X-Twitter';

  const blob = await domToBlob(ref.current, {
    width,
    height,
    style: { transform: 'none', transformOrigin: 'unset' },
    quality: 0.95,
    type: 'image/jpeg',
  });

  if (!blob) throw new Error('Failed to create image blob');

  const filename = `${postName} - ${platformLabel} - ${campaignName}.jpg`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
