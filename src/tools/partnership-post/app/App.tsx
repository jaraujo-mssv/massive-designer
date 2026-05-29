import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Sidebar } from './components/Sidebar';
import { PartnershipCanvas } from './components/PartnershipCanvas';
import { exportCanvas, ExportFormat } from './utils/export';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [exporting, setExporting] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

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
      await exportCanvas(canvasRef, format);
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        exporting={exporting}
        onExport={handleExport}
      />

      <div
        className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto gap-4"
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
        <PartnershipCanvas canvasRef={canvasRef} imageUrl={imageUrl} />
      </div>
    </div>
  );
}

export default App;
