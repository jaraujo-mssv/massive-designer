import { useDrag, useDrop } from "react-dnd";
import { X, Edit2, Upload, Tag } from "lucide-react";
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

function SubLogoImg({ logoUrl, name }: { logoUrl: string; name: string }) {
  return (
    <img
      src={logoUrl}
      alt={name}
      className="w-3.5 h-3.5 object-contain rounded-sm"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
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
  const [isEditingSubcompanies, setIsEditingSubcompanies] = useState(false);
  const [subcompanies, setSubcompanies] = useState(company.subcompanies || []);
  const [subName, setSubName] = useState("");
  const [subLogoUrl, setSubLogoUrl] = useState("");
  const logoRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subButtonRef = useRef<HTMLButtonElement>(null);

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
      drag(drop(node));
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

  const handleCompanyClick = () => {
    if (mode === "preview" && company.url) {
      window.open(company.url, '_blank', 'noopener,noreferrer');
    }
  };

  const isClickable = mode === "preview" && company.url;

  const handleSubcompanyAdd = () => {
    if (subName && subLogoUrl) {
      const newSubcompany = {
        id: Date.now().toString(),
        name: subName,
        logoUrl: subLogoUrl,
      };
      setSubcompanies([...subcompanies, newSubcompany]);
      setSubName("");
      setSubLogoUrl("");
    }
  };

  const handleSubcompanyDelete = (id: string) => {
    setSubcompanies(subcompanies.filter((sub) => sub.id !== id));
  };

  const handleSubcompanyEdit = (id: string, name: string, logoUrl: string) => {
    setSubcompanies(
      subcompanies.map((sub) =>
        sub.id === id ? { ...sub, name, logoUrl } : sub
      )
    );
  };

  const handleSubcompanySave = () => {
    onUpdateCompany({ subcompanies });
    setIsEditingSubcompanies(false);
  };

  const handleSubcompanyCancel = () => {
    setSubcompanies(company.subcompanies || []);
    setIsEditingSubcompanies(false);
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
          <>
            <button
              onClick={handleLogoEdit}
              className="absolute -top-1 -left-1 z-10 p-0.5 bg-orange-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              title="Edit logo URL"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            
            {/* Edit Subcompanies Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (subButtonRef.current) {
                  const rect = subButtonRef.current.getBoundingClientRect();
                  setModalPosition({
                    top: rect.bottom + 8,
                    left: rect.left,
                  });
                }
                setIsEditingSubcompanies(!isEditingSubcompanies);
              }}
              ref={subButtonRef}
              className="absolute -top-1 left-6 z-10 p-0.5 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              title="Edit subcompanies"
            >
              <Tag className="w-3 h-3" />
            </button>
          </>
        )}

        {settings.viewMode === "grid" ? (
          /* Grid Layout */
          <div
            onClick={handleCompanyClick}
            className={`${isClickable ? 'cursor-pointer' : ''}`}
          >
            {/* Logo */}
            <div 
              ref={logoRef} 
              className="relative mx-auto"
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
                style={{ borderRadius: '8px' }}
                onError={(e) => {
                  // Fallback to company name initial
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement("div");
                    fallback.className =
                      "w-full h-full flex items-center justify-center text-xl font-bold text-gray-400 logo-fallback";
                    fallback.style.borderRadius = "8px";
                    fallback.textContent = company.name.charAt(0).toUpperCase();
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>

            {/* Company Name */}
            <div className="mt-1.5 text-center">
              {mode === "edit" ? (
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => onUpdateCompany({ name: e.target.value })}
                  className="w-full text-center bg-transparent border-none outline-none focus:ring-1 focus:ring-orange-500 rounded px-1"
                  style={{ 
                    fontSize: `${settings.companyFontSize}px`,
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.85)'
                  }}
                />
              ) : (
                <p
                  className={`px-1 ${
                    settings.showFullNames ? "whitespace-normal break-words" : "truncate"
                  } ${isClickable ? 'hover:text-orange-500 hover:underline transition-colors' : ''}`}
                  style={{ 
                    fontSize: `${settings.companyFontSize}px`,
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.85)'
                  }}
                >
                  {company.name}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* List Layout */
          <div 
            onClick={handleCompanyClick}
            className={`flex items-center ${isClickable ? 'cursor-pointer' : ''}`}
            style={{ 
              gap: `${settings.logoGap}px`,
              paddingTop: `${settings.listItemPadding}px`,
              paddingBottom: `${settings.listItemPadding}px`,
              paddingLeft: `${settings.listItemPadding}px`,
              paddingRight: `${settings.listItemPadding}px`
            }}
          >
            {/* Logo (Left) */}
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
            <div className="flex-1 text-left flex items-center gap-2">
              {mode === "edit" ? (
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => onUpdateCompany({ name: e.target.value })}
                  className="bg-transparent border-none outline-none focus:ring-1 focus:ring-orange-500 rounded px-1 flex-shrink-0"
                  style={{ 
                    fontSize: `${settings.companyFontSize}px`,
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.85)'
                  }}
                />
              ) : (
                <p
                  className={`px-1 flex-shrink-0 ${
                    settings.showFullNames ? "whitespace-normal break-words" : "whitespace-nowrap"
                  } ${isClickable ? 'hover:text-orange-500 hover:underline transition-colors' : ''}`}
                  style={{ 
                    fontSize: `${settings.companyFontSize}px`,
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.85)'
                  }}
                >
                  {company.name}
                </p>
              )}
              
              {/* Subcompanies as labels */}
              {company.subcompanies && company.subcompanies.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {company.subcompanies.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                      title={sub.name}
                    >
                      <SubLogoImg logoUrl={sub.logoUrl} name={sub.name} />
                      <span
                        className="text-xs font-medium"
                        style={{ fontFamily: 'Outfit, sans-serif', color: 'rgba(255,255,255,0.7)' }}
                      >
                        {sub.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Floating Modal for Subcompanies Editing */}
      {isEditingSubcompanies && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border-2 border-orange-500 p-4"
          style={{
            top: `${modalPosition.top}px`,
            left: `${modalPosition.left}px`,
            minWidth: '300px'
          }}
        >
          <div className="flex flex-col gap-3">
            {/* Subcompany Name Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-700">Subcompany Name</label>
              <input
                type="text"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter subcompany name"
                autoFocus
              />
            </div>

            {/* Subcompany Logo URL Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-700">Subcompany Logo URL or Base64</label>
              <textarea
                value={subLogoUrl}
                onChange={(e) => setSubLogoUrl(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="https://example.com/logo.png&#10;or&#10;data:image/jpeg;base64,/9j/4AAQSkZJRg..."
              />
            </div>

            {/* Add Subcompany Button */}
            <button
              ref={subButtonRef}
              onClick={handleSubcompanyAdd}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Add Subcompany
            </button>

            {/* Subcompany List */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-700">Subcompanies</label>
              <div className="flex flex-col gap-1">
                {subcompanies.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between gap-2 px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-full"
                  >
                    <div className="flex items-center gap-1">
                      <SubLogoImg logoUrl={sub.logoUrl} name={sub.name} />
                      <span
                        className="text-xs text-gray-600 font-medium max-w-[60px] truncate"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {sub.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSubcompanyDelete(sub.id)}
                      className="text-xs text-red-500 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save and Cancel Buttons */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleSubcompanySave}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleSubcompanyCancel}
                className="flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}