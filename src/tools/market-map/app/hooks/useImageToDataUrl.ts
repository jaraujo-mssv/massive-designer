// Moved to @/shared/utils/imageDataUrl — the dither renderer needs the same
// proxy-and-decode path. Re-exported here so this tool's imports keep working.
export {
  loadAsDataUrl,
  useImageToDataUrl,
  preloadImagesToDataUrls,
} from '@/shared/utils/imageDataUrl';
