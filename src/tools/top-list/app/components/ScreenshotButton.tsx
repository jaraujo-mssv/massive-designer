import { Download } from "lucide-react";
import html2canvas from "html2canvas";

interface ScreenshotButtonProps {
  title: string;
}

export function ScreenshotButton({ title }: ScreenshotButtonProps) {
  const handleScreenshot = async () => {
    const canvas = document.getElementById("market-map-canvas");
    if (!canvas) return;

    try {
      const screenshot = await html2canvas(canvas, {
        backgroundColor: "#f9fafb",
        scale: 2,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = screenshot.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
    }
  };

  return (
    <button
      onClick={handleScreenshot}
      className="flex items-center gap-2 px-4 py-3 bg-white text-gray-700 rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <Download className="w-4 h-4" />
      <span className="font-medium">Save PNG</span>
    </button>
  );
}
