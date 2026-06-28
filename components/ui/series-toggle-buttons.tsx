'use client';

import { cn } from '@/lib/utils';
import { Button } from './button';

export interface SeriesInfo {
  id: string;
  name: string;
  color: string;
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

  return (
    <div className={cn('flex flex-wrap justify-center gap-3', className)}>
      {series.map((s) => (
        <Button
          key={s.id}
          variant="outline"
          size="sm"
          className={cn(
            'flex h-8 cursor-pointer items-center justify-center rounded-full border bg-background/40 shadow-sm backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg active:translate-y-0 active:shadow-sm',
            {
              'border-dashed text-muted-foreground hover:border-white/30 hover:text-muted-foreground':
                !activeSeries.includes(s.id),
              'shadow-md hover:shadow-xl': activeSeries.includes(s.id),
            }
          )}
          onClick={() => onToggle(s.id)}
          style={{
            borderColor: activeSeries.includes(s.id) ? s.color : '',
            background: activeSeries.includes(s.id)
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
