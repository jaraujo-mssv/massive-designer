import React from 'react';
import { Plus } from 'lucide-react';
import { DesignBlock, HeadingLevel } from '../../types';
import { BlockItem } from './BlockItem';

interface BlocksTabProps {
  blocks: DesignBlock[];
  selectedBlockId: string | null;
  addHeading: () => void;
  addParagraph: () => void;
  addImage: () => void;
  addPartner: () => void;
  deleteBlock: (id: string) => void;
  moveBlockUp: (id: string) => void;
  moveBlockDown: (id: string) => void;
  updateBlock: (id: string, updates: Partial<DesignBlock>) => void;
  updateHeadingLevel: (id: string, level: HeadingLevel) => void;
}

export function BlocksTab({
  blocks,
  selectedBlockId,
  addHeading,
  addParagraph,
  addImage,
  addPartner,
  deleteBlock,
  moveBlockUp,
  moveBlockDown,
  updateBlock,
  updateHeadingLevel,
}: BlocksTabProps) {
  return (
    <div className="space-y-6">
      {/* Add Block Buttons */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Block</h3>
        <div className="space-y-2">
          <button
            onClick={addHeading}
            className="w-full flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Plus size={20} />
            Add Heading
          </button>
          <button
            onClick={addParagraph}
            className="w-full flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Plus size={20} />
            Add Paragraph
          </button>
          <button
            onClick={addImage}
            className="w-full flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Plus size={20} />
            Add Image
          </button>
          <button
            onClick={addPartner}
            className="w-full flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Plus size={20} />
            Add Partner
          </button>
        </div>
      </div>

      {/* Block List */}
      {blocks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Blocks</h3>
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <BlockItem
                key={block.id}
                block={block}
                index={index}
                totalBlocks={blocks.length}
                isSelected={selectedBlockId === block.id}
                onDelete={deleteBlock}
                onMoveUp={moveBlockUp}
                onMoveDown={moveBlockDown}
                onUpdate={updateBlock}
                onUpdateHeadingLevel={updateHeadingLevel}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}