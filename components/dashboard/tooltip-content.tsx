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
    <div className={cn('min-w-[140px]', className)}>
      {title && (
        <p className='text-center font-bold text-sm mb-2'>
          {title}
        </p>
      )}
      {title && <hr className='border-border my-1' />}
      <div className={cn('space-y-1', title && 'mt-2')}>
        {items.map((item, index) => (
          <div key={index} className='flex items-center justify-between text-xs gap-4'>
            <span className='opacity-80'>{item.label}</span>
            <span className='font-semibold'>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
