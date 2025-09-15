'use client';

import type React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export interface RainbowNavProps {
  items: NavItem[];
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  className?: string;
}

const rainbowColors = [
  { bg: 'bg-red-500', hover: 'hover:bg-red-600', text: 'text-white' },
  { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-white' },
  { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', text: 'text-gray-900' },
  { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'text-gray-900' },
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-white' },
  { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600', text: 'text-white' },
  { bg: 'bg-purple-500', hover: 'hover:bg-purple-600', text: 'text-white' },
];

export function RainbowNav({
  items,
  activeItem,
  onItemClick,
  className,
}: RainbowNavProps) {
  return (
    <nav className={cn('p-6 space-y-3', className)}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;
        const color = rainbowColors[index % rainbowColors.length];

        const buttonContent = (
          <>
            <Icon className="w-6 h-6 shrink-0" />
            <span className="text-sm font-medium flex-1 text-left">
              {item.label}
            </span>
            {isActive && (
              <div
                className={cn(
                  'w-2.5 h-2.5 rounded-full animate-pulse shrink-0',
                  color.text === 'text-white' ? 'bg-white' : 'bg-gray-900'
                )}
              />
            )}
          </>
        );

        return (
          <Link key={item.id} href={item.href}>
            <button
              onClick={() => onItemClick?.(item.id)}
              className={cn(
                'w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200 text-left',
                'font-medium shadow-xs cursor-pointer min-h-14 mb-2',
                color.bg,
                color.hover,
                color.text,
                'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                isActive && 'ring-2 ring-white/30 shadow-lg scale-[1.02]'
              )}
            >
              {buttonContent}
            </button>
          </Link>
        );
      })}
    </nav>
  );
}
