import { Loader2 } from 'lucide-react';

type LoadingOverlayProps = {
  title: string;
  description?: string;
  accentColor: string;
  compact?: boolean;
};

export function LoadingOverlay({
  title,
  description,
  accentColor,
  compact = false,
}: LoadingOverlayProps) {
  return (
    <div
      className='absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-2xl'
      role='status'
      aria-live='polite'
      aria-busy='true'
    >
      <div
        className='loading-frosted-overlay pointer-events-none absolute inset-0'
        aria-hidden='true'
      />
      <div
        className={`liquid-glass-surface glassmorphism-tooltip relative w-fit ${
          compact ? 'flex items-center gap-1.5 p-2' : 'text-center'
        }`}
      >
        <div
          className={`flex items-center justify-center rounded-full border ${
            compact ? 'h-6 w-6 shrink-0' : 'mx-auto h-11 w-11'
          }`}
          style={{
            borderColor: `color-mix(in oklch, ${accentColor} 20%, transparent)`,
            backgroundColor: `color-mix(in oklch, ${accentColor} 10%, transparent)`,
          }}
        >
          <Loader2
            className={`animate-spin ${compact ? 'h-3 w-3' : 'h-5 w-5'}`}
            style={{ color: accentColor }}
          />
        </div>
        <p
          className={`font-semibold text-foreground ${
            compact ? 'text-[11px]' : 'mt-3 text-sm'
          }`}
        >
          {title}
        </p>
        {!compact && description && (
          <p className='mt-1 text-xs text-muted-foreground'>{description}</p>
        )}
      </div>
    </div>
  );
}
