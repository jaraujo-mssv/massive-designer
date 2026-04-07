import { useDrag, useDrop } from "react-dnd";
import { X, Edit2 } from "lucide-react";
import { Company, Settings } from "../App";
import { useState, useRef, useEffect } from "react";

interface CompanyCardProps {
  company: Company;
  columnIndex: number;
  companyIndex: number;
  mode: "edit" | "preview";
  settings: Settings;
  onMoveCompany: (
    fromColumnIndex: number,
    fromCompanyIndex: number,
    toColumnIndex: number,
    toCompanyIndex: number
  ) => void;
  onUpdateCompany: (updates: Partial<Company>) => void;
  onDeleteCompany: () => void;
  fillHeight?: boolean;
}

export function CompanyCard({
  company,
  columnIndex,
  companyIndex,
  mode,
  settings,
  onMoveCompany,
  onUpdateCompany,
  onDeleteCompany,
  fillHeight,
}: CompanyCardProps) {
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [editedLogoUrl, setEditedLogoUrl] = useState(company.logoUrl);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const logoRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync editedLogoUrl with company.logoUrl when it changes
  useEffect(() => {
    setEditedLogoUrl(company.logoUrl);
  }, [company.logoUrl]);

  // Clean up any fallback elements when logo URL changes
  useEffect(() => {
    if (logoRef.current) {
      // Remove any existing fallback divs
      const fallbacks = logoRef.current.querySelectorAll('.logo-fallback');
      fallbacks.forEach(fallback => fallback.remove());
      
      // Make sure the img element is visible
      const img = logoRef.current.querySelector('img');
      if (img) {
        img.style.display = '';
      }
    }
  }, [company.logoUrl]);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "COMPANY_CARD",
      item: { columnIndex, companyIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: mode === "edit",
    }),
    [columnIndex, companyIndex, mode]
  );

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "COMPANY_CARD",
      drop: (item: { columnIndex: number; companyIndex: number }) => {
        if (
          item.columnIndex !== columnIndex ||
          item.companyIndex !== companyIndex
        ) {
          onMoveCompany(
            item.columnIndex,
            item.companyIndex,
            columnIndex,
            companyIndex
          );
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [columnIndex, companyIndex, onMoveCompany]
  );

  const combineRefs = (node: HTMLDivElement | null) => {
    if (mode === "edit") {
      drag(node);
      drop(node);
    }
  };

  const handleLogoEdit = () => {
    if (!isEditingLogo && logoRef.current) {
      // Calculate position for the modal
      const rect = logoRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    } else if (isEditingLogo && editedLogoUrl !== company.logoUrl) {
      onUpdateCompany({ logoUrl: editedLogoUrl });
    }
    setIsEditingLogo(!isEditingLogo);
  };

  const handleCloseModal = () => {
    if (editedLogoUrl !== company.logoUrl) {
      onUpdateCompany({ logoUrl: editedLogoUrl });
    }
    setIsEditingLogo(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newLogoUrl = reader.result as string;
        onUpdateCompany({ logoUrl: newLogoUrl });
        setIsEditingLogo(false);
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div
        ref={combineRefs}
        className={`relative w-full ${isDragging ? "opacity-50" : ""} ${
          isOver && mode === "edit" ? "ring-2 ring-orange-400" : ""
        }`}
        style={{
          backgroundColor: '#1a1920',
          border: `${settings.cardStrokeSize}px solid #2C2A30`,
          borderRadius: '8px',
          paddingTop: `${settings.cardPaddingY}px`,
          paddingBottom: `${settings.cardPaddingY}px`,
          paddingLeft: '16px',
          paddingRight: '16px',
          minHeight: `${settings.cardMinHeight}px`,
          ...(fillHeight && { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }),
        }}
      >
        {/* Delete Button (Edit Mode) */}
        {mode === "edit" && (
          <button
            onClick={onDeleteCompany}
            className="absolute top-2 right-2 z-10 p-1 bg-red-500 text-white rounded-full opacity-0 hover:opacity-100 transition-opacity shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Horizontal Layout: Position - Logo - Company Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
          {/* Position Number (Left) */}
          <div
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 700,
              fontSize: `${settings.positionFontSize}px`,
              color: '#FAF4EC',
              width: `${settings.positionWidth}px`,
              textAlign: 'center',
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {mode === "edit" ? (
              <input
                type="number"
                value={company.position}
                onChange={(e) => onUpdateCompany({ position: parseInt(e.target.value, 10) || 1 })}
                className="w-full text-center bg-transparent border-none outline-none focus:ring-1 focus:ring-orange-500 rounded px-1"
                style={{
                  fontSize: `${settings.positionFontSize}px`,
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 700,
                  color: '#FAF4EC'
                }}
              />
            ) : (
              company.position
            )}
          </div>

          {/* Logo (Center) */}
          <div 
            ref={logoRef} 
            className="relative flex-shrink-0 group" 
            style={{ 
              width: `${settings.logoSize}px`, 
              height: `${settings.logoSize}px`
            }}
          >
            {/* Edit Logo Button */}
            {mode === "edit" && (
              <button
                onClick={handleLogoEdit}
                className="absolute -top-2 -left-2 z-10 p-1 bg-orange-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                title="Edit logo URL"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
            
            <img
              key={company.logoUrl}
              src={company.logoUrl}
              alt={company.name}
              className="w-full h-full object-contain"
              style={{ borderRadius: '6px' }}
              onError={(e) => {
                // Fallback to company name initial
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement("div");
                  fallback.className =
                    "w-full h-full flex items-center justify-center text-xl font-bold logo-fallback";
                  fallback.style.borderRadius = "6px";
                  fallback.textContent = company.name.charAt(0).toUpperCase();
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>

          {/* Company Name */}
          <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
            {mode === "edit" ? (
              <textarea
                value={company.name}
                onChange={(e) => onUpdateCompany({ name: e.target.value })}
                className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-orange-500 rounded px-1 resize-none overflow-hidden"
                style={{
                  fontSize: `${settings.companyFontSize}px`,
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 400,
                  color: '#FAF4EC',
                  minHeight: `${settings.companyFontSize * 1.5}px`
                }}
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: `${settings.companyFontSize}px`,
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 400,
                  color: '#FAF4EC',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {company.name}
              </div>
            )}
          </div>

          {/* Valuation Pill */}
          {(company.valuation || mode === "edit") && (
            <div style={{ flexShrink: 0 }}>
              {mode === "edit" ? (
                <input
                  type="text"
                  value={company.valuation || ''}
                  onChange={(e) => onUpdateCompany({ valuation: e.target.value || undefined })}
                  placeholder="e.g. $1.2B"
                  className="bg-transparent border border-border-subtle rounded-full outline-none focus:ring-1 focus:ring-orange-500 text-center"
                  style={{
                    fontSize: `${settings.valuationFontSize}px`,
                    fontFamily: 'Outfit, sans-serif',
                    color: '#FAF4EC',
                    padding: '3px 10px',
                    width: '90px',
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: `${settings.valuationFontSize}px`,
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 500,
                    color: '#FAF4EC',
                    backgroundColor: '#2C2A30',
                    border: '1px solid #3D3A45',
                    borderRadius: '999px',
                    padding: '3px 10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {company.valuation}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Modal for Logo URL Editing */}
      {isEditingLogo && (
        <div
          className="fixed z-50 rounded-lg shadow-xl border border-border-subtle p-4"
          style={{
            backgroundColor: '#1a1920',
            top: `${modalPosition.top}px`,
            left: `${modalPosition.left}px`,
            minWidth: '300px'
          }}
        >
          <div className="flex flex-col gap-3">
            {/* URL Input Section */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-dim">Logo URL or Base64</label>
              <textarea
                value={editedLogoUrl}
                onChange={(e) => setEditedLogoUrl(e.target.value)}
                onBlur={handleCloseModal}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCloseModal();
                  }
                  if (e.key === "Escape") {
                    setEditedLogoUrl(company.logoUrl);
                    setIsEditingLogo(false);
                  }
                }}
                placeholder="https://example.com/logo.png&#10;or&#10;data:image/jpeg;base64,/9j/4AAQSkZJRg..."
                className="border border-border-subtle rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-surface text-text-primary"
                rows={3}
                autoFocus
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 text-text-dim" style={{ backgroundColor: '#1a1920' }}>OR</span>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-dim">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                onMouseDown={(e) => e.preventDefault()}
                className="flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-white px-4 py-2 rounded text-sm font-medium transition-opacity"
              >
                <Edit2 className="w-4 h-4" />
                Choose File
              </button>
            </div>

            <div className="text-xs text-text-dim text-center">Press Enter to save, Esc to cancel</div>
          </div>
        </div>
      )}
    </>
  );
}