import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Company, Settings } from "../App";

interface AddCompanyPanelProps {
  onAddCompany: (company: Company) => void;
  viewMode?: "grid" | "list";
  settings?: Settings;
}

export function AddCompanyPanel({ onAddCompany, viewMode = "grid", settings }: AddCompanyPanelProps) {
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
        className={`flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors ${
          viewMode === "list" ? "w-full py-2" : "w-full aspect-square"
        }`}
      >
        <Plus className="w-6 h-6 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="col-span-full bg-gray-50 p-3 rounded-lg border border-gray-200">
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Company name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
        />
        <input
          type="text"
          placeholder="Logo URL"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
        />
        <input
          type="text"
          placeholder="Company URL (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
        />
        
        {/* Subcompanies Section */}
        <div className="mt-3 pt-3 border-t border-gray-300">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Subcompanies ({subcompanies.length}/8)</h4>
          
          {/* Existing Subcompanies */}
          {subcompanies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {subcompanies.map(sub => (
                <div
                  key={sub.id}
                  className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-full group"
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
                  <span className="text-xs text-gray-700 font-medium">{sub.name}</span>
                  <button
                    onClick={() => handleRemoveSubcompany(sub.id)}
                    className="ml-0.5 p-0.5 hover:bg-red-100 rounded-full transition-colors"
                    title="Remove"
                  >
                    <X className="w-2.5 h-2.5 text-red-500" />
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
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <input
                type="text"
                placeholder="Subcompany logo URL"
                value={subLogoUrl}
                onChange={(e) => setSubLogoUrl(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <button
                onClick={handleAddSubcompany}
                disabled={!subName || !subLogoUrl}
                className="w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                + Add Subcompany
              </button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSubmit}
            className="flex-1 px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
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
            className="flex-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}