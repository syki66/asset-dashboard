"use client";

import { cn } from "@/lib/utils";
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
}

export function Sidebar({ menuItems }: SidebarProps) {
  return (
    <div className="fixed left-4 top-4 h-[calc(100vh-2rem)] w-64 z-50 glass-card rounded-2xl">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">투자 대시보드</h1>
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
