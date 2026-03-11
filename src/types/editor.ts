/** Block editor types for the visual newsletter editor. */

export type BlockType =
  | 'header'
  | 'hero'
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'columns'
  | 'column'
  | 'product-card'
  | 'social'
  | 'footer'
  | 'quote'
  | 'code';

export interface BlockProperties {
  // Content
  content?: string;
  src?: string;
  alt?: string;
  href?: string;
  label?: string;
  headingLevel?: 'h1' | 'h2' | 'h3';

  // Style
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  lineHeight?: string;

  // Button specific
  buttonColor?: string;
  buttonTextColor?: string;
  buttonBorderRadius?: string;
  buttonPadding?: string;

  // Layout
  padding?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  border?: string;

  // Image specific
  imageWidth?: string;
  objectFit?: 'cover' | 'contain' | 'fill';

  // Columns specific
  columnsCount?: number;
  columnsGap?: string;

  // Social specific
  socialLinks?: { platform: string; href: string; icon?: string }[];

  // Code block
  rawHtml?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  properties: BlockProperties;
  children?: Block[];
  locked?: boolean;
}

export type EditorPreviewMode = 'edit' | 'desktop' | 'mobile';

export interface BlockCategoryItem {
  type: BlockType;
  label: string;
  icon: string;
  defaultProperties?: Partial<BlockProperties>;
}

export interface BlockCategory {
  name: string;
  items: BlockCategoryItem[];
}
