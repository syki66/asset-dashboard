'use client';

import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';
import Link from 'next/link';

// Updated SidebarProps
interface SidebarProps {
  menuItems: ({
    id: string;
    name: string;
    mobileName?: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    isActive: boolean;
    theme: {
      text: string;
      bg: string;
      hover: string;
    };
  })[];
  activeThemeColor?: string;
}

export function Sidebar({
  menuItems,
  activeThemeColor = 'var(--overview-theme)',
}: SidebarProps) {
  const brandStyle = {
    '--sidebar-brand-theme': activeThemeColor,
    '--sidebar-brand-soft': `color-mix(in oklch, ${activeThemeColor} 80%, transparent)`,
  } as React.CSSProperties;

  return (
    <>
      <aside className='glass-card fixed left-4 top-4 z-50 hidden h-[calc(100vh-2rem)] w-64 rounded-2xl lg:block'>
        <div className='px-6 pb-6 pt-8'>
          <div
            className='mb-8 flex h-[88px] animate-[float-soft_8s_linear_infinite] items-center rounded-2xl border border-white/10 bg-white/[0.045] p-3 shadow-lg backdrop-blur-xl'
            style={brandStyle}
          >
            <div className='flex items-center gap-3'>
              <div className='animate-[theme-glow_8s_ease-in-out_infinite] flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--sidebar-brand-theme)]/20 bg-white/[0.045] text-[color:var(--sidebar-brand-theme)] shadow-sm backdrop-blur-md'>
                <BarChart3 className='h-5 w-5' />
              </div>
              <div className='min-w-0'>
                <h1 className='text-xl font-bold leading-tight text-foreground'>
                  투자 대시보드
                </h1>
                <p className='mt-0.5 text-xs font-semibold text-[color:var(--sidebar-brand-soft)]'>
                  Portfolio Analytics
                </p>
              </div>
            </div>
          </div>

          <nav className='space-y-2' aria-label='대시보드 메뉴'>
            {menuItems.map((item) => {
              const {
                id,
                href,
                name,
                subtitle,
                icon: Icon,
                isActive,
                theme,
              } = item;

              return (
                <Link
                  key={id}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'interactive-lift flex w-full flex-col items-start gap-1 rounded-xl px-4 py-3',
                    !isActive && theme.hover,
                    isActive && theme.bg,
                    isActive && 'text-white shadow-lg',
                  )}
                >
                  <div className='flex w-full items-center gap-3'>
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'text-white' : theme.text,
                      )}
                    />
                    <span
                      className={cn(
                        'font-medium',
                        isActive
                          ? 'text-white'
                          : 'text-sidebar-foreground',
                      )}
                    >
                      {name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'ml-8 text-xs',
                      isActive ? 'text-white/80' : 'text-muted-foreground',
                    )}
                  >
                    {subtitle}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className='fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-[70] lg:hidden'>
        <nav
          className='liquid-glass-surface grid h-14 grid-cols-7 items-center gap-0.5 rounded-2xl p-1.5'
          aria-label='모바일 대시보드 메뉴'
        >
          {menuItems.map((item) => {
            const {
              id,
              href,
              name,
              mobileName,
              icon: Icon,
              isActive,
              theme,
            } = item;

            return (
              <Link
                key={id}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                style={
                  isActive
                    ? {
                        background: `color-mix(in oklch, var(--${id}-theme) 16%, transparent)`,
                        borderColor: `color-mix(in oklch, var(--${id}-theme) 28%, transparent)`,
                        color: `var(--${id}-theme)`,
                      }
                    : undefined
                }
                className={cn(
                  'interactive-lift flex h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-transparent px-0.5',
                  !isActive && theme.hover,
                  !isActive && 'text-sidebar-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    theme.text,
                  )}
                />
                <span className='max-w-full truncate whitespace-nowrap text-[10px] font-semibold leading-none'>
                  {mobileName ?? name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
