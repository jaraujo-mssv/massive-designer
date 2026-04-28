import { useRef, useState } from 'react';
import { Platform } from '../types';
import { exportPostCanvas } from '../utils/export';

export function usePostExport(postName: string, campaignName: string) {
  const linkedinRef = useRef<HTMLDivElement>(null);
  const twitterRef = useRef<HTMLDivElement>(null);
  const [exportingLinkedin, setExportingLinkedin] = useState(false);
  const [exportingTwitter, setExportingTwitter] = useState(false);

  async function handleExport(platform: Platform) {
    const ref = platform === 'linkedin' ? linkedinRef : twitterRef;
    const setExporting = platform === 'linkedin' ? setExportingLinkedin : setExportingTwitter;

    try {
      setExporting(true);
      await exportPostCanvas(ref, platform, postName, campaignName);
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(false);
    }
  }

  return { linkedinRef, twitterRef, exportingLinkedin, exportingTwitter, handleExport };
}
