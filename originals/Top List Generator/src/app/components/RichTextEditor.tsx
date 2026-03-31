import { useRef, useEffect, useState } from "react";
import { Bold, Italic } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onSelectionChange?: (hasSelection: boolean) => void;
}

export function RichTextEditor({
  value,
  onChange,
  disabled,
  style,
  className,
  onSelectionChange,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  // Update content when value changes externally (only if different)
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;
    
    if (onSelectionChange) {
      onSelectionChange(!!hasSelection);
    }

    // Show floating toolbar if there's a selection within this editor
    if (hasSelection && editorRef.current?.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPosition({
        top: rect.bottom + 8, // Position below the selection with 8px gap
        left: rect.left + rect.width / 2 - 50,
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [onSelectionChange]);

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  };

  return (
    <>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        className={className}
        style={style}
        suppressContentEditableWarning
      />
      
      {/* Floating Toolbar */}
      {showToolbar && !disabled && (
        <div
          className="fixed z-50 flex gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
        >
          <button
            onClick={() => applyFormat("bold")}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat("italic")}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}

export function applyStyle(command: string) {
  document.execCommand(command, false);
}