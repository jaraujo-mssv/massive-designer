import {
  DesignBlock,
  HeadingBlock,
  ParagraphBlock,
  ImageBlock,
  PartnerBlock,
} from '../types';

export const isHeadingBlock = (block: DesignBlock): block is HeadingBlock => {
  return block.type === 'heading';
};

export const isParagraphBlock = (block: DesignBlock): block is ParagraphBlock => {
  return block.type === 'paragraph';
};

export const isImageBlock = (block: DesignBlock): block is ImageBlock => {
  return block.type === 'image';
};

export const isPartnerBlock = (block: DesignBlock): block is PartnerBlock => {
  return block.type === 'partner';
};
