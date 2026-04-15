import React from 'react';
import { DesignBlock, Template, Theme } from '../../types';
import { isHeadingBlock, isParagraphBlock, isImageBlock, isPartnerBlock } from '../../utils/typeGuards';
import { TWITTER_HEADING_SIZES } from '../../constants/themes';
import { getTextStyles, getImageStyles } from '../../constants/templates';

interface BlockRendererProps {
  blocks: DesignBlock[];
  template: Template;
  theme: Theme;
}

export function BlockRenderer({ blocks, template, theme }: BlockRendererProps) {
  const textStyles = getTextStyles(template, theme);
  const imageStyles = getImageStyles(template, theme);

  const renderBlock = (block: DesignBlock) => {
    if (isImageBlock(block)) {
      const baseStyles: React.CSSProperties = {
        width: template === 'twitter' 
          ? (theme === 'pc-speaker' ? '560px' : '450px')
          : block.width,
        height: 'auto',
        objectFit: (template === 'linkedin' || template === 'twitter') && theme !== 'pc-speaker' ? 'contain' : 'cover',
        ...(template === 'linkedin' && theme !== 'pc-speaker' && { maxHeight: '600px' }),
        ...(template === 'twitter' && theme !== 'pc-speaker' && { maxHeight: '600px' }),
      };

      // Add gradient border for pc-speaker theme
      if (theme === 'pc-speaker' && imageStyles) {
        return (
          <div
            key={block.id}
            style={{
              background: 'linear-gradient(45deg, #1E61F0, #F8BEDB)',
              padding: '2px',
              display: 'inline-block',
            }}
          >
            <img src={block.url} alt="" style={baseStyles} />
          </div>
        );
      }

      return <img key={block.id} src={block.url} alt="" style={baseStyles} />;
    }

    if (isHeadingBlock(block)) {
      const fontSize = template === 'twitter'
        ? `${TWITTER_HEADING_SIZES[block.level]}px`
        : `${block.fontSize}px`;

      return (
        <div
          key={block.id}
          dangerouslySetInnerHTML={{ __html: block.text }}
          style={{
            fontSize,
            lineHeight: textStyles.heading.lineHeight,
            color: block.color,
            textAlign: textStyles.heading.textAlign,
            fontFamily: textStyles.heading.fontFamily,
            fontWeight: theme === 'pc-speaker' && block.level === 'h4' ? 400 : textStyles.heading.fontWeight,
            fontStyle: textStyles.heading.fontStyle,
          }}
        />
      );
    }

    if (isParagraphBlock(block)) {
      return (
        <div
          key={block.id}
          dangerouslySetInnerHTML={{ __html: block.text }}
          style={{
            fontSize: textStyles.paragraph.fontSize,
            lineHeight: textStyles.paragraph.lineHeight,
            color: block.color,
            textAlign: textStyles.paragraph.textAlign,
            fontFamily: textStyles.paragraph.fontFamily,
            fontWeight: textStyles.paragraph.fontWeight,
          }}
        />
      );
    }

    if (isPartnerBlock(block)) {
      if (template === 'twitter') {
        return (
          <img
            key={block.id}
            src={block.url}
            alt="Partner"
            style={{ maxHeight: '100px', width: 'auto', objectFit: 'contain', alignSelf: 'flex-start' }}
          />
        );
      } else if (template === 'linkedin' && theme === 'pc-speaker') {
        return (
          <img
            key={block.id}
            src={block.url}
            alt="Partner"
            style={{ maxHeight: '100px', width: 'auto', objectFit: 'contain' }}
          />
        );
      }
      return null;
    }

    return null;
  };

  return <>{blocks.map(renderBlock)}</>;
}