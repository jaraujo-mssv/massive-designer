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
        <h3 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">Add Block</h3>
        <div className="space-y-2">
          {[
            { label: 'Add Heading', action: addHeading },
            { label: 'Add Paragraph', action: addParagraph },
            { label: 'Add Image', action: addImage },
            { label: 'Add Partner', action: addPartner },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border-subtle text-text-primary rounded-lg hover:border-brand hover:text-brand-light text-sm transition-colors"
            >
              <Plus size={16} className="text-brand" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Block List */}
      {blocks.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">Blocks</h3>
          <div className="space-y-3">
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
