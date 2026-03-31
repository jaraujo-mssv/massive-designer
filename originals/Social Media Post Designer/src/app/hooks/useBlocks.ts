import { useState } from 'react';
import { DesignBlock, HeadingBlock, ParagraphBlock, ImageBlock, PartnerBlock, HeadingLevel } from '../types';
import { THEMES, TWITTER_HEADING_SIZES, HEADING_SIZES } from '../constants';
import { Theme } from '../types';

export function useBlocks(projectTheme: Theme) {
  const [blocks, setBlocks] = useState<DesignBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const addHeading = () => {
    const newBlock: HeadingBlock = {
      id: Date.now().toString(),
      type: 'heading',
      text: 'New Heading',
      level: 'h1',
      fontSize: HEADING_SIZES.h1,
      color: THEMES[projectTheme].headingColor,
    };
    setBlocks([...blocks, newBlock]);
  };

  const addParagraph = () => {
    const newBlock: ParagraphBlock = {
      id: Date.now().toString(),
      type: 'paragraph',
      text: 'New paragraph text',
      color: THEMES[projectTheme].paragraphColor,
    };
    setBlocks([...blocks, newBlock]);
  };

  const addImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const newBlock: ImageBlock = {
        id: Date.now().toString(),
        type: 'image',
        url,
        width: 1080 - 64,
        height: 0,
      };
      setBlocks([...blocks, newBlock]);
    }
  };

  const addPartner = () => {
    const url = prompt('Enter partner logo URL:');
    if (url) {
      const newBlock: PartnerBlock = {
        id: Date.now().toString(),
        type: 'partner',
        url,
      };
      setBlocks([...blocks, newBlock]);
    }
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((block) => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const moveBlockUp = (id: string) => {
    const index = blocks.findIndex((block) => block.id === id);
    if (index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      setBlocks(newBlocks);
    }
  };

  const moveBlockDown = (id: string) => {
    const index = blocks.findIndex((block) => block.id === id);
    if (index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  const updateBlock = (id: string, updates: Partial<DesignBlock>) => {
    setBlocks(
      blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      )
    );
  };

  const updateHeadingLevel = (id: string, level: HeadingLevel) => {
    setBlocks(
      blocks.map((block) =>
        block.id === id && block.type === 'heading'
          ? { ...block, level, fontSize: HEADING_SIZES[level] }
          : block
      )
    );
  };

  const clearBlocks = () => {
    setBlocks([]);
    setSelectedBlockId(null);
  };

  const setBlocksDirectly = (newBlocks: DesignBlock[]) => {
    setBlocks(newBlocks);
  };

  return {
    blocks,
    selectedBlockId,
    setSelectedBlockId,
    addHeading,
    addParagraph,
    addImage,
    addPartner,
    deleteBlock,
    moveBlockUp,
    moveBlockDown,
    updateBlock,
    updateHeadingLevel,
    clearBlocks,
    setBlocksDirectly,
  };
}