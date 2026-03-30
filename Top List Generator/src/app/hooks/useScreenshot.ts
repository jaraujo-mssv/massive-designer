import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export function useScreenshot(elementRef?: React.RefObject<HTMLElement>) {
  const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const takeScreenshot = async () => {
    try {
      setIsTakingScreenshot(true);
      
      // Wait a brief moment for any UI updates to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use the provided element or fallback to body
      const targetElement = elementRef?.current || document.body;
      
      const canvas = await html2canvas(targetElement, {
        backgroundColor: '#F7F8FD',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Remove or replace modern CSS color functions (oklab, oklch, lab, lch, color, etc.)
          const allElements = clonedDoc.querySelectorAll('*');
          const modernColorFunctions = ['oklab', 'oklch', 'lab', 'lch', 'color'];
          
          allElements.forEach((element) => {
            const el = element as HTMLElement;
            
            // Helper function to check if a color string contains modern color functions
            const hasModernColor = (colorStr: string | null) => {
              if (!colorStr) return false;
              return modernColorFunctions.some(fn => colorStr.includes(fn + '('));
            };
            
            // Get all inline styles
            const inlineStyle = el.style;
            
            // Fix all color-related properties in inline styles
            const colorProperties = [
              'backgroundColor',
              'color',
              'borderColor',
              'borderTopColor',
              'borderRightColor',
              'borderBottomColor',
              'borderLeftColor',
              'outlineColor',
              'textDecorationColor',
              'caretColor',
              'columnRuleColor',
            ];
            
            colorProperties.forEach(prop => {
              const value = inlineStyle.getPropertyValue(prop) || (inlineStyle as any)[prop];
              if (value && hasModernColor(value)) {
                if (prop === 'color') {
                  (inlineStyle as any)[prop] = '#000000';
                } else {
                  (inlineStyle as any)[prop] = 'transparent';
                }
              }
            });
            
            // Also check and clear any CSS variables that might contain modern colors
            if (el.hasAttribute('style')) {
              const styleAttr = el.getAttribute('style') || '';
              if (hasModernColor(styleAttr)) {
                const fixedStyle = styleAttr.replace(/oklch\([^)]+\)/g, 'transparent')
                                            .replace(/oklab\([^)]+\)/g, 'transparent')
                                            .replace(/lch\([^)]+\)/g, 'transparent')
                                            .replace(/lab\([^)]+\)/g, 'transparent')
                                            .replace(/color\([^)]+\)/g, 'transparent');
                el.setAttribute('style', fixedStyle);
              }
            }
          });
          
          // Also remove any stylesheets that might contain modern color functions
          const styleSheets = clonedDoc.querySelectorAll('style');
          styleSheets.forEach(styleSheet => {
            if (styleSheet.textContent && 
                (styleSheet.textContent.includes('oklch(') || 
                 styleSheet.textContent.includes('oklab(') ||
                 styleSheet.textContent.includes('lch(') ||
                 styleSheet.textContent.includes('lab(') ||
                 styleSheet.textContent.includes('color('))) {
              styleSheet.remove();
            }
          });
        },
      });

      // Convert to blob and create download link
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          link.download = `top-list-${timestamp}.png`;
          link.href = url;
          link.click();
          
          // Clean up
          URL.revokeObjectURL(url);
          
          toast.success('Screenshot saved!');
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Screenshot failed:', error);
      toast.error('Failed to take screenshot');
    } finally {
      setIsTakingScreenshot(false);
    }
  };

  return {
    takeScreenshot,
    isTakingScreenshot,
    screenshotUrl,
  };
}