import { domToBlob } from 'modern-screenshot';
import { Platform } from '../types';

export async function exportPostCanvas(
  ref: React.RefObject<HTMLDivElement>,
  platform: Platform,
  postName: string,
  campaignName: string
): Promise<void> {
  if (!ref.current) throw new Error('Canvas ref not found');

  const dims = {
    linkedin: { w: 1080, h: 1350, label: 'LinkedIn' },
    twitter: { w: 1200, h: 675, label: 'X-Twitter' },
    'twitter-article': { w: 1244, h: 500, label: 'X-Twitter-Article' },
  } as const;
  const { w: width, h: height, label: platformLabel } = dims[platform];

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
