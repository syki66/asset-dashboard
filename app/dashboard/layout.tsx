'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Disclaimer } from '@/components/footer/disclaimer';
import { initialDashboardData, useDashboardStore } from '@/store/dashboard';
import {
  useCurrencyStore,
  useTaxStore,
  useChartLayoutStore,
  useDashboardDateStore,
} from '@/store/options';
import { useAccountStore } from '@/store/account';
import { useSelectedAccountsStore } from '@/store/selectedAccounts';
import { convertToDashboardData, mergeAccountData } from '@/utils/converter';
import { DashboardProps } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateKey, formatDateKr, timeAgo } from '@/utils/format';
import {
  RefreshCw,
  CalendarDays,
  Home,
  TrendingUp,
  DollarSign,
  Shield,
  PieChart,
  ArrowUpDown,
  Settings,
  LayoutGrid,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarPicker } from '@/components/ui/calendar-picker';

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
    name: '이자 및 배당',
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

const dashboardRoutes = new Set([
  '/dashboard',
  '/dashboard/',
  ...categories.map((category) => category.href),
]);

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

const findDashboardDataByDate = (
  data: DashboardProps[],
  targetDate: string | null,
) => {
  if (data.length === 0) return undefined;
  if (!targetDate) return data.at(-1);

  const exact = data.find((item) => item.date === targetDate);
  if (exact) return exact;

  // 조회일 데이터가 없으면 최신값으로 튀지 않도록 선택일 이전의 가장 가까운 데이터를 사용합니다.
  return [...data].reverse().find((item) => item.date <= targetDate) ?? data[0];
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const setDashboardData = useDashboardStore((state) => state.setDashboardData);
  const { currency, setCurrency } = useCurrencyStore();
  const { tax, setTax } = useTaxStore();
  const { chartLayout, setChartLayout } = useChartLayoutStore();
  const dashboardDate = useDashboardDateStore((state) => state.dashboardDate);
  const totalAccountData = useAccountStore((state) => state.totalAccountData);
  const { selectedAccounts } = useSelectedAccountsStore();
  const pathname = usePathname();
  const router = useRouter();
  const isSetupComplete = totalAccountData.length > 0;
  const isValidDashboardRoute = dashboardRoutes.has(pathname);

  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    formatDateKey(dashboardDate),
  );
  const [allDashboardData, setAllDashboardData] = useState<DashboardProps[]>([]);
  const [isCurrencyCalculating, setIsCurrencyCalculating] = useState(false);
  const dashboardDataCacheRef = useRef(new Map<string, DashboardProps[]>());
  // 계좌 선택 순서가 달라도 같은 조합이면 같은 캐시를 쓰도록 정렬한 키를 만듭니다.
  const selectedAccountKey = useMemo(
    () => [...selectedAccounts].sort().join('|'),
    [selectedAccounts],
  );

  useEffect(() => {
    if (!isSetupComplete || !isValidDashboardRoute) {
      router.replace('/setup');
    }
  }, [isSetupComplete, isValidDashboardRoute, router]);

  // 원본 계좌 데이터가 새로 업로드되거나 교체되면 이전 계산 결과는 더 이상 유효하지 않습니다.
  useEffect(() => {
    dashboardDataCacheRef.current.clear();
  }, [totalAccountData]);

  // 선택 계좌와 통화 조합별로 대시보드 변환 결과를 캐시해 불필요한 재계산을 줄입니다.
  useEffect(() => {
    let isCancelled = false;
    const cacheKey = `${currency}:${selectedAccountKey}`;
    const cachedDashboardData = dashboardDataCacheRef.current.get(cacheKey);

    if (cachedDashboardData) {
      setAllDashboardData(cachedDashboardData);
      setIsCurrencyCalculating(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!totalAccountData || selectedAccounts.length === 0) {
        if (!isCancelled) {
          dashboardDataCacheRef.current.set(cacheKey, []);
          setAllDashboardData([]);
          setIsCurrencyCalculating(false);
        }
        return;
      }

      const selectedAccountSet = new Set(selectedAccounts);
      const filteredData = totalAccountData.filter((data) =>
        selectedAccountSet.has(data.name),
      );
      const mergedAccountData = mergeAccountData(filteredData);
      const convertedDashboardData = convertToDashboardData(
        mergedAccountData,
        currency,
      );

      if (!isCancelled) {
        // 계산 결과를 저장해두면 같은 계좌/통화 조합을 다시 선택할 때 즉시 재사용할 수 있습니다.
        dashboardDataCacheRef.current.set(cacheKey, convertedDashboardData);
        setAllDashboardData(convertedDashboardData);
        setIsCurrencyCalculating(false);
      }
    }, 0);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [currency, selectedAccountKey, selectedAccounts, totalAccountData]);

  const dashboardDateRange = useMemo(() => {
    const parseDate = (dateString: string) => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const firstDate = allDashboardData.at(0)?.date;
    const lastDate = allDashboardData.at(-1)?.date;

    return {
      minDate: firstDate ? parseDate(firstDate) : undefined,
      maxDate: lastDate ? parseDate(lastDate) : undefined,
    };
  }, [allDashboardData]);

  // 계좌 데이터와 통화가 변경될 때마다 전역 상태관리로 데이터 전달
  useEffect(() => {
    if (allDashboardData.length > 0) {
      const data = findDashboardDataByDate(allDashboardData, selectedDate);
      setDashboardData(data as DashboardProps);

      // 선택한 날짜가 데이터에 없거나 초기 상태인 경우, 실제 데이터의 날짜로 상태 업데이트
      if (data && data.date !== selectedDate) {
        setSelectedDate(data.date);
      }
    } else {
      setDashboardData(initialDashboardData);
    }
  }, [allDashboardData, selectedDate, setDashboardData]);

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
  const activeTabStyle = {
    '--active-tab-color': `var(--${activeCategory}-theme)`,
  } as CSSProperties;
  const activeBadgeStyle = {
    backgroundColor: `var(--${activeCategory}-theme)`,
  } as CSSProperties;
  const dateButtonStyle = {
    '--date-button-hover': `var(--${activeCategory}-theme)`,
  } as CSSProperties;
  const handleCurrencyChange = (nextCurrency: 'krw' | 'usd') => {
    if (nextCurrency === currency) return;

    setIsCurrencyCalculating(true);
    setCurrency(nextCurrency);
  };

  if (!isSetupComplete || !isValidDashboardRoute) {
    return null;
  }

  return (
    <div className={cn('min-h-screen flex', pageBgClass)}>
      <Sidebar
        menuItems={menuItems}
        activeThemeColor={`var(--${activeCategory}-theme)`}
      />

      <div className='w-72 shrink-0' />
      <div className={cn('flex-1 p-4 pl-0')}>
        <div className='glass-card rounded-2xl w-full p-8 flex flex-col'>
          <header className='lg:sticky lg:top-4 lg:z-40 lg:rounded-2xl lg:border lg:border-white/10 lg:bg-card/20 lg:px-6 lg:py-3 lg:shadow-lg lg:backdrop-blur-xl'>
            <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6'>
              <div>
                <h1 className={cn('text-4xl font-bold mb-2', textThemeClass)}>
                  {title}
                </h1>
                <p className='text-muted-foreground text-lg'>{description}</p>
              </div>

              <div className='flex flex-col lg:flex-row items-end lg:items-stretch gap-4 shrink-0'>
                {/* Global Options Card */}
                <div className='relative flex flex-col justify-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-card/10 p-2 shadow-md backdrop-blur-md shrink-0 w-fit'>
                  {isCurrencyCalculating && (
                    <div className='absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/45 backdrop-blur-md'>
                      <div
                        className='h-5 w-5 animate-spin rounded-full border-2 border-t-transparent'
                        style={{
                          borderColor: `var(--${activeCategory}-theme)`,
                          borderTopColor: 'transparent',
                        }}
                      />
                      <span
                        className='text-xs font-semibold'
                        style={{ color: `var(--${activeCategory}-theme)` }}
                      >
                        계산 중
                      </span>
                    </div>
                  )}
                  <div className='flex flex-wrap items-center gap-2'>
                    <Tabs
                      value={tax}
                      onValueChange={(v) => setTax(v as 'pre' | 'post')}
                      className='w-[92px]'
                    >
                      <TabsList
                        style={activeTabStyle}
                        className='h-7 w-full grid grid-cols-2 bg-white/[0.04] border border-white/10 p-0.5 rounded-lg shadow-sm backdrop-blur-xs'
                      >
                        <TabsTrigger
                          value='pre'
                          className='h-5 cursor-pointer rounded-md p-0 text-[11px] leading-none data-[state=active]:shadow-sm'
                        >
                          세전
                        </TabsTrigger>
                        <TabsTrigger
                          value='post'
                          className='h-5 cursor-pointer rounded-md p-0 text-[11px] leading-none data-[state=active]:shadow-sm'
                        >
                          세후
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <Tabs
                      value={chartLayout}
                      onValueChange={(v) =>
                        setChartLayout(v as 'expanded' | 'compact')
                      }
                      className='w-[80px]'
                    >
                      <TabsList
                        style={activeTabStyle}
                        className='h-7 w-full grid grid-cols-2 bg-white/[0.04] border border-white/10 p-0.5 rounded-lg shadow-sm backdrop-blur-xs'
                      >
                        <TabsTrigger
                          value='expanded'
                          className='h-5 cursor-pointer rounded-md p-0 text-[10px] leading-none data-[state=active]:shadow-sm'
                          title='펼쳐보기'
                        >
                          <Maximize2 className='h-4 w-4' />
                        </TabsTrigger>
                        <TabsTrigger
                          value='compact'
                          className='h-5 cursor-pointer rounded-md p-0 text-[10px] leading-none data-[state=active]:shadow-sm'
                          title='모아보기'
                        >
                          <LayoutGrid className='h-4 w-4' />
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Tabs
                      value={currency}
                      onValueChange={(v) =>
                        handleCurrencyChange(v as 'krw' | 'usd')
                      }
                      className='w-[92px] shrink-0'
                    >
                      <TabsList
                        style={activeTabStyle}
                        className='h-7 w-full grid grid-cols-2 bg-white/[0.04] border border-white/10 p-0.5 rounded-lg shadow-sm backdrop-blur-xs'
                      >
                        <TabsTrigger
                          value='krw'
                          className='h-5 cursor-pointer rounded-md p-0 text-[11px] font-semibold leading-none data-[state=active]:shadow-sm'
                        >
                          ₩
                        </TabsTrigger>
                        <TabsTrigger
                          value='usd'
                          className='h-5 cursor-pointer rounded-md p-0 text-[11px] font-semibold leading-none data-[state=active]:shadow-sm'
                        >
                          $
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className='flex-1 flex justify-center'>
                      <span
                        style={activeBadgeStyle}
                        className='rounded-full px-2 py-1 text-xs font-semibold text-white'
                      >
                        {dashboardData.fxRate.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Card */}
                <div className='flex flex-col items-start justify-center gap-2 rounded-2xl border border-white/10 bg-card/10 backdrop-blur-md shadow-md p-4 text-sm shrink-0 min-w-[200px]'>
                  <div className='flex items-center gap-2'>
                    <RefreshCw
                      className={cn(
                        'h-4 w-4',
                        activeTheme?.text ?? 'text-primary',
                      )}
                    />
                    <span className='font-medium text-foreground'>
                      파일 업데이트:
                    </span>
                    <span className='text-muted-foreground cursor-help relative group'>
                      {timeAgo(dashboardData.lastUpdated)}
                      <div className='absolute bottom-full right-0 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md border shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10'>
                        {formatDateKr(dashboardData.lastUpdated)}
                      </div>
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CalendarDays
                      className={cn(
                        'h-4 w-4',
                        activeTheme?.text ?? 'text-primary',
                      )}
                    />
                    <span className='font-medium text-foreground'>
                      계좌:
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          style={dateButtonStyle}
                          className={cn(
                            'h-6 cursor-pointer rounded-md border border-white/15 bg-white/[0.06] px-2 py-0 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-[var(--date-button-hover)] hover:text-white hover:shadow-md focus-visible:ring-2',
                          )}
                        >
                          <span>{formatDateKr(dashboardData.date)}</span>
                          <ChevronDown className='h-3.5 w-3.5 opacity-70' />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className='w-auto border-white/10 !bg-transparent p-0 shadow-none'
                        align='end'
                        style={{
                          background: 'transparent',
                          boxShadow: 'none',
                          backdropFilter: 'none',
                          WebkitBackdropFilter: 'none',
                        }}
                      >
                        <CalendarPicker
                          category={activeCategory}
                          minDate={dashboardDateRange.minDate}
                          maxDate={dashboardDateRange.maxDate}
                          selectedDate={(() => {
                            const [y, m, d] = dashboardData.date
                              .split('-')
                              .map(Number);
                            return new Date(y, m - 1, d);
                          })()}
                          onDateSelect={(date) => {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              '0',
                            );
                            const day = String(date.getDate()).padStart(2, '0');
                            const dateString = `${year}-${month}-${day}`;
                            setSelectedDate(dateString);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className='flex-1 pt-8'>
            {children}
            <Disclaimer />
          </main>
        </div>
      </div>
    </div>
  );
}
