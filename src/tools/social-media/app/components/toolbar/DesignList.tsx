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
      <h3 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">Available Designs</h3>
      <div className="space-y-1.5">
        {designs.map((design, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
              loadedDesignIndex === index
                ? 'border-brand'
                : 'border-border-subtle hover:border-border-hov'
            }`}
            style={
              loadedDesignIndex === index
                ? { backgroundColor: 'var(--red-glow)' }
                : { backgroundColor: 'var(--surface-2)' }
            }
          >
            <span
              className={`text-sm ${
                loadedDesignIndex === index ? 'text-brand-light font-medium' : 'text-text-primary'
              }`}
            >
              {design.title}
            </span>
            <button
              onClick={() => loadDesign(design, index)}
              className="p-1.5 text-brand hover:bg-surface rounded-lg"
            >
              <Play size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
