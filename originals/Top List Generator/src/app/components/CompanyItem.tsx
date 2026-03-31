import { useDrag, useDrop } from "react-dnd";
import { X, Edit2, Upload } from "lucide-react";
import { Company, Settings } from "../App";
import { useState, useRef, useEffect } from "react";

interface CompanyItemProps {
  company: Company;
  columnIndex: number;
  categoryIndex: number;
  companyIndex: number;
  mode: "edit" | "preview";
  settings: Settings;
  onMoveCompany: (
    fromColumnIndex: number,
    fromCategoryIndex: number,
    fromCompanyIndex: number,
    toColumnIndex: number,
    toCategoryIndex: number,
    toCompanyIndex: number
  ) => void;
  onUpdateCompany: (updates: Partial<Company>) => void;
  onDeleteCompany: () => void;
}

export function CompanyItem({
  company,
  columnIndex,
  categoryIndex,
  companyIndex,
  mode,
  settings,
  onMoveCompany,
  onUpdateCompany,
  onDeleteCompany,
}: CompanyItemProps) {
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
      type: "COMPANY",
      item: { columnIndex, categoryIndex, companyIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: mode === "edit",
    }),
    [columnIndex, categoryIndex, companyIndex, mode]
  );

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "COMPANY",
      drop: (item: { columnIndex: number; categoryIndex: number; companyIndex: number }) => {
        if (
          item.columnIndex !== columnIndex ||
          item.categoryIndex !== categoryIndex ||
          item.companyIndex !== companyIndex
        ) {
          onMoveCompany(
            item.columnIndex,
            item.categoryIndex,
            item.companyIndex,
            columnIndex,
            categoryIndex,
            companyIndex
          );
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [columnIndex, categoryIndex, companyIndex, onMoveCompany]
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
        className={`relative group ${isDragging ? "opacity-50" : ""} ${
          isOver && mode === "edit" ? "ring-2 ring-orange-300 rounded" : ""
        }`}
      >
        {/* Delete Button (Edit Mode) */}
        {mode === "edit" && (
          <button
            onClick={onDeleteCompany}
            className="absolute -top-1 -right-1 z-10 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Edit Logo Button (Edit Mode) */}
        {mode === "edit" && (
          <button
            onClick={handleLogoEdit}
            className="absolute -top-1 -left-1 z-10 p-0.5 bg-orange-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            title="Edit logo URL"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        )}

        {/* Horizontal Layout: Position - Logo - Company Name */}
        <div 
          className="flex items-center gap-3"
        >
          {/* Position Number (Left) */}
          <div 
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: `${settings.positionFontSize}px`,
              color: '#283A4C',
              minWidth: `${settings.positionFontSize * 2}px`
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
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  color: '#283A4C'
                }}
              />
            ) : (
              company.position
            )}
          </div>

          {/* Logo (Center) */}
          <div 
            ref={logoRef} 
            className="relative flex-shrink-0" 
            style={{ 
              width: `${settings.logoSize}px`, 
              height: `${settings.logoSize}px`
            }}
          >
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
                    "w-full h-full flex items-center justify-center text-sm font-bold text-gray-400 logo-fallback";
                  fallback.style.borderRadius = "6px";
                  fallback.textContent = company.name.charAt(0).toUpperCase();
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>

          {/* Company Name (Right) */}
          <div className="flex-1 text-left">
            {mode === "edit" ? (
              <input
                type="text"
                value={company.name}
                onChange={(e) => onUpdateCompany({ name: e.target.value })}
                className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-orange-500 rounded px-1"
                style={{ 
                  fontSize: `${settings.companyFontSize}px`,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  color: '#40434B'
                }}
              />
            ) : (
              <p
                className={`px-1 ${
                  settings.showFullNames ? "whitespace-normal break-words" : "truncate"
                }`}
                style={{ 
                  fontSize: `${settings.companyFontSize}px`,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  color: '#40434B'
                }}
              >
                {company.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Floating Modal for Logo URL Editing */}
      {isEditingLogo && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border-2 border-orange-500 p-4"
          style={{
            top: `${modalPosition.top}px`,
            left: `${modalPosition.left}px`,
            minWidth: '300px'
          }}
        >
          <div className="flex flex-col gap-3">
            {/* URL Input Section */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-700">Logo URL or Base64</label>
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
                className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
                autoFocus
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-500">OR</span>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-700">Upload Image</label>
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
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </button>
            </div>

            <div className="text-xs text-gray-500 text-center">Press Enter to save, Esc to cancel</div>
          </div>
        </div>
      )}
    </>
  );
}