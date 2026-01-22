'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Home,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
  Activity,
  PieChart,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SidebarProps {
  onLogout?: () => void;
  walletAddress?: string;
}

export function Sidebar({ onLogout, walletAddress }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = [
    {
      label: 'Create Intent',
      href: '/app',
      icon: Target,
      active: pathname === '/app',
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: PieChart,
      active: pathname === '/dashboard',
    },
    {
      label: 'Strategies',
      href: '/strategies',
      icon: BarChart3,
      active: pathname === '/strategies',
    },
    {
      label: 'Activity',
      href: '/activity',
      icon: Activity,
      active: pathname === '/activity',
    },
    {
      label: 'Transactions',
      href: '/transactions',
      icon: FileText,
      active: pathname === '/transactions',
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold">I</span>
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">
                Intent AI
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-3 text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-primary/10',
                        item.active &&
                          'bg-sidebar-primary/20 text-sidebar-primary font-semibold'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4 space-y-3">
            {walletAddress && (
              <div className="text-xs text-sidebar-foreground/60 truncate px-2">
                {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
              </div>
            )}
            {onLogout && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={onLogout}
              >
                <LogOut className="h-5 w-5" />
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
