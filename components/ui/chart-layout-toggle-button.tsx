'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ChartLayoutMode = 'expanded' | 'compact';

interface ChartLayoutToggleButtonProps {
  layout: ChartLayoutMode;
  onToggle: () => void;
  themeColor: string;
  className?: string;
}

export function ChartLayoutToggleButton({
  layout,
  onToggle,
  themeColor,
  className,
}: ChartLayoutToggleButtonProps) {
  const isExpanded = layout === 'expanded';

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={onToggle}
      className={cn(
        'interactive-lift flex cursor-pointer items-center gap-2 shadow-sm backdrop-blur-sm',
        className,
      )}
      style={
        isExpanded
          ? {
              color: themeColor,
              borderColor: themeColor,
              backgroundColor: 'var(--card)',
              backdropFilter: 'blur(1.25rem)',
            }
          : {
              color: '#fff',
              borderColor: themeColor,
              backgroundColor: themeColor,
            }
      }
    >
      {isExpanded ? (
        <>
          <Minimize2 className='h-4 w-4' />
          모아보기
        </>
      ) : (
        <>
          <Maximize2 className='h-4 w-4' />
          펼쳐보기
        </>
      )}
    </Button>
  );
}
