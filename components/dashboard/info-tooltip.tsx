'use client';

import React from 'react';
import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  info: React.ReactNode;
  className?: string;
  iconClassName?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function InfoTooltip({
  info,
  className,
  iconClassName,
  side = 'bottom',
}: InfoTooltipProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground/60 transition-colors outline-none hover:text-muted-foreground/80 focus:ring-0 lg:h-auto lg:w-auto lg:shrink',
            className,
          )}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <Info className={cn('h-3.5 w-3.5', iconClassName)} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align='start'
        className='pointer-events-none w-auto min-w-[120px] max-w-[calc(100vw-1rem)] border-none bg-transparent p-0 shadow-none lg:max-w-none'
        style={{ background: 'transparent', backdropFilter: 'none' }}
      >
        <div
          className='liquid-glass-surface glassmorphism-tooltip max-w-[calc(100vw-2rem)] lg:max-w-none'
          style={{
            backgroundColor: 'oklch(0.98 0.01 200 / 0.1)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
        >
          {typeof info === 'string' ? (
            <div className='text-xs whitespace-pre-line'>{info}</div>
          ) : (
            info
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
