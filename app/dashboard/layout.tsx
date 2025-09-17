'use client';

import { Disclaimer } from '@/components/footer/disclaimer';
import { useDashboardStore } from '@/store/dashboard';
import { formatDateKr, timeAgo } from '@/utils/format';
import {
  CalendarDays,
  FileText,
  Home,
  TrendingUp,
  DollarSign,
  Shield,
  PieChart,
  ArrowUpDown,
  LineChart,
  Settings,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Define categories data here
const categories = [
  {
    id: 'overview' as const,
    name: '개요',
    subtitle: '포트폴리오 전체 현황',
    icon: Home,
    href: '/dashboard/overview',
    theme: {
      text: 'theme-overview',
      bg: 'bg-theme-overview',
      hover: 'hover:bg-indigo-500/10',
    },
  },
  {
    id: 'performance' as const,
    name: '수익성 분석',
    subtitle: '성과 지표 및 벤치마크',
    icon: TrendingUp,
    href: '/dashboard/performance',
    theme: {
      text: 'theme-performance',
      bg: 'bg-theme-performance',
      hover: 'hover:bg-green-500/10',
    },
  },
  {
    id: 'dividends' as const,
    name: '배당',
    subtitle: '배당금 및 수익률',
    icon: DollarSign,
    href: '/dashboard/dividends',
    theme: {
      text: 'theme-dividend',
      bg: 'bg-theme-dividend',
      hover: 'hover:bg-cyan-500/10',
    },
  },
  {
    id: 'risk' as const,
    name: '리스크 관리',
    subtitle: '손실 및 변동성 분석',
    icon: Shield,
    href: '/dashboard/risk',
    theme: {
      text: 'theme-risk',
      bg: 'bg-theme-risk',
      hover: 'hover:bg-red-500/10',
    },
  },
  {
    id: 'portfolio' as const,
    name: '포트폴리오',
    subtitle: '보유 종목 및 섹터 분석',
    icon: PieChart,
    href: '/dashboard/portfolio',
    theme: {
      text: 'theme-portfolio',
      bg: 'bg-theme-portfolio',
      hover: 'hover:bg-purple-500/10',
    },
  },
  {
    id: 'transaction' as const,
    name: '거래 내역',
    subtitle: '매수/매도 기록',
    icon: ArrowUpDown,
    href: '/dashboard/transaction',
    theme: {
      text: 'theme-transaction',
      bg: 'bg-theme-transaction',
      hover: 'hover:bg-orange-500/10',
    },
  },
  {
    id: 'chart' as const,
    name: '차트 & 분석',
    subtitle: '시각적 데이터 분석',
    icon: LineChart,
    href: '/dashboard/chart',
    theme: {
      text: 'theme-chart',
      bg: 'bg-theme-chart',
      hover: 'hover:bg-blue-500/10',
    },
  },
  {
    id: 'settings' as const,
    name: '설정',
    subtitle: '환경설정 및 계정 관리',
    icon: Settings,
    href: '/dashboard/settings',
    theme: {
      text: 'theme-settings',
      bg: 'bg-theme-settings',
      hover: 'hover:bg-gray-500/10',
    },
  },
];

// A helper to find the matching title and subtitle
const getPageDetails = (pathname: string) => {
  const currentCategory = categories.find((c) => pathname.startsWith(c.href));
  if (currentCategory) {
    return { title: currentCategory.name, subTitle: currentCategory.subtitle };
  }
  const rootPage = categories.find((c) => c.id === 'overview');
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return {
      title: rootPage?.name || '개요',
      subTitle: rootPage?.subtitle || '포트폴리오 전체 현황',
    };
  }
  return { title: '대시보드', subTitle: '데이터를 분석하고 관리하세요.' };
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const pathname = usePathname();

  const activeCategory =
    categories.find((c) => pathname.startsWith(c.href))?.id || 'overview';

  const { title, subTitle } = getPageDetails(pathname);

  const menuItems = categories.map((category) => ({
    ...category,
    isActive: category.id === activeCategory,
  }));

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar menuItems={menuItems} />

      <div className="flex-1 pl-64">
        <header className="p-8 border-b">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                {title}
              </h1>
              <p className="text-muted-foreground text-lg">{subTitle}</p>
            </div>

            <div className="flex items-center gap-4 rounded-full bg-card/50 border px-4 py-2 text-sm shrink-0">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">계좌 조회:</span>
                <span className="text-muted-foreground">
                  {formatDateKr(dashboardData.date)}
                </span>
              </div>
              <div className="h-4 border-l" />
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="font-medium text-foreground">업데이트:</span>
                <span className="text-muted-foreground cursor-help relative group">
                  {timeAgo(dashboardData.lastUpdated)}
                  <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md border shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {new Date(dashboardData.lastUpdated).toLocaleString(
                      'ko-KR'
                    )}
                  </div>
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">{children}
        <Disclaimer />
        </main>
      </div>
    </div>
  );
}
