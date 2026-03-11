/** Types for the Newsletter Inspiration Library feature */

export interface NewsletterInspiration {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  sourceBrand: string | null;
  fileType: 'image' | 'html';
  filePath: string;
  thumbnailPath: string | null;
  htmlContent: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: InspirationTag[];
}

export interface InspirationTag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
}

export interface NewsletterStyle {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  stylePrompt: string | null;
  coverInspirationId: string | null;
  coverInspiration?: NewsletterInspiration;
  inspirations?: NewsletterInspiration[];
  inspirationCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadPayload {
  file: File;
  title: string;
  description?: string;
  sourceUrl?: string;
  sourceBrand?: string;
  tagIds?: string[];
}

export interface LibraryFilters {
  search?: string;
  tags?: string[];
  fileType?: 'image' | 'html' | 'all';
  styleId?: string;
  sortBy?: 'created_at' | 'title' | 'source_brand';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
