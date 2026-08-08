import { Mail } from 'lucide-react';

import { cn } from '@/lib/utils';

export function SiteFooter({
  className,
  accentColor,
}: {
  className?: string;
  accentColor?: string;
}) {
  return (
    <footer
      className={cn(
        'mt-3 flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-0 text-center shadow-sm shadow-black/5 backdrop-blur-sm sm:px-5 lg:mt-4 lg:px-6',
        className,
      )}
      style={accentColor ? { color: accentColor } : undefined}
    >
      <span className='text-xs font-semibold uppercase tracking-[0.16em]'>
        © {new Date().getFullYear()} Pokugi Studio. All rights reserved.
      </span>
      <a
        href='mailto:66syki@gmail.com'
        title='이메일 보내기'
        aria-label='66syki@gmail.com으로 이메일 보내기'
        className='interactive-lift flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/15 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-white/30 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/30'
        style={accentColor ? { color: accentColor } : undefined}
      >
        <Mail className='h-3.5 w-3.5' aria-hidden='true' />
      </a>
    </footer>
  );
}
