'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TooltipItem {
  label: string;
  value: string | number;
}

interface TooltipContentProps {
  title?: string;
  items: TooltipItem[];
  className?: string;
}

export function TooltipContent({ title, items, className }: TooltipContentProps) {
  return (
    <div
      className={cn(
        'w-[min(14rem,calc(100vw-2rem))] min-w-0 max-w-[calc(100vw-2rem)] lg:w-auto lg:min-w-[140px] lg:max-w-none',
        className,
      )}
    >
      {title && (
        <p className='text-center font-bold text-sm mb-2'>
          {title}
        </p>
      )}
      {title && <hr className='border-border my-1' />}
      <div className={cn('space-y-1', title && 'mt-2')}>
        {items.map((item, index) => (
          <div key={index} className='flex min-w-0 items-center justify-between gap-4 text-xs lg:min-w-[auto]'>
            <span className='min-w-0 truncate opacity-80 lg:min-w-[auto] lg:overflow-visible lg:text-clip lg:whitespace-normal'>
              {item.label}
            </span>
            <span className='shrink-0 whitespace-nowrap font-semibold lg:shrink lg:whitespace-normal'>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
