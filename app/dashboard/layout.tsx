'use client';

import { Disclaimer } from '@/components/footer/disclaimer';
import { useDashboardStore } from '@/store/dashboard';
import { formatDateKr, timeAgo } from '@/utils/format';
import {
  RefreshCw,
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
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Define categories data here
const categories = [
  {
    id: 'overview' as const,
    name: '개요',
    subtitle: '포트폴리오 전체 현황',
    description: '포트폴리오의 전반적인 요약과 주요 지표를 확인합니다.',
    icon: Home,
    href: '/dashboard/overview',
    theme: {
      text: 'theme-overview',
      bg: 'bg-theme-overview',
      hover: 'hover-bg-theme-overview',
    },
  },
  {
    id: 'performance' as const,
    name: '수익성 분석',
    subtitle: '성과 지표 및 벤치마크',
    description:
      '기간별 수익률, 벤치마크 대비 성과 등 다양한 성과 지표를 분석합니다.',
    icon: TrendingUp,
    href: '/dashboard/performance',
    theme: {
      text: 'theme-performance',
      bg: 'bg-theme-performance',
      hover: 'hover-bg-theme-performance',
    },
  },
  {
    id: 'dividends' as const,
    name: '배당',
    subtitle: '배당금 및 수익률',
    description:
      '수령한 배당금 내역과 배당 수익률 추이를 시각적으로 분석합니다.',
    icon: DollarSign,
    href: '/dashboard/dividends',
    theme: {
      text: 'theme-dividends',
      bg: 'bg-theme-dividends',
      hover: 'hover-bg-theme-dividends',
    },
  },
  {
    id: 'risk' as const,
    name: '리스크 관리',
    subtitle: '손실 및 변동성 분석',
    description:
      '변동성, 최대 낙폭(MDD) 등 리스크 관련 지표를 통해 포트폴리오를 진단합니다.',
    icon: Shield,
    href: '/dashboard/risk',
    theme: {
      text: 'theme-risk',
      bg: 'bg-theme-risk',
      hover: 'hover-bg-theme-risk',
    },
  },
  {
    id: 'portfolio' as const,
    name: '포트폴리오',
    subtitle: '보유 종목 및 섹터 분석',
    description: '보유 종목, 자산군별 비중 및 상세 정보를 상세하게 조회합니다.',
    icon: PieChart,
    href: '/dashboard/portfolio',
    theme: {
      text: 'theme-portfolio',
      bg: 'bg-theme-portfolio',
      hover: 'hover-bg-theme-portfolio',
    },
  },
  {
    id: 'transaction' as const,
    name: '거래 내역',
    subtitle: '매수/매도 기록',
    description:
      '모든 매수, 매도 거래 내역을 기록하고 필터링하여 조회할 수 있습니다.',
    icon: ArrowUpDown,
    href: '/dashboard/transaction',
    theme: {
      text: 'theme-transaction',
      bg: 'bg-theme-transaction',
      hover: 'hover-bg-theme-transaction',
    },
  },
  {
    id: 'chart' as const,
    name: '차트 & 분석',
    subtitle: '시각적 데이터 분석',
    description:
      '다양한 차트와 시각화 도구를 사용하여 데이터를 자유롭게 분석합니다.',
    icon: LineChart,
    href: '/dashboard/chart',
    theme: {
      text: 'theme-chart',
      bg: 'bg-theme-chart',
      hover: 'hover-bg-theme-chart',
    },
  },
  {
    id: 'settings' as const,
    name: '설정',
    subtitle: '환경설정 및 계정 관리',
    description: '계정 정보, 데이터 소스 및 표시 설정을 관리합니다.',
    icon: Settings,
    href: '/dashboard/settings',
    theme: {
      text: 'theme-settings',
      bg: 'bg-theme-settings',
      hover: 'hover-bg-theme-settings',
    },
  },
];

// A helper to find the matching title and description
const getPageDetails = (pathname: string) => {
  const currentCategory = categories.find((c) => pathname.startsWith(c.href));
  if (currentCategory) {
    return {
      title: currentCategory.name,
      description: currentCategory.description,
    };
  }
  const rootPage = categories.find((c) => c.id === 'overview');
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return {
      title: rootPage?.name || '개요',
      description:
        rootPage?.description ||
        '포트폴리오의 전반적인 요약과 주요 지표를 확인합니다.',
    };
  }
  return { title: '대시보드', description: '데이터를 분석하고 관리하세요.' };
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const pathname = usePathname();

  const activeCategory =
    categories.find((c) => pathname.startsWith(c.href))?.id || 'overview';

  const { title, description } = getPageDetails(pathname);

  const menuItems = categories.map((category) => ({
    ...category,
    isActive: category.id === activeCategory,
  }));

  const activeTheme = categories.find((c) => c.id === activeCategory)?.theme;
  const pageBgClass = `page-bg-theme-${activeCategory}`;
  const textThemeClass = activeTheme?.text ?? 'theme-overview';

  return (
    <div className={cn('min-h-screen flex', pageBgClass)}>
      <Sidebar menuItems={menuItems} />

      <div className="w-72 shrink-0" />
      <div className={cn('flex-1 p-4 pl-0')}>
        <div className="glass-card rounded-2xl w-full p-8 flex flex-col">
          <header>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div>
                <h1 className={cn('text-4xl font-bold mb-2', textThemeClass)}>
                  {title}
                </h1>
                <p className="text-muted-foreground text-lg">{description}</p>
              </div>

              <div className="flex flex-col items-start gap-2 rounded-2xl border bg-card backdrop-blur-md shadow-md p-4 text-sm shrink-0">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">
                    파일 업데이트:
                  </span>
                  <span className="text-muted-foreground cursor-help relative group">
                    {timeAgo(dashboardData.lastUpdated)}
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md border shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      {formatDateKr(dashboardData.lastUpdated)}
                    </div>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">
                    계좌 조회:
                  </span>
                  <span className="text-muted-foreground">
                    {formatDateKr(dashboardData.date)}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 pt-8">
            {children}
            <Disclaimer />
          </main>
        </div>
      </div>
    </div>
  );
}
