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
  const [valuation, setValuation] = useState("");
  const [position, setPosition] = useState(1);

  const handleSubmit = () => {
    if (!name || !logoUrl) return;

    const newCompany: Company = {
      id: `company-${Date.now()}`,
      position,
      name,
      logoUrl,
      url: url || undefined,
      valuation: valuation || undefined,
    };

    onAddCompany(newCompany);
    setName("");
    setLogoUrl("");
    setUrl("");
    setValuation("");
    setPosition(1);
    setIsOpen(false);
  };

  const inputClass = "w-full px-2 py-1.5 text-xs border border-border-subtle rounded bg-surface text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand";

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center bg-surface-2 border-2 border-dashed border-border-subtle rounded-lg hover:border-brand transition-colors w-full py-2"
      >
        <Plus className="w-6 h-6 text-text-dim" />
      </button>
    );
  }

  return (
    <div className="col-span-full bg-surface-2 p-3 rounded-lg border border-border-subtle">
      <div className="space-y-2">
        <input
          type="number"
          placeholder="Position (1, 2, 3...)"
          value={position}
          onChange={(e) => setPosition(parseInt(e.target.value, 10) || 1)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Company name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Logo URL"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Company URL (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Valuation (optional, e.g. $1.2B)"
          value={valuation}
          onChange={(e) => setValuation(e.target.value)}
          className={inputClass}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 px-3 py-1.5 text-xs bg-brand text-white rounded hover:opacity-90 transition-opacity"
          >
            Add
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-3 py-1.5 text-xs bg-surface border border-border-subtle text-text-dim rounded hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}