'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Dna,
  FolderOpen,
  Settings,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

const navItems = [
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/brand-dna', label: 'ADN de Marque', icon: Dna },
  { href: '/campaigns', label: 'Campagnes', icon: FolderOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-surface-200 flex flex-col z-30">
      {/* Logo */}
      <div className="p-6 border-b border-surface-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-surface-900">MailForge</h1>
            <p className="text-[10px] font-medium text-brand-600 tracking-wider uppercase">AI Platform</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider px-3 mb-3">
          Modules
        </p>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-brand-600' : 'text-surface-400')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-surface-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-800">MVP</p>
            <p className="text-xs text-surface-400">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
