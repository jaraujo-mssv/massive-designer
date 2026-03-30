import { Eye, Edit3 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface ModeToggleProps {
  mode: "edit" | "preview";
  setMode: (mode: "edit" | "preview") => void;
}

export function ModeToggle({ mode, setMode }: ModeToggleProps) {
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Always visible in edit mode
    if (mode === "edit") {
      setIsVisible(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // In preview mode, track mouse movement and clicks
    const showToggle = () => {
      setIsVisible(true);
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Hide after 1 second of inactivity
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 1000);
    };

    // Show toggle on mouse move or click
    window.addEventListener('mousemove', showToggle);
    window.addEventListener('click', showToggle);

    // Initial hide timer
    showToggle();

    return () => {
      window.removeEventListener('mousemove', showToggle);
      window.removeEventListener('click', showToggle);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mode]);

  return (
    <div 
      className={`transition-opacity duration-500 ${isVisible || mode === "edit" ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => setMode("edit")}
          className={`flex items-center gap-2 px-4 py-3 transition-colors ${
            mode === "edit"
              ? "bg-orange-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span className="font-medium">Edit</span>
        </button>
        <button
          onClick={() => setMode("preview")}
          className={`flex items-center gap-2 px-4 py-3 transition-colors ${
            mode === "preview"
              ? "bg-orange-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span className="font-medium">Preview</span>
        </button>
      </div>
    </div>
  );
}