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
            'inline-flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground/80 transition-colors outline-none focus:ring-0',
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
        className='w-auto min-w-[120px] p-0 border-none bg-transparent shadow-none pointer-events-none'
        style={{ background: 'transparent', backdropFilter: 'none' }}
      >
        <div
          className='liquid-glass-surface glassmorphism-tooltip'
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
