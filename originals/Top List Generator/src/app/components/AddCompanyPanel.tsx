import { useState } from "react";
import { Plus } from "lucide-react";
import { Company, Settings } from "../App";

interface AddCompanyPanelProps {
  onAddCompany: (company: Company) => void;
  settings?: Settings;
}

export function AddCompanyPanel({ onAddCompany, settings }: AddCompanyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [url, setUrl] = useState("");
  const [position, setPosition] = useState(1);

  const handleSubmit = () => {
    if (!name || !logoUrl) return;

    const newCompany: Company = {
      id: `company-${Date.now()}`,
      position,
      name,
      logoUrl,
      url: url || undefined,
    };

    onAddCompany(newCompany);
    setName("");
    setLogoUrl("");
    setUrl("");
    setPosition(1);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors w-full py-2"
      >
        <Plus className="w-6 h-6 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="col-span-full bg-gray-50 p-3 rounded-lg border border-gray-200">
      <div className="space-y-2">
        <input
          type="number"
          placeholder="Position (1, 2, 3...)"
          value={position}
          onChange={(e) => setPosition(parseInt(e.target.value, 10) || 1)}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 outline-none"
        />
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
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}