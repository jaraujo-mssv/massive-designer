import { useState } from 'react';
import { ExportFormat, Template } from '../types';
import { exportCanvas } from '../utils/export';

export function useExport(designTitle: string) {
  const [exportingLinkedin, setExportingLinkedin] = useState(false);
  const [exportingTwitter, setExportingTwitter] = useState(false);

  const handleExportCanvas = async (
    canvasRef: React.RefObject<HTMLDivElement>,
    template: Template,
    format: ExportFormat
  ) => {
    if (template === 'linkedin') {
      setExportingLinkedin(true);
    } else {
      setExportingTwitter(true);
    }

    try {
      await exportCanvas(canvasRef, template, format, designTitle);
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      if (template === 'linkedin') {
        setExportingLinkedin(false);
      } else {
        setExportingTwitter(false);
      }
    }
  };

  return {
    exportingLinkedin,
    exportingTwitter,
    handleExportCanvas,
  };
}
