/**
 * Serialize an array of Block objects back to MJML source.
 */
import type { Block } from '@/types/editor';

function escape(s?: string): string {
  return s ?? '';
}

function attr(key: string, value?: string): string {
  if (!value) return '';
  return ` ${key}="${escape(value)}"`;
}

function wrapInSection(content: string, props: Block['properties']): string {
  let sectionAttrs = '';
  if (props.backgroundColor) sectionAttrs += attr('background-color', props.backgroundColor);
  if (props.padding) sectionAttrs += attr('padding', props.padding);
  return `    <mj-section${sectionAttrs}>\n      <mj-column>\n${content}      </mj-column>\n    </mj-section>\n`;
}

function blockToMjml(block: Block): string {
  const p = block.properties;
  switch (block.type) {
    case 'heading': {
      const level = p.headingLevel || 'h2';
      let attrs = '';
      attrs += attr('color', p.textColor);
      attrs += attr('font-size', p.fontSize);
      attrs += attr('font-family', p.fontFamily);
      attrs += attr('font-weight', p.fontWeight || '700');
      attrs += attr('align', p.textAlign);
      attrs += attr('padding', p.padding);
      attrs += attr('letter-spacing', p.letterSpacing);
      attrs += attr('line-height', p.lineHeight);
      const content = `<${level}>${p.content || ''}</${level}>`;
      return wrapInSection(`        <mj-text${attrs}>${content}</mj-text>\n`, p);
    }

    case 'text': {
      let attrs = '';
      attrs += attr('color', p.textColor);
      attrs += attr('font-size', p.fontSize);
      attrs += attr('font-family', p.fontFamily);
      attrs += attr('font-weight', p.fontWeight);
      attrs += attr('align', p.textAlign);
      attrs += attr('padding', p.padding);
      attrs += attr('letter-spacing', p.letterSpacing);
      attrs += attr('line-height', p.lineHeight);
      return wrapInSection(`        <mj-text${attrs}>${p.content || ''}</mj-text>\n`, p);
    }

    case 'image':
    case 'hero': {
      let attrs = '';
      attrs += attr('src', p.src);
      attrs += attr('alt', p.alt);
      if (p.href) attrs += attr('href', p.href);
      attrs += attr('width', p.imageWidth || p.width);
      attrs += attr('padding', p.padding);
      attrs += attr('border-radius', p.borderRadius);
      if (block.type === 'hero') attrs += ' fluid-on-mobile="true"';
      return wrapInSection(`        <mj-image${attrs} />\n`, p);
    }

    case 'button': {
      let attrs = '';
      attrs += attr('href', p.href || '#');
      attrs += attr('background-color', p.buttonColor);
      attrs += attr('color', p.buttonTextColor);
      attrs += attr('border-radius', p.buttonBorderRadius);
      attrs += attr('font-family', p.fontFamily);
      attrs += attr('font-size', p.fontSize);
      attrs += attr('font-weight', p.fontWeight);
      attrs += attr('padding', p.padding);
      if (p.buttonPadding) attrs += attr('inner-padding', p.buttonPadding);
      attrs += attr('align', p.textAlign);
      return wrapInSection(`        <mj-button${attrs}>${p.label || 'Click'}</mj-button>\n`, p);
    }

    case 'divider': {
      let attrs = '';
      if (p.border) {
        const parts = p.border.split(' ');
        if (parts.length >= 3) {
          attrs += attr('border-width', parts[0]);
          attrs += attr('border-style', parts[1]);
          attrs += attr('border-color', parts[2]);
        }
      }
      attrs += attr('padding', p.padding);
      return wrapInSection(`        <mj-divider${attrs} />\n`, p);
    }

    case 'spacer': {
      return wrapInSection(`        <mj-spacer${attr('height', p.height || '20px')} />\n`, p);
    }

    case 'columns': {
      const children = block.children || [];
      let sectionAttrs = '';
      if (p.backgroundColor) sectionAttrs += attr('background-color', p.backgroundColor);
      if (p.padding) sectionAttrs += attr('padding', p.padding);

      const cols = children
        .map((col) => {
          let colAttrs = '';
          if (col.properties.width) colAttrs += attr('width', col.properties.width);
          if (col.properties.backgroundColor) colAttrs += attr('background-color', col.properties.backgroundColor);
          if (col.properties.padding) colAttrs += attr('padding', col.properties.padding);

          const colContent = (col.children || []).map((child) => {
            // Render inner blocks without section wrapper
            return renderInnerBlock(child);
          }).join('');

          return `      <mj-column${colAttrs}>\n${colContent}      </mj-column>\n`;
        })
        .join('');

      return `    <mj-section${sectionAttrs}>\n${cols}    </mj-section>\n`;
    }

    case 'social': {
      const links = p.socialLinks || [];
      const elements = links
        .map((link) => {
          let elemAttrs = attr('name', link.platform);
          elemAttrs += attr('href', link.href);
          if (link.icon) elemAttrs += attr('src', link.icon);
          return `          <mj-social-element${elemAttrs}>${link.platform}</mj-social-element>`;
        })
        .join('\n');
      let attrs = '';
      attrs += attr('align', p.textAlign || 'center');
      attrs += attr('padding', p.padding);
      return wrapInSection(`        <mj-social${attrs} mode="horizontal">\n${elements}\n        </mj-social>\n`, p);
    }

    case 'quote': {
      let attrs = '';
      attrs += attr('color', p.textColor);
      attrs += attr('font-size', p.fontSize);
      attrs += attr('font-family', p.fontFamily);
      attrs += attr('font-style', 'italic');
      attrs += attr('padding', p.padding || '20px 40px');
      attrs += attr('align', p.textAlign);
      const borderStyle = p.border || '3px solid #E0E0E0';
      attrs += ` container-background-color="${p.backgroundColor || '#f9f9f9'}"`;
      const content = `<blockquote style="border-left: ${borderStyle}; padding-left: 15px; margin: 0;">${p.content || ''}</blockquote>`;
      return wrapInSection(`        <mj-text${attrs}>${content}</mj-text>\n`, {});
    }

    case 'header': {
      const children = block.children || [];
      let sectionAttrs = '';
      if (p.backgroundColor) sectionAttrs += attr('background-color', p.backgroundColor);
      if (p.padding) sectionAttrs += attr('padding', p.padding || '10px 20px');
      const innerContent = children.map(renderInnerBlock).join('');
      return `    <mj-section${sectionAttrs}>\n      <mj-column>\n${innerContent}      </mj-column>\n    </mj-section>\n`;
    }

    case 'footer': {
      const children = block.children || [];
      let sectionAttrs = '';
      if (p.backgroundColor) sectionAttrs += attr('background-color', p.backgroundColor || '#f4f4f4');
      if (p.padding) sectionAttrs += attr('padding', p.padding || '20px');
      const innerContent = children.map(renderInnerBlock).join('');
      return `    <mj-section${sectionAttrs}>\n      <mj-column>\n${innerContent}      </mj-column>\n    </mj-section>\n`;
    }

    case 'product-card': {
      const imgMjml = p.src ? `        <mj-image${attr('src', p.src)}${attr('alt', p.alt)}${attr('width', p.imageWidth || '200px')} />\n` : '';
      const titleMjml = p.content ? `        <mj-text${attr('font-weight', '600')}${attr('align', p.textAlign || 'center')}>${p.content}</mj-text>\n` : '';
      const btnMjml = p.href
        ? `        <mj-button${attr('href', p.href)}${attr('background-color', p.buttonColor)}${attr('color', p.buttonTextColor)}>${p.label || 'Voir'}</mj-button>\n`
        : '';
      return wrapInSection(imgMjml + titleMjml + btnMjml, p);
    }

    case 'code': {
      return wrapInSection(`        <mj-raw>${p.rawHtml || ''}</mj-raw>\n`, {});
    }

    default:
      return '';
  }
}

/** Render a block inside a column (no section wrapper). */
function renderInnerBlock(block: Block): string {
  const p = block.properties;
  switch (block.type) {
    case 'heading': {
      const level = p.headingLevel || 'h2';
      let attrs = '';
      attrs += attr('color', p.textColor);
      attrs += attr('font-size', p.fontSize);
      attrs += attr('font-family', p.fontFamily);
      attrs += attr('font-weight', p.fontWeight || '700');
      attrs += attr('align', p.textAlign);
      attrs += attr('padding', p.padding);
      return `        <mj-text${attrs}><${level}>${p.content || ''}</${level}></mj-text>\n`;
    }
    case 'text': {
      let attrs = '';
      attrs += attr('color', p.textColor);
      attrs += attr('font-size', p.fontSize);
      attrs += attr('font-family', p.fontFamily);
      attrs += attr('align', p.textAlign);
      attrs += attr('padding', p.padding);
      return `        <mj-text${attrs}>${p.content || ''}</mj-text>\n`;
    }
    case 'image':
    case 'hero': {
      let attrs = '';
      attrs += attr('src', p.src);
      attrs += attr('alt', p.alt);
      attrs += attr('width', p.imageWidth || p.width);
      attrs += attr('padding', p.padding);
      return `        <mj-image${attrs} />\n`;
    }
    case 'button': {
      let attrs = '';
      attrs += attr('href', p.href || '#');
      attrs += attr('background-color', p.buttonColor);
      attrs += attr('color', p.buttonTextColor);
      attrs += attr('border-radius', p.buttonBorderRadius);
      attrs += attr('padding', p.padding);
      return `        <mj-button${attrs}>${p.label || 'Click'}</mj-button>\n`;
    }
    case 'divider':
      return `        <mj-divider${attr('padding', p.padding)} />\n`;
    case 'spacer':
      return `        <mj-spacer${attr('height', p.height || '20px')} />\n`;
    case 'social': {
      const elements = (p.socialLinks || [])
        .map((l) => `          <mj-social-element${attr('name', l.platform)}${attr('href', l.href)}>${l.platform}</mj-social-element>`)
        .join('\n');
      return `        <mj-social mode="horizontal"${attr('align', p.textAlign || 'center')}>\n${elements}\n        </mj-social>\n`;
    }
    default:
      return `        <mj-text>${p.content || ''}</mj-text>\n`;
  }
}

/**
 * Serialize an array of blocks to MJML source.
 */
export function blocksToMjml(blocks: Block[], headContent?: string): string {
  const head = headContent || `    <mj-attributes>\n      <mj-all font-family="Arial, sans-serif" />\n      <mj-text font-size="15px" color="#2D2D2D" line-height="1.6" />\n    </mj-attributes>`;

  const body = blocks.map(blockToMjml).join('');

  return `<mjml>
  <mj-head>
${head}
  </mj-head>
  <mj-body>
${body}  </mj-body>
</mjml>`;
}
