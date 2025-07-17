import React, { useState } from 'react';
import { useBuilderStore } from '../store';
import { Plus, Trash2 } from 'lucide-react';

export const PageManager = () => {
  const { pages, currentPageId, addPage, removePage, setCurrentPage } = useBuilderStore();
  const [newPageTitle, setNewPageTitle] = useState('');

  const handleAddPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;

    const slug = newPageTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const newPage = {
      id: crypto.randomUUID(),
      title: newPageTitle.trim(),
      slug: `/${slug}`,
      components: [],
    };

    addPage(newPage);
    setCurrentPage(newPage.id);
    setNewPageTitle('');
  };

  return (
    <div className="border-b border-gray-200 bg-white p-4">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`group relative rounded-lg ${
                currentPageId === page.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <button
                onClick={() => setCurrentPage(page.id)}
                className="px-4 py-2 whitespace-nowrap"
              >
                {page.title}
              </button>
              {pages.length > 1 && (
                <button
                  onClick={() => removePage(page.id)}
                  className="absolute -right-2 -top-2 p-1 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
        <form onSubmit={handleAddPage} className="flex items-center gap-2">
          <input
            type="text"
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            placeholder="New page title..."
            className="px-3 py-1 border rounded-lg"
          />
          <button
            type="submit"
            className="p-2 hover:bg-gray-50 rounded-lg"
            disabled={!newPageTitle.trim()}
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};