import React from 'react';
import { Play } from 'lucide-react';
import { ImportedDesign } from '../../types';

interface DesignListProps {
  designs: ImportedDesign[];
  loadedDesignIndex: number | null;
  loadDesign: (design: ImportedDesign, index: number) => void;
}

export function DesignList({ designs, loadedDesignIndex, loadDesign }: DesignListProps) {
  if (designs.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Designs</h3>
      <div className="space-y-1.5">
        {designs.map((design, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-2 bg-white border rounded-lg hover:border-orange-300 ${
              loadedDesignIndex === index
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200'
            }`}
          >
            <span className={`text-sm ${
              loadedDesignIndex === index ? 'text-orange-900 font-medium' : 'text-gray-900'
            }`}>
              {design.title}
            </span>
            <button
              onClick={() => loadDesign(design, index)}
              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
            >
              <Play size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
