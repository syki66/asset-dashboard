'use client';

import { cn } from '@/lib/utils';
import { Button } from './button';

export interface SeriesInfo {
  id: string;
  name: string;
  color: string;
  showActiveBackground?: boolean;
}

interface SeriesToggleButtonsProps {
  series: SeriesInfo[];
  activeSeries: string[];
  onToggle: (id: string) => void;
  className?: string;
}

export function SeriesToggleButtons({
  series,
  activeSeries,
  onToggle,
  className,
}: SeriesToggleButtonsProps) {
  if (series.length === 0) {
    return null;
  }

  const useScrollableMobileLayout = series.length >= 4;

  return (
    <div
      className={cn(
        'flex py-1 lg:flex-wrap lg:justify-center lg:gap-3 lg:overflow-visible lg:overscroll-auto lg:py-0',
        useScrollableMobileLayout
          ? 'touch-pan-x touch-pan-y flex-nowrap justify-start gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : 'flex-wrap justify-center gap-3 overflow-visible',
        className,
      )}
    >
      {series.map((s) => (
        <Button
          key={s.id}
          variant="outline"
          size="sm"
          className={cn(
            'interactive-lift flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-background/40 shadow-sm backdrop-blur-sm hover:bg-white/10 sm:h-8 lg:text-xs',
            {
              'border-dashed text-muted-foreground hover:border-white/30 hover:text-muted-foreground':
                !activeSeries.includes(s.id),
              'shadow-md hover:shadow-xl': activeSeries.includes(s.id),
            }
          )}
          onClick={() => onToggle(s.id)}
          style={{
            borderColor: activeSeries.includes(s.id) ? s.color : '',
            background: activeSeries.includes(s.id) && s.showActiveBackground === true
              ? `${s.color}20`
              : 'transparent',
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full mr-2 transition-all duration-200"
            style={{
              backgroundColor: s.color,
              opacity: activeSeries.includes(s.id) ? 1 : 0.4,
            }}
          />
          <span
            className="font-medium transition-colors duration-200"
            style={{
              color: activeSeries.includes(s.id) ? s.color : '',
            }}
          >
            {s.name}
          </span>
        </Button>
      ))}
    </div>
  );
}
