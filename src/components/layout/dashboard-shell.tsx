'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Menu } from 'lucide-react';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar with burger */}
      <header className="sticky top-0 z-20 flex h-14 items-center border-b border-surface-200 bg-white px-4">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-surface-600 hover:bg-surface-100 hover:text-surface-900 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="ml-3 text-sm font-medium text-surface-500">Menu</span>
      </header>

      <div className="relative flex flex-1 min-w-0 min-h-0">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-6xl mx-auto bg-surface-100 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
