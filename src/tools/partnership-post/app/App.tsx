import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { SidebarLayout } from '@/shared/components/SidebarLayout';
import { useFitScale } from '@/shared/canvas/useFitScale';
import { ExportButtons, PostSettings, Sidebar } from './components/Sidebar';
import { PartnershipCanvas } from './components/PartnershipCanvas';
import { exportCanvas, fileNameFromUrl, ExportFormat } from './utils/export';
import { TEMPLATES, TemplateId, resolveTemplate } from './constants/templates';

function App() {
  const [searchParams] = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [exporting, setExporting] = useState(false);
  const [template, setTemplate] = useState<TemplateId>(resolveTemplate(searchParams));

  const canvasRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // Fits the preview and its heading (about 100px at full size) to the area,
  // but never above the half size it has always had.
  const scale = Math.min(0.5, useFitScale(previewRef, 1200, 775));

  const autoDownload = searchParams.get('jpg') === '1';
  const didAutoDownload = useRef(false);

  // Auto-load image URL from ?e= param
  useEffect(() => {
    const url = searchParams.get('e');
    if (url) {
      setImageUrl(url);
    }
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      await exportCanvas(canvasRef, format, fileNameFromUrl(imageUrl), TEMPLATES[template].label);
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      setExporting(false);
    }
  };

  // Auto-download a JPG once when ?jpg=1 is present (fired after the partner
  // image loads, or shortly after mount when there is no image).
  const triggerAutoDownload = () => {
    if (!autoDownload || didAutoDownload.current) return;
    didAutoDownload.current = true;
    requestAnimationFrame(() => handleExport('jpg'));
  };

  useEffect(() => {
    if (!autoDownload || imageUrl) return;
    const id = setTimeout(triggerAutoDownload, 300);
    return () => clearTimeout(id);
  }, [autoDownload, imageUrl]);

  const settings = { imageUrl, setImageUrl, template, setTemplate };

  return (
    <SidebarLayout
      sidebar={
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          {...settings}
          exporting={exporting}
          onExport={handleExport}
        />
      }
      drawerTitle="Partnership Post"
      drawerContent={<PostSettings {...settings} />}
      drawerOpen={drawerOpen}
      onDrawerOpenChange={setDrawerOpen}
      barAction={<ExportButtons exporting={exporting} onExport={handleExport} />}
    >
      <div
        ref={previewRef}
        className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 md:p-8 gap-4 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(rgba(250, 244, 236, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(250, 244, 236, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          backgroundColor: '#242333',
        }}
      >
        <h3 className="text-lg font-semibold text-text-primary">X/Twitter (1200x675)</h3>
        <PartnershipCanvas
          canvasRef={canvasRef}
          imageUrl={imageUrl}
          template={TEMPLATES[template]}
          onImageLoad={triggerAutoDownload}
          scale={scale}
        />
      </div>
    </SidebarLayout>
  );
}

export default App;
