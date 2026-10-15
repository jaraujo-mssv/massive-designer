import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Company, Settings } from "../App";

interface AddCompanyPanelProps {
  onAddCompany: (company: Company) => void;
  viewMode?: "grid" | "list";
  settings?: Settings;
}

const darkInput = "w-full px-2 py-1.5 text-xs rounded focus:outline-none focus:ring-1 focus:ring-orange-500";
const darkInputStyle = { backgroundColor: '#0d0c17', border: '1px solid #2C2A30', color: '#FAF4EC' };

export function AddCompanyPanel({ onAddCompany, viewMode = "grid" }: AddCompanyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [url, setUrl] = useState("");
  const [subcompanies, setSubcompanies] = useState<Array<{ id: string; name: string; logoUrl: string }>>([]);
  const [subName, setSubName] = useState("");
  const [subLogoUrl, setSubLogoUrl] = useState("");

  const handleAddSubcompany = () => {
    if (!subName || !subLogoUrl || subcompanies.length >= 8) return;

    setSubcompanies([...subcompanies, {
      id: `sub-${Date.now()}-${Math.random()}`,
      name: subName,
      logoUrl: subLogoUrl
    }]);
    setSubName("");
    setSubLogoUrl("");
  };

  const handleRemoveSubcompany = (id: string) => {
    setSubcompanies(subcompanies.filter(sub => sub.id !== id));
  };

  const handleSubmit = () => {
    if (!name || !logoUrl) return;

    const newCompany: Company = {
      id: `company-${Date.now()}`,
      name,
      logoUrl,
      url: url || undefined,
      subcompanies: subcompanies.length > 0 ? subcompanies : undefined
    };

    onAddCompany(newCompany);
    setName("");
    setLogoUrl("");
    setUrl("");
    setSubcompanies([]);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          viewMode === "list" ? "w-full py-2" : "w-full aspect-square"
        }`}
        style={{ borderColor: '#2C2A30', backgroundColor: 'transparent' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(250,244,236,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2C2A30')}
      >
        <Plus className="w-6 h-6" style={{ color: 'rgba(250,244,236,0.3)' }} />
      </button>
    );
  }

  return (
    <div className="col-span-full p-3 rounded-lg" style={{ backgroundColor: '#0d0c17', border: '1px solid #2C2A30' }}>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Company name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={darkInput}
          style={{ ...darkInputStyle, '::placeholder': { color: 'rgba(250,244,236,0.3)' } } as React.CSSProperties}
        />
        <input
          type="text"
          placeholder="Logo URL"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className={darkInput}
          style={darkInputStyle}
        />
        <input
          type="text"
          placeholder="Company URL (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={darkInput}
          style={darkInputStyle}
        />

        {/* Subcompanies Section */}
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #2C2A30' }}>
          <h4 className="text-xs font-semibold mb-2" style={{ color: 'rgba(250,244,236,0.5)' }}>Subcompanies ({subcompanies.length}/8)</h4>

          {/* Existing Subcompanies */}
          {subcompanies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {subcompanies.map(sub => (
                <div
                  key={sub.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-full group"
                  style={{ border: '1px solid #2C2A30', backgroundColor: '#1A1920' }}
                >
                  <img
                    src={sub.logoUrl}
                    alt={sub.name}
                    className="w-3.5 h-3.5 object-contain rounded-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <span className="text-xs font-medium" style={{ color: '#FAF4EC' }}>{sub.name}</span>
                  <button
                    onClick={() => handleRemoveSubcompany(sub.id)}
                    className="ml-0.5 p-0.5 rounded-full transition-colors hover:bg-red-900/30"
                    title="Remove"
                  >
                    <X className="w-2.5 h-2.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Subcompany Form */}
          {subcompanies.length < 8 && (
            <div className="space-y-1.5">
              <input
                type="text"
                placeholder="Subcompany name"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                className={darkInput}
                style={darkInputStyle}
              />
              <input
                type="text"
                placeholder="Subcompany logo URL"
                value={subLogoUrl}
                onChange={(e) => setSubLogoUrl(e.target.value)}
                className={darkInput}
                style={darkInputStyle}
              />
              <button
                onClick={handleAddSubcompany}
                disabled={!subName || !subLogoUrl}
                className="w-full px-2 py-1 text-xs rounded transition-colors"
                style={{ backgroundColor: '#2C2A30', color: '#FAF4EC' }}
              >
                + Add Subcompany
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSubmit}
            className="flex-1 px-3 py-1.5 text-xs rounded transition-colors"
            style={{ backgroundColor: '#E05642', color: '#FAF4EC' }}
          >
            Add Company
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setSubcompanies([]);
              setSubName("");
              setSubLogoUrl("");
            }}
            className="flex-1 px-3 py-1.5 text-xs rounded transition-colors"
            style={{ backgroundColor: '#2C2A30', color: 'rgba(250,244,236,0.6)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
