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
      className={`p-4 border-2 rounded-lg ${
        isSelected
          ? 'border-orange-500 bg-orange-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Block Controls */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-600 uppercase">
          {block.type}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onMoveUp(block.id)}
            disabled={index === 0}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={() => onMoveDown(block.id)}
            disabled={index === totalBlocks - 1}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          >
            <ArrowDown size={16} />
          </button>
          <button
            onClick={() => onDelete(block.id)}
            className="p-1 hover:bg-red-100 text-red-600 rounded"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Heading Block Controls */}
      {isHeadingBlock(block) && (
        <div className="space-y-2">
          <select
            value={block.level}
            onChange={(e) =>
              onUpdateHeadingLevel(block.id, e.target.value as HeadingLevel)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
          />
        </div>
      )}

      {/* Paragraph Block Controls */}
      {isParagraphBlock(block) && (
        <textarea
          value={block.text}
          onChange={(e) => onUpdate(block.id, { text: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
        />
      )}

      {/* Image Block Controls */}
      {isImageBlock(block) && (
        <input
          type="text"
          value={block.url}
          onChange={(e) => onUpdate(block.id, { url: e.target.value })}
          placeholder="Image URL"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      )}

      {/* Partner Block Controls */}
      {isPartnerBlock(block) && (
        <input
          type="text"
          value={block.url}
          onChange={(e) => onUpdate(block.id, { url: e.target.value })}
          placeholder="Partner Logo URL"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      )}
    </div>
  );
}