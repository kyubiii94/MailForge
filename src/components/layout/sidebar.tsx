'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  FolderOpen,
  PenLine,
  Sparkles,
  Zap,
  Users,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/brief', label: 'Nouveau Brief', icon: PenLine },
  { href: '/campaigns', label: 'Campagnes', icon: FolderOpen },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isDrawer = typeof onClose === 'function';

  return (
    <>
      {/* Overlay when drawer is open */}
      {isDrawer && open && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-black/40 transition-opacity md:bg-black/20"
          aria-label="Fermer le menu"
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-surface-200 flex flex-col z-30 transition-transform duration-200 ease-out',
          isDrawer && !open && '-translate-x-full'
        )}
      >
        <div className="p-6 border-b border-surface-100 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2.5 flex-1 min-w-0" onClick={isDrawer ? onClose : undefined}>
          <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-surface-900">MailForge</h1>
            <p className="text-[10px] font-medium text-brand-600 tracking-wider uppercase">Newsletter AI</p>
          </div>
          </Link>
          {isDrawer && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-800 transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider px-3 mb-3">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/') || (item.href === '/campaigns' && pathname.startsWith('/campaign')) || (item.href === '/clients' && pathname.startsWith('/clients'));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isDrawer ? onClose : undefined}
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

      <div className="p-4 border-t border-surface-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-800">MailForge</p>
            <p className="text-xs text-surface-400">Gemini AI</p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
