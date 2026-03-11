/**
 * Database queries for the Newsletter Inspiration Library.
 */

import { eq, desc, asc, ilike, and, inArray, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/index';
import { WORKSPACE_ID } from '@/lib/constants';
import type { NewsletterInspiration, InspirationTag, NewsletterStyle, LibraryFilters } from '@/types/library';

// ─── Inspirations ────────────────────────────────────────────────────────────

export async function listInspirations(filters: LibraryFilters = {}): Promise<NewsletterInspiration[]> {
  const d = getDb();
  const conditions = [eq(schema.newsletterInspirations.workspaceId, WORKSPACE_ID)];

  if (filters.search) {
    conditions.push(
      ilike(schema.newsletterInspirations.title, `%${filters.search}%`)
    );
  }

  if (filters.fileType && filters.fileType !== 'all') {
    conditions.push(eq(schema.newsletterInspirations.fileType, filters.fileType));
  }

  const orderCol = filters.sortBy === 'title'
    ? schema.newsletterInspirations.title
    : filters.sortBy === 'source_brand'
      ? schema.newsletterInspirations.sourceBrand
      : schema.newsletterInspirations.createdAt;

  const orderFn = filters.sortOrder === 'asc' ? asc : desc;

  let query = d.select()
    .from(schema.newsletterInspirations)
    .where(and(...conditions))
    .orderBy(orderFn(orderCol))
    .limit(filters.limit ?? 50)
    .offset(filters.offset ?? 0);

  const rows = await query;

  // If filtering by tags, filter post-query
  if (filters.tags && filters.tags.length > 0) {
    const tagLinks = await d.select()
      .from(schema.inspirationTagLinks)
      .where(inArray(schema.inspirationTagLinks.tagId, filters.tags));

    const inspIdsWithTags = new Set(tagLinks.map(l => l.inspirationId));
    const filteredRows = rows.filter(r => inspIdsWithTags.has(r.id));
    return filteredRows.map(rowToInspiration);
  }

  // If filtering by style, filter post-query
  if (filters.styleId) {
    const styleLinks = await d.select()
      .from(schema.styleInspirationLinks)
      .where(eq(schema.styleInspirationLinks.styleId, filters.styleId));

    const inspIdsInStyle = new Set(styleLinks.map(l => l.inspirationId));
    const filteredRows = rows.filter(r => inspIdsInStyle.has(r.id));
    return filteredRows.map(rowToInspiration);
  }

  return rows.map(rowToInspiration);
}

export async function getInspiration(id: string): Promise<NewsletterInspiration | undefined> {
  const d = getDb();
  const [row] = await d.select()
    .from(schema.newsletterInspirations)
    .where(eq(schema.newsletterInspirations.id, id))
    .limit(1);

  if (!row) return undefined;

  const inspiration = rowToInspiration(row);

  // Load tags
  const tagLinks = await d.select()
    .from(schema.inspirationTagLinks)
    .where(eq(schema.inspirationTagLinks.inspirationId, id));

  if (tagLinks.length > 0) {
    const tagIds = tagLinks.map(l => l.tagId);
    const tags = await d.select()
      .from(schema.inspirationTags)
      .where(inArray(schema.inspirationTags.id, tagIds));
    inspiration.tags = tags.map(rowToTag);
  }

  return inspiration;
}

export async function createInspiration(data: {
  title: string;
  description?: string;
  sourceUrl?: string;
  sourceBrand?: string;
  fileType: 'image' | 'html';
  filePath: string;
  thumbnailPath?: string;
  htmlContent?: string;
  tagIds?: string[];
}): Promise<NewsletterInspiration> {
  const d = getDb();
  const [row] = await d.insert(schema.newsletterInspirations).values({
    workspaceId: WORKSPACE_ID,
    title: data.title,
    description: data.description ?? null,
    sourceUrl: data.sourceUrl ?? null,
    sourceBrand: data.sourceBrand ?? null,
    fileType: data.fileType,
    filePath: data.filePath,
    thumbnailPath: data.thumbnailPath ?? null,
    htmlContent: data.htmlContent ?? null,
  }).returning();

  if (data.tagIds && data.tagIds.length > 0) {
    await d.insert(schema.inspirationTagLinks).values(
      data.tagIds.map(tagId => ({
        inspirationId: row.id,
        tagId,
      }))
    );
  }

  return rowToInspiration(row);
}

export async function updateInspiration(id: string, data: Partial<{
  title: string;
  description: string | null;
  sourceUrl: string | null;
  sourceBrand: string | null;
  tagIds: string[];
}>): Promise<NewsletterInspiration | undefined> {
  const d = getDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.sourceUrl !== undefined) updates.sourceUrl = data.sourceUrl;
  if (data.sourceBrand !== undefined) updates.sourceBrand = data.sourceBrand;

  const [row] = await d.update(schema.newsletterInspirations)
    .set(updates)
    .where(eq(schema.newsletterInspirations.id, id))
    .returning();

  if (!row) return undefined;

  if (data.tagIds !== undefined) {
    await d.delete(schema.inspirationTagLinks)
      .where(eq(schema.inspirationTagLinks.inspirationId, id));

    if (data.tagIds.length > 0) {
      await d.insert(schema.inspirationTagLinks).values(
        data.tagIds.map(tagId => ({
          inspirationId: id,
          tagId,
        }))
      );
    }
  }

  return rowToInspiration(row);
}

export async function deleteInspiration(id: string): Promise<void> {
  const d = getDb();
  await d.delete(schema.inspirationTagLinks)
    .where(eq(schema.inspirationTagLinks.inspirationId, id));
  await d.delete(schema.styleInspirationLinks)
    .where(eq(schema.styleInspirationLinks.inspirationId, id));
  await d.delete(schema.newsletterInspirations)
    .where(eq(schema.newsletterInspirations.id, id));
}

// ─── Tags ────────────────────────────────────────────────────────────────────

export async function listTags(): Promise<InspirationTag[]> {
  const d = getDb();
  const rows = await d.select()
    .from(schema.inspirationTags)
    .where(eq(schema.inspirationTags.workspaceId, WORKSPACE_ID))
    .orderBy(asc(schema.inspirationTags.name));
  return rows.map(rowToTag);
}

export async function createTag(data: { name: string; color?: string }): Promise<InspirationTag> {
  const d = getDb();
  const [row] = await d.insert(schema.inspirationTags).values({
    workspaceId: WORKSPACE_ID,
    name: data.name,
    color: data.color ?? '#6366F1',
  }).returning();
  return rowToTag(row);
}

export async function updateTag(id: string, data: { name?: string; color?: string }): Promise<InspirationTag | undefined> {
  const d = getDb();
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.color !== undefined) updates.color = data.color;

  const [row] = await d.update(schema.inspirationTags)
    .set(updates)
    .where(eq(schema.inspirationTags.id, id))
    .returning();
  return row ? rowToTag(row) : undefined;
}

export async function deleteTag(id: string): Promise<void> {
  const d = getDb();
  await d.delete(schema.inspirationTagLinks)
    .where(eq(schema.inspirationTagLinks.tagId, id));
  await d.delete(schema.inspirationTags)
    .where(eq(schema.inspirationTags.id, id));
}

// ─── Styles ──────────────────────────────────────────────────────────────────

export async function listStyles(): Promise<NewsletterStyle[]> {
  const d = getDb();
  const rows = await d.select()
    .from(schema.newsletterStyles)
    .where(eq(schema.newsletterStyles.workspaceId, WORKSPACE_ID))
    .orderBy(desc(schema.newsletterStyles.createdAt));

  const styles = rows.map(rowToStyle);

  // Load inspiration counts
  for (const style of styles) {
    const links = await d.select()
      .from(schema.styleInspirationLinks)
      .where(eq(schema.styleInspirationLinks.styleId, style.id));
    style.inspirationCount = links.length;

    // Load cover inspiration if set
    if (style.coverInspirationId) {
      const [cover] = await d.select()
        .from(schema.newsletterInspirations)
        .where(eq(schema.newsletterInspirations.id, style.coverInspirationId))
        .limit(1);
      if (cover) style.coverInspiration = rowToInspiration(cover);
    }
  }

  return styles;
}

export async function getStyle(id: string): Promise<NewsletterStyle | undefined> {
  const d = getDb();
  const [row] = await d.select()
    .from(schema.newsletterStyles)
    .where(eq(schema.newsletterStyles.id, id))
    .limit(1);

  if (!row) return undefined;

  const style = rowToStyle(row);

  // Load inspirations
  const links = await d.select()
    .from(schema.styleInspirationLinks)
    .where(eq(schema.styleInspirationLinks.styleId, id));

  if (links.length > 0) {
    const inspIds = links.map(l => l.inspirationId);
    const inspirations = await d.select()
      .from(schema.newsletterInspirations)
      .where(inArray(schema.newsletterInspirations.id, inspIds));
    style.inspirations = inspirations.map(rowToInspiration);
    style.inspirationCount = inspirations.length;
  }

  if (style.coverInspirationId) {
    const [cover] = await d.select()
      .from(schema.newsletterInspirations)
      .where(eq(schema.newsletterInspirations.id, style.coverInspirationId))
      .limit(1);
    if (cover) style.coverInspiration = rowToInspiration(cover);
  }

  return style;
}

export async function createStyle(data: {
  name: string;
  description?: string;
  stylePrompt?: string;
  coverInspirationId?: string;
  inspirationIds?: string[];
}): Promise<NewsletterStyle> {
  const d = getDb();
  const [row] = await d.insert(schema.newsletterStyles).values({
    workspaceId: WORKSPACE_ID,
    name: data.name,
    description: data.description ?? null,
    stylePrompt: data.stylePrompt ?? null,
    coverInspirationId: data.coverInspirationId ?? null,
  }).returning();

  if (data.inspirationIds && data.inspirationIds.length > 0) {
    await d.insert(schema.styleInspirationLinks).values(
      data.inspirationIds.map(inspirationId => ({
        styleId: row.id,
        inspirationId,
      }))
    );
  }

  return rowToStyle(row);
}

export async function updateStyle(id: string, data: Partial<{
  name: string;
  description: string | null;
  stylePrompt: string | null;
  coverInspirationId: string | null;
  inspirationIds: string[];
}>): Promise<NewsletterStyle | undefined> {
  const d = getDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.stylePrompt !== undefined) updates.stylePrompt = data.stylePrompt;
  if (data.coverInspirationId !== undefined) updates.coverInspirationId = data.coverInspirationId;

  const [row] = await d.update(schema.newsletterStyles)
    .set(updates)
    .where(eq(schema.newsletterStyles.id, id))
    .returning();

  if (!row) return undefined;

  if (data.inspirationIds !== undefined) {
    await d.delete(schema.styleInspirationLinks)
      .where(eq(schema.styleInspirationLinks.styleId, id));

    if (data.inspirationIds.length > 0) {
      await d.insert(schema.styleInspirationLinks).values(
        data.inspirationIds.map(inspirationId => ({
          styleId: id,
          inspirationId,
        }))
      );
    }
  }

  return rowToStyle(row);
}

export async function deleteStyle(id: string): Promise<void> {
  const d = getDb();
  await d.delete(schema.styleInspirationLinks)
    .where(eq(schema.styleInspirationLinks.styleId, id));
  await d.delete(schema.newsletterStyles)
    .where(eq(schema.newsletterStyles.id, id));
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

type InspirationRow = typeof schema.newsletterInspirations.$inferSelect;
type TagRow = typeof schema.inspirationTags.$inferSelect;
type StyleRow = typeof schema.newsletterStyles.$inferSelect;

function rowToInspiration(r: InspirationRow): NewsletterInspiration {
  return {
    id: r.id,
    workspaceId: r.workspaceId,
    title: r.title,
    description: r.description,
    sourceUrl: r.sourceUrl,
    sourceBrand: r.sourceBrand,
    fileType: r.fileType as 'image' | 'html',
    filePath: r.filePath,
    thumbnailPath: r.thumbnailPath,
    htmlContent: r.htmlContent,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function rowToTag(r: TagRow): InspirationTag {
  return {
    id: r.id,
    workspaceId: r.workspaceId,
    name: r.name,
    color: r.color,
  };
}

function rowToStyle(r: StyleRow): NewsletterStyle {
  return {
    id: r.id,
    workspaceId: r.workspaceId,
    name: r.name,
    description: r.description,
    stylePrompt: r.stylePrompt,
    coverInspirationId: r.coverInspirationId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
