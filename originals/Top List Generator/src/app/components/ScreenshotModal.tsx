import { useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface ScreenshotModalProps {
  isTakingScreenshot: boolean;
  screenshotUrl: string | null;
  takeScreenshot: () => void;
}

export function ScreenshotModal({
  isTakingScreenshot,
  screenshotUrl,
  takeScreenshot,
}: ScreenshotModalProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [hasSeenInstructions, setHasSeenInstructions] = useState(() => {
    // Check localStorage to see if user has seen the instructions
    return localStorage.getItem('hasSeenScreenshotInstructions') === 'true';
  });

  useEffect(() => {
    // Show instructions the first time user enters preview mode
    const checkPreviewMode = () => {
      const isPreviewMode = !document.querySelector('[data-mode="edit"]');
      
      if (isPreviewMode && !hasSeenInstructions && !showInstructions) {
        // Small delay before showing the modal
        setTimeout(() => {
          setShowInstructions(true);
        }, 500);
      }
    };

    checkPreviewMode();
    
    // Set up observer to detect mode changes
    const observer = new MutationObserver(checkPreviewMode);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [hasSeenInstructions, showInstructions]);

  useEffect(() => {
    // Listen for 'S' key press in preview mode
    const handleKeyPress = (e: KeyboardEvent) => {
      const isPreviewMode = !document.querySelector('[data-mode="edit"]');
      
      // Check if we're not in an input field
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
      
      if (e.key.toLowerCase() === 's' && isPreviewMode && !isInputField) {
        e.preventDefault();
        takeScreenshot();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [takeScreenshot]);

  const handleDismissInstructions = () => {
    setShowInstructions(false);
    setHasSeenInstructions(true);
    localStorage.setItem('hasSeenScreenshotInstructions', 'true');
  };

  // Taking screenshot overlay
  if (isTakingScreenshot) {
    return (
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-lg shadow-xl px-6 py-4 flex items-center gap-3">
          <Camera className="w-5 h-5 text-orange-500 animate-pulse" />
          <span className="text-gray-700 font-medium">Taking screenshot...</span>
        </div>
      </div>
    );
  }

  // Instructions modal
  if (showInstructions) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={handleDismissInstructions}>
        <div 
          className="bg-white rounded-lg shadow-2xl p-6 max-w-sm mx-4 relative animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDismissInstructions}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-orange-500" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Screenshot Tip
              </h3>
              <p className="text-gray-600 text-sm">
                Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">S</kbd> to save a screenshot in Preview mode
              </p>
            </div>
            
            <button
              onClick={handleDismissInstructions}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
