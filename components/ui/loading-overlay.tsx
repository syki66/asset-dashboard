import { Loader2 } from 'lucide-react';

type LoadingOverlayProps = {
  title: string;
  description: string;
  accentColor: string;
};

export function LoadingOverlay({
  title,
  description,
  accentColor,
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
      <div className='liquid-glass-surface glassmorphism-tooltip relative w-fit text-center'>
        <div
          className='mx-auto flex h-11 w-11 items-center justify-center rounded-full border'
          style={{
            borderColor: `color-mix(in oklch, ${accentColor} 20%, transparent)`,
            backgroundColor: `color-mix(in oklch, ${accentColor} 10%, transparent)`,
          }}
        >
          <Loader2
            className='h-5 w-5 animate-spin'
            style={{ color: accentColor }}
          />
        </div>
        <p className='mt-3 text-sm font-semibold text-foreground'>{title}</p>
        <p className='mt-1 text-xs text-muted-foreground'>{description}</p>
      </div>
    </div>
  );
}
