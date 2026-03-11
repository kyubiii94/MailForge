'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { InspirationTag } from '@/types/library';

const TAG_COLORS = [
  '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EF4444', '#14B8A6', '#F97316', '#06B6D4',
];

interface TagManagerProps {
  tags: InspirationTag[];
  onUpdate: () => void;
}

export function TagManager({ tags, onUpdate }: TagManagerProps) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const createTag = async () => {
    if (!newName.trim()) return;
    await fetch('/api/library/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    setNewName('');
    onUpdate();
  };

  const saveEdit = async (id: string) => {
    await fetch('/api/library/tags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editName.trim(), color: editColor }),
    });
    setEditingId(null);
    onUpdate();
  };

  const deleteTag = async (id: string) => {
    await fetch('/api/library/tags', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    onUpdate();
  };

  const startEdit = (tag: InspirationTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  return (
    <div className="space-y-4">
      {/* Create new tag */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createTag()}
          placeholder="Nouveau tag..."
          className="flex-1 px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex gap-1">
          {TAG_COLORS.slice(0, 5).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              className={`w-6 h-6 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-offset-1 ring-surface-400' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={`Couleur ${c}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={createTag}
          disabled={!newName.trim()}
          className="p-2 text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tag list */}
      <div className="space-y-1">
        {tags.map(tag => (
          <div key={tag.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-50 group">
            {editingId === tag.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-surface-200 rounded"
                  autoFocus
                />
                <div className="flex gap-1">
                  {TAG_COLORS.slice(0, 5).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-5 h-5 rounded-full ${editColor === c ? 'ring-2 ring-offset-1 ring-surface-400' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button type="button" onClick={() => saveEdit(tag.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                  <Check className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="p-1 text-surface-400 hover:bg-surface-100 rounded">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 text-sm text-surface-700">{tag.name}</span>
                <button
                  type="button"
                  onClick={() => startEdit(tag)}
                  className="p-1 text-surface-400 hover:text-surface-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteTag(tag.id)}
                  className="p-1 text-surface-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
        {tags.length === 0 && (
          <p className="text-sm text-surface-400 text-center py-4">Aucun tag créé</p>
        )}
      </div>
    </div>
  );
}
