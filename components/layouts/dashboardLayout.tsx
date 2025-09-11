'use client';

import { useDashboardStore } from '@/store/dashboard';
import { formatDateKr, timeAgo } from '@/utils/format';
import { CalendarDays, FileText } from 'lucide-react';

interface DashboardLayoutProps {
  title: string;
  subTitle: string;
  children: React.ReactNode;
}

export default function DashboardLayout({
  title,
  subTitle,
  children,
}: DashboardLayoutProps) {
  const dashboardData = useDashboardStore((state) => state.dashboardData);

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <header className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">{title}</h1>
            <p className="text-muted-foreground text-lg">{subTitle}</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="font-medium text-foreground">
                  최근 업데이트:
                </span>
              </div>
              <span className="text-muted-foreground cursor-help relative group">
                {timeAgo(dashboardData.lastUpdated)}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md border shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {formatDateKr(dashboardData.lastUpdated)}
                </div>
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-foreground">
                  계좌 조회 날짜:
                </span>
              </div>
              <span className="text-muted-foreground">
                {formatDateKr(dashboardData.date)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area - Placeholder */}
      <main className="px-6 py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
