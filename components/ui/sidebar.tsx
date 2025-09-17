'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';

// Centralized theme configuration
const themeConfig = {
  overview: {
    text: 'theme-overview',
    bg: 'bg-theme-overview',
    hover: 'hover:bg-indigo-500/10',
  },
  performance: {
    text: 'theme-performance',
    bg: 'bg-theme-performance',
    hover: 'hover:bg-green-500/10',
  },
  dividends: {
    text: 'theme-dividend',
    bg: 'bg-theme-dividend',
    hover: 'hover:bg-cyan-500/10',
  },
  risk: {
    text: 'theme-risk',
    bg: 'bg-theme-risk',
    hover: 'hover:bg-red-500/10',
  },
  portfolio: {
    text: 'theme-portfolio',
    bg: 'bg-theme-portfolio',
    hover: 'hover:bg-purple-500/10',
  },
  transaction: {
    text: 'theme-transaction',
    bg: 'bg-theme-transaction',
    hover: 'hover:bg-orange-500/10',
  },
  chart: {
    text: 'theme-chart',
    bg: 'bg-theme-chart',
    hover: 'hover:bg-blue-500/10',
  },
  settings: {
    text: 'theme-settings',
    bg: 'bg-theme-settings',
    hover: 'hover:bg-gray-500/10',
  },
};

// Updated SidebarProps
interface SidebarProps {
  categories: {
    id: keyof typeof themeConfig;
    name: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
  }[];
  activeCategory: string;
}

export function Sidebar({ categories, activeCategory }: SidebarProps) {
  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-background/80 backdrop-blur-sm z-50 border-r">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">투자 대시보드</h1>
        </div>

        <nav className="space-y-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            const theme = themeConfig[category.id];

            return (
              <Link
                key={category.id}
                href={category.href}
                className={cn(
                  'w-full flex flex-col items-start gap-1 px-4 py-3 rounded-xl transition-all duration-200',
                  !isActive && theme.hover,
                  !isActive && 'hover:scale-105',
                  isActive && theme.bg,
                  isActive && 'text-white shadow-lg'
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isActive ? 'text-white' : theme.text
                    )}
                  />
                  <span
                    className={cn(
                      'font-medium',
                      isActive ? 'text-white' : 'text-sidebar-foreground'
                    )}
                  >
                    {category.name}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-xs ml-8',
                    isActive ? 'text-white/80' : 'text-muted-foreground'
                  )}
                >
                  {category.subtitle}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}