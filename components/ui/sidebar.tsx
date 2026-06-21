"use client";

import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import Link from "next/link";

// Updated SidebarProps
interface SidebarProps {
  menuItems: ({
    id: string;
    name: string;
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
    <div className="fixed left-4 top-4 h-[calc(100vh-2rem)] w-64 z-50 glass-card rounded-2xl">
      <div className="px-6 pb-6 pt-8">
        <div
          className="mb-8 flex h-[88px] animate-[float-soft_8s_linear_infinite] items-center rounded-2xl border border-white/15 bg-white/10 p-3 shadow-lg backdrop-blur-xl"
          style={brandStyle}
        >
          <div className="flex items-center gap-3">
            <div className="animate-[theme-glow_8s_ease-in-out_infinite] flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--sidebar-brand-theme)]/20 bg-white/10 text-[color:var(--sidebar-brand-theme)] shadow-sm backdrop-blur-md">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight text-foreground">
                투자 대시보드
              </h1>
              <p className="mt-0.5 text-xs font-semibold text-[color:var(--sidebar-brand-soft)]">
                Portfolio Analytics
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const { id, href, name, subtitle, icon: Icon, isActive, theme } = item;

            return (
              <Link
                key={id}
                href={href}
                className={cn(
                  'w-full flex flex-col items-start gap-1 px-4 py-3 rounded-xl transition-all duration-200',
                  !isActive && theme.hover,
                  !isActive && 'hover:scale-105',
                  isActive && theme.bg,
                  isActive && 'text-white shadow-lg'
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isActive ? 'text-white' : theme.text
                    )}
                  />
                  <span
                    className={cn(
                      'font-medium',
                      isActive ? 'text-white' : 'text-sidebar-foreground'
                    )}
                  >
                    {name}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xs ml-8",
                    isActive ? "text-white/80" : "text-muted-foreground"
                  )}
                >
                  {subtitle}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
