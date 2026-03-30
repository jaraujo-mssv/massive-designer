import React from 'react';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { DesignBlock, HeadingLevel } from '../../types';
import { isHeadingBlock, isParagraphBlock, isImageBlock, isPartnerBlock } from '../../utils/typeGuards';

interface BlockItemProps {
  block: DesignBlock;
  index: number;
  totalBlocks: number;
  isSelected: boolean;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onUpdate: (id: string, updates: Partial<DesignBlock>) => void;
  onUpdateHeadingLevel: (id: string, level: HeadingLevel) => void;
}

const inputClass =
  'w-full px-3 py-2 border border-border-subtle rounded-lg text-sm bg-surface text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand';

export function BlockItem({
  block,
  index,
  totalBlocks,
  isSelected,
  onDelete,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onUpdateHeadingLevel,
}: BlockItemProps) {
  return (
    <div
      className={`p-3 border rounded-lg transition-colors ${
        isSelected ? 'border-brand' : 'border-border-subtle'
      }`}
      style={{ backgroundColor: isSelected ? 'var(--red-glow)' : 'var(--surface-2)' }}
    >
      {/* Block Controls */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">
          {block.type}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onMoveUp(block.id)}
            disabled={index === 0}
            className="p-1 hover:bg-surface rounded text-text-dim disabled:opacity-30"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={() => onMoveDown(block.id)}
            disabled={index === totalBlocks - 1}
            className="p-1 hover:bg-surface rounded text-text-dim disabled:opacity-30"
          >
            <ArrowDown size={14} />
          </button>
          <button
            onClick={() => onDelete(block.id)}
            className="p-1 hover:bg-surface rounded text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Heading Block Controls */}
      {isHeadingBlock(block) && (
        <div className="space-y-2">
          <select
            value={block.level}
            onChange={(e) => onUpdateHeadingLevel(block.id, e.target.value as HeadingLevel)}
            className={inputClass}
          >
            <option value="h1">H1 (100px)</option>
            <option value="h2">H2 (80px)</option>
            <option value="h3">H3 (64px)</option>
            <option value="h4">H4 (48px)</option>
            <option value="h5">H5 (36px)</option>
            <option value="h6">H6 (28px)</option>
          </select>
          <textarea
            value={block.text}
            onChange={(e) => onUpdate(block.id, { text: e.target.value })}
            rows={3}
            placeholder="Text or HTML — e.g. Line one<br>Line two or <span style='color:#ff0'>word</span>"
            className={`${inputClass} resize-none`}
          />
        </div>
      )}

      {/* Paragraph Block Controls */}
      {isParagraphBlock(block) && (
        <textarea
          value={block.text}
          onChange={(e) => onUpdate(block.id, { text: e.target.value })}
          rows={3}
          placeholder="Text or HTML — e.g. Line one<br>Line two or <span style='color:#ff0'>word</span>"
          className={`${inputClass} resize-none`}
        />
      )}

      {/* Image Block Controls */}
      {isImageBlock(block) && (
        <input
          type="text"
          value={block.url}
          onChange={(e) => onUpdate(block.id, { url: e.target.value })}
          placeholder="Image URL"
          className={inputClass}
        />
      )}

      {/* Partner Block Controls */}
      {isPartnerBlock(block) && (
        <input
          type="text"
          value={block.url}
          onChange={(e) => onUpdate(block.id, { url: e.target.value })}
          placeholder="Partner Logo URL"
          className={inputClass}
        />
      )}
    </div>
  );
}
