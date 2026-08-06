'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Disclaimer } from '@/components/footer/disclaimer';
import { SiteFooter } from '@/components/footer/site-footer';
import { initialDashboardData, useDashboardStore } from '@/store/dashboard';
import {
  useCurrencyStore,
  useTaxStore,
  useChartLayoutStore,
  useDashboardDateStore,
} from '@/store/options';
import { useAccountStore, useInterestRateStore } from '@/store/account';
import { useFeeSettingsStore } from '@/store/fee-settings';
import { useSelectedAccountsStore } from '@/store/selectedAccounts';
import {
  convertToDashboardData,
  getDashboardDataByDate,
  mergeAccountData,
} from '@/utils/converter';
import type { DashboardDataset } from '@/types';
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
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarPicker } from '@/components/ui/calendar-picker';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { toast } from 'sonner';
import {
  DashboardCalculationCache,
  getAccountSelectionCacheKey,
} from '@/utils/dashboard-calculation-cache';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Define categories data here
const categories = [
  {
    id: 'overview' as const,
    name: '개요',
    mobileName: '개요',
    subtitle: '주요 지표 한눈에 보기',
    description:
      '자산 포트폴리오의 전반적인 요약과 주요 정보를 한눈에 확인합니다.',
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
    mobileName: '성과',
    subtitle: '성과 지표 및 벤치마크',
    description:
      '기간별 수익률, 연도별 성과, 벤치마크 비교 등 다양한 성과 지표를 분석합니다.',
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
    mobileName: '배당',
    subtitle: '배당금 및 수익률 추이',
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
    mobileName: '위험',
    subtitle: '손실 및 변동성 분석',
    description:
      '최대 낙폭, 변동성 및 샤프지수 등 리스크 관련 지표를 통해 포트폴리오의 위험 수준을 점검합니다.',
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
    mobileName: '구성',
    subtitle: '보유 종목 및 섹터 분석',
    description:
      '보유 종목과 섹터 비중, 집중도 등을 통해 포트폴리오 구성을 상세하게 분석합니다.',
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
    mobileName: '거래',
    subtitle: '매수·매도 기록',
    description: '모든 매수·매도 거래 내역과 기간별 흐름을 확인할 수 있습니다.',
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
    mobileName: '설정',
    subtitle: '표시 계좌 선택',
    description:
      '대시보드에 합산해 표시할 계좌를 선택하거나 거래내역 CSV를 다시 등록합니다.',
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
  const rootPage =
    categories.find((category) => category.id === 'overview') ?? categories[0];
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return {
      title: rootPage.name,
      description: rootPage.description,
    };
  }
  return { title: '대시보드', description: '데이터를 분석하고 관리하세요.' };
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const setDashboardData = useDashboardStore((state) => state.setDashboardData);
  const isDashboardCalculating = useDashboardStore(
    (state) => state.isDashboardCalculating,
  );
  const setIsDashboardCalculating = useDashboardStore(
    (state) => state.setIsDashboardCalculating,
  );
  const setDashboardCalculationError = useDashboardStore(
    (state) => state.setDashboardCalculationError,
  );
  const { currency, setCurrency } = useCurrencyStore();
  const { tax, setTax } = useTaxStore();
  const { chartLayout, setChartLayout } = useChartLayoutStore();
  const dashboardDate = useDashboardDateStore((state) => state.dashboardDate);
  const totalAccountData = useAccountStore((state) => state.totalAccountData);
  const bestInterestRates = useInterestRateStore(
    (state) => state.bestInterestRates,
  );
  const worstInterestRates = useInterestRateStore(
    (state) => state.worstInterestRates,
  );
  const feeSettings = useFeeSettingsStore((state) => state.feeSettings);
  const { selectedAccounts } = useSelectedAccountsStore();
  const pathname = usePathname();
  const router = useRouter();
  const isSetupComplete = totalAccountData.length > 0;
  const isValidDashboardRoute = dashboardRoutes.has(pathname);

  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    formatDateKey(dashboardDate),
  );
  const [dashboardDataset, setDashboardDataset] =
    useState<DashboardDataset | null>(null);
  const [isCurrencyCalculating, setIsCurrencyCalculating] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<'krw' | 'usd' | null>(
    null,
  );
  const calculationCurrency = pendingCurrency ?? currency;
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const currencyCalculationFrameRef = useRef<number | null>(null);
  const calculationCacheRef = useRef(new DashboardCalculationCache());
  // 통화 계산 성공 후 pending 값만 해제될 때 같은 통화 계산이 다시 실행되지 않도록
  // effect는 실제 계산 통화(calculationCurrency)의 변화만 구독합니다.
  const pendingCurrencyRef = useRef(pendingCurrency);
  pendingCurrencyRef.current = pendingCurrency;
  // 통화 계산 실패로 기존 통화로 돌아가는 한 번의 상태 전환만 건너뜁니다.
  // 계산 결과를 보관하거나 재사용하는 캐시는 아닙니다.
  const skipCurrencyRollbackCalculationRef = useRef(false);
  // 계산 commit 직후 날짜 effect가 같은 차트 prefix와 종목을 다시 만들지 않도록 추적합니다.
  const materializedDashboardRef = useRef<{
    dataset: DashboardDataset | null;
    snapshotDate: string | null;
  }>({ dataset: null, snapshotDate: null });
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  useEffect(() => {
    if (!isSetupComplete || !isValidDashboardRoute) {
      router.replace('/setup');
    }
  }, [isSetupComplete, isValidDashboardRoute, router]);

  useEffect(() => {
    return () => {
      if (currencyCalculationFrameRef.current !== null) {
        window.cancelAnimationFrame(currencyCalculationFrameRef.current);
      }
      setIsDashboardCalculating(false);
    };
  }, [setIsDashboardCalculating]);

  useEffect(() => {
    if (!isMobileControlsOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileControlsOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileControlsOpen]);

  useEffect(() => {
    setIsMobileControlsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia('(min-width: 1024px)');
    const updateViewport = () => {
      const isDesktop = desktopMediaQuery.matches;
      setIsDesktopViewport(isDesktop);
      if (!isDesktop) {
        setChartLayout('expanded');
      }
    };

    updateViewport();
    desktopMediaQuery.addEventListener('change', updateViewport);

    return () => {
      desktopMediaQuery.removeEventListener('change', updateViewport);
    };
  }, [setChartLayout]);

  // Setup 완료 또는 Settings 계좌 적용 시 전체 기간 MWR까지 한 번에 계산합니다.
  // 페이지 경로는 의존성에 없으므로 대시보드 화면 이동만으로는 다시 계산하지 않습니다.
  useEffect(() => {
    if (skipCurrencyRollbackCalculationRef.current) {
      skipCurrencyRollbackCalculationRef.current = false;
      return;
    }

    let isCancelled = false;
    const shouldCommitPendingCurrency = pendingCurrencyRef.current !== null;

    const finishCurrencyCalculation = () => {
      if (shouldCommitPendingCurrency) {
        // 새 데이터와 표시 통화를 같은 계산 commit 안에서 바꿔 단위가 엇갈리는 프레임을 막습니다.
        setCurrency(calculationCurrency);
        setPendingCurrency(null);
      }
      setIsCurrencyCalculating(false);
    };

    const commitDashboardDataset = (nextDataset: DashboardDataset) => {
      const nextDashboardData = getDashboardDataByDate(
        nextDataset,
        selectedDateRef.current,
      );

      setDashboardDataset(nextDataset);
      if (nextDashboardData) {
        materializedDashboardRef.current = {
          dataset: nextDataset,
          snapshotDate: nextDashboardData.date,
        };
        setDashboardData(nextDashboardData);
        if (nextDashboardData.date !== selectedDateRef.current) {
          selectedDateRef.current = nextDashboardData.date;
          setSelectedDate(nextDashboardData.date);
        }
      } else {
        materializedDashboardRef.current = {
          dataset: nextDataset,
          snapshotDate: null,
        };
        setDashboardData(initialDashboardData);
      }

      finishCurrencyCalculation();
      setIsDashboardCalculating(false);
    };

    const failDashboardCalculation = (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.';
      console.error('대시보드 데이터 계산에 실패했습니다.', error);

      setDashboardCalculationError(message);
      if (shouldCommitPendingCurrency) {
        skipCurrencyRollbackCalculationRef.current = true;
        setPendingCurrency(null);
      }
      setIsCurrencyCalculating(false);
      setIsDashboardCalculating(false);
      toast.error('대시보드 계산 실패', {
        description: '계좌 데이터를 계산하지 못했습니다. 다시 시도해 주세요.',
      });
    };

    const calculationCache = calculationCacheRef.current;
    calculationCache.setAccountSource(totalAccountData);
    const selectionKey = getAccountSelectionCacheKey(selectedAccounts);
    const datasetCacheInput = {
      selectionKey,
      currency: calculationCurrency,
      feeSettings,
      bestInterestRates,
      worstInterestRates,
    };
    const cachedDataset = calculationCache.getDataset(datasetCacheInput);

    if (cachedDataset) {
      setDashboardCalculationError(null);
      commitDashboardDataset(cachedDataset);
      return;
    }

    setDashboardCalculationError(null);
    setIsDashboardCalculating(true);

    // 0ms 예약은 계산을 늦추기 위한 지연이 아니라, 로딩 overlay를 먼저 paint할 기회를 줍니다.
    // effect가 교체되면 cleanup에서 아직 시작하지 않은 계산을 취소할 수 있습니다.
    const timeoutId = window.setTimeout(() => {
      if (!totalAccountData || selectedAccounts.length === 0) {
        if (!isCancelled) {
          setDashboardDataset(null);
          materializedDashboardRef.current = {
            dataset: null,
            snapshotDate: null,
          };
          setDashboardData(initialDashboardData);
          finishCurrencyCalculation();
          setIsDashboardCalculating(false);
        }
        return;
      }

      try {
        const selectedAccountSet = new Set(selectedAccounts);
        const filteredData = totalAccountData.filter((data) =>
          selectedAccountSet.has(data.name),
        );
        let mergedAccountData = calculationCache.getMerged(selectionKey);
        if (!mergedAccountData) {
          mergedAccountData = mergeAccountData(filteredData);
          calculationCache.setMerged(selectionKey, mergedAccountData);
        }
        const convertedDashboardData = convertToDashboardData(
          mergedAccountData,
          calculationCurrency,
        );
        calculationCache.setDataset(
          datasetCacheInput,
          convertedDashboardData,
        );

        if (!isCancelled) {
          commitDashboardDataset(convertedDashboardData);
        }
      } catch (error) {
        if (!isCancelled) failDashboardCalculation(error);
      }
    }, 0);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    bestInterestRates,
    calculationCurrency,
    feeSettings,
    selectedAccounts,
    setDashboardCalculationError,
    setDashboardData,
    setCurrency,
    setIsDashboardCalculating,
    totalAccountData,
    worstInterestRates,
  ]);

  const dashboardDateRange = useMemo(() => {
    const parseDate = (dateString: string) => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const firstDate = dashboardDataset?.snapshots.at(0)?.date;
    const lastDate = dashboardDataset?.snapshots.at(-1)?.date;

    return {
      minDate: firstDate ? parseDate(firstDate) : undefined,
      maxDate: lastDate ? parseDate(lastDate) : undefined,
    };
  }, [dashboardDataset]);

  // 계좌 데이터와 통화가 변경될 때마다 전역 상태관리로 데이터 전달
  useEffect(() => {
    if (dashboardDataset && dashboardDataset.snapshots.length > 0) {
      const data = getDashboardDataByDate(dashboardDataset, selectedDate);
      if (!data) return;

      // 선택한 날짜가 데이터에 없거나 초기 상태인 경우, 실제 데이터의 날짜로 상태 업데이트
      if (data.date !== selectedDate) {
        selectedDateRef.current = data.date;
        setSelectedDate(data.date);
      }

      if (
        materializedDashboardRef.current.dataset === dashboardDataset &&
        materializedDashboardRef.current.snapshotDate === data.date
      ) {
        return;
      }

      materializedDashboardRef.current = {
        dataset: dashboardDataset,
        snapshotDate: data.date,
      };
      setDashboardData(data);
    } else {
      if (materializedDashboardRef.current.dataset === null) return;

      materializedDashboardRef.current = {
        dataset: null,
        snapshotDate: null,
      };
      setDashboardData(initialDashboardData);
    }
  }, [dashboardDataset, selectedDate, setDashboardData]);

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
    if (nextCurrency === currency || isCurrencyCalculating) return;

    setIsCurrencyCalculating(true);
    currencyCalculationFrameRef.current = window.requestAnimationFrame(() => {
      currencyCalculationFrameRef.current = null;
      setPendingCurrency(nextCurrency);
    });
  };

  if (!isSetupComplete || !isValidDashboardRoute) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative flex min-h-screen min-w-0 flex-col overflow-x-clip lg:min-w-[auto] lg:flex-row lg:overflow-x-visible',
        pageBgClass,
      )}
    >
      <Sidebar
        menuItems={menuItems}
        activeThemeColor={`var(--${activeCategory}-theme)`}
      />

      <div className='hidden w-72 shrink-0 lg:block' />
      <div className='min-w-0 flex-1 p-2 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] lg:min-w-[auto] lg:p-4 lg:pl-0'>
        <div className='flex w-full min-w-0 flex-col bg-transparent p-0 sm:p-1 lg:min-w-[auto] lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:p-8 lg:shadow-[0_0.5rem_2rem_rgb(0_0_0_/_0.07)]'>
          <header
            className={cn(
              'relative px-3 py-4 text-card-foreground lg:sticky lg:top-4 lg:z-40 lg:px-6 lg:py-3',
              isMobileControlsOpen ? 'z-[70]' : 'z-0',
            )}
          >
            <div
              className='liquid-glass-surface pointer-events-none absolute inset-0 z-0 hidden lg:block'
              aria-hidden='true'
            />
            <div className='relative z-10 flex min-w-0 flex-col gap-4 lg:min-w-[auto] lg:flex-row lg:items-start lg:justify-between lg:gap-6'>
              <div className='min-w-0 lg:min-w-[auto]'>
                <h1
                  className={cn(
                    'mb-1 text-2xl font-bold sm:text-3xl lg:mb-2 lg:text-4xl',
                    textThemeClass,
                  )}
                >
                  {title}
                </h1>
                <p className='text-base leading-relaxed text-muted-foreground lg:text-lg lg:leading-7'>
                  {description}
                </p>
              </div>

              <div
                className={cn(
                  'lg:static lg:z-auto lg:flex lg:w-auto lg:min-w-[auto] lg:shrink-0 lg:flex-row lg:items-stretch lg:gap-4 lg:p-0',
                  isMobileControlsOpen
                    ? 'fixed inset-0 z-[70] flex items-end p-2 pb-[calc(env(safe-area-inset-bottom)+4.5rem)]'
                    : 'hidden',
                )}
              >
                <button
                  type='button'
                  className='absolute inset-0 bg-transparent backdrop-blur-[2px] lg:hidden'
                  aria-label='조회 설정 닫기'
                  onClick={() => setIsMobileControlsOpen(false)}
                />
                <div className='relative z-10 flex max-h-[calc(100dvh-5rem)] w-full flex-col gap-6 overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-card/95 p-3 shadow-2xl backdrop-blur-xl lg:contents'>
                  <div className='flex items-center justify-between lg:hidden'>
                    <div>
                      <h2 className='text-base font-bold text-foreground'>
                        조회 설정
                      </h2>
                      <p className='mt-0.5 text-xs text-muted-foreground'>
                        표시 방식과 조회 날짜를 변경합니다.
                      </p>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      className='interactive-lift h-9 w-9 cursor-pointer rounded-xl border-white/15 bg-white/[0.06]'
                      aria-label='조회 설정 닫기'
                      onClick={() => setIsMobileControlsOpen(false)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                {/* Global Options Card */}
                <div className='relative order-2 w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-card/10 shadow-sm lg:order-1 lg:w-fit lg:rounded-2xl lg:shadow-md'>
                  <div className='flex h-full flex-col justify-center p-1.5 backdrop-blur-md lg:p-2'>
                    <div className='mb-2 flex items-center gap-2 text-sm font-bold text-foreground lg:hidden'>
                      <SlidersHorizontal className='h-4 w-4' />
                      공통 옵션
                    </div>
                    <div className='grid grid-cols-4 items-center gap-1.5 lg:flex lg:flex-col lg:gap-2'>
                      <div className='contents lg:flex lg:items-center lg:gap-2'>
                        <Tabs
                          value={tax}
                          onValueChange={(v) => setTax(v as 'pre' | 'post')}
                          className='w-full lg:w-[92px]'
                        >
                          <TabsList
                            style={activeTabStyle}
                            className='grid h-9 w-full grid-cols-2 overflow-y-hidden rounded-lg border border-white/10 bg-white/[0.04] p-0.5 shadow-sm backdrop-blur-xs sm:h-7'
                          >
                            <TabsTrigger
                              value='pre'
                              className='interactive-lift h-8 min-h-0 cursor-pointer rounded-md p-0 text-[11px] leading-none data-[state=active]:shadow-sm sm:h-5 sm:text-[11px]'
                            >
                              세전
                            </TabsTrigger>
                            <TabsTrigger
                              value='post'
                              className='interactive-lift h-8 min-h-0 cursor-pointer rounded-md p-0 text-[11px] leading-none data-[state=active]:shadow-sm sm:h-5 sm:text-[11px]'
                            >
                              세후
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>

                        <Tabs
                          value={chartLayout}
                          onValueChange={(v) => {
                            if (!isDesktopViewport) return;
                            setChartLayout(v as 'expanded' | 'compact');
                          }}
                          className='w-full lg:w-[80px]'
                        >
                          <TabsList
                            style={activeTabStyle}
                            className='grid h-9 w-full grid-cols-2 overflow-y-hidden rounded-lg border border-white/10 bg-white/[0.04] p-0.5 shadow-sm backdrop-blur-xs sm:h-7'
                          >
                            <TabsTrigger
                              value='expanded'
                              disabled={!isDesktopViewport}
                              className='interactive-lift h-8 min-h-0 cursor-pointer rounded-md p-0 text-[10px] leading-none data-[state=active]:shadow-sm sm:h-5'
                              title={
                                isDesktopViewport
                                  ? '펼쳐보기'
                                  : '모바일에서는 펼쳐보기로 고정됩니다'
                              }
                            >
                              <Maximize2 className='h-4 w-4' />
                            </TabsTrigger>
                            <TabsTrigger
                              value='compact'
                              disabled={!isDesktopViewport}
                              className='interactive-lift h-8 min-h-0 cursor-pointer rounded-md p-0 text-[10px] leading-none data-[state=active]:shadow-sm sm:h-5'
                              title={
                                isDesktopViewport
                                  ? '모아보기'
                                  : '모바일에서는 사용할 수 없습니다'
                              }
                            >
                              <LayoutGrid className='h-4 w-4' />
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <div className='contents lg:flex lg:w-full lg:items-center lg:justify-start lg:gap-2'>
                        <Tabs
                          value={currency}
                          onValueChange={(v) =>
                            handleCurrencyChange(v as 'krw' | 'usd')
                          }
                          className='w-full lg:w-[92px] lg:shrink-0'
                        >
                          <TabsList
                            style={activeTabStyle}
                            className='grid h-9 w-full grid-cols-2 overflow-y-hidden rounded-lg border border-white/10 bg-white/[0.04] p-0.5 shadow-sm backdrop-blur-xs sm:h-7'
                          >
                            <TabsTrigger
                              value='krw'
                              className='interactive-lift h-8 min-h-0 cursor-pointer rounded-md p-0 text-[11px] font-semibold leading-none data-[state=active]:shadow-sm sm:h-5 sm:text-[11px]'
                            >
                              ₩
                            </TabsTrigger>
                            <TabsTrigger
                              value='usd'
                              className='interactive-lift h-8 min-h-0 cursor-pointer rounded-md p-0 text-[11px] font-semibold leading-none data-[state=active]:shadow-sm sm:h-5 sm:text-[11px]'
                            >
                              $
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>

                        <div className='flex h-9 min-w-0 items-stretch justify-center lg:h-auto lg:flex-1 lg:items-center'>
                          <span
                            style={activeBadgeStyle}
                            className='flex h-full w-full min-w-0 items-center justify-center truncate rounded-lg px-1.5 text-[11px] font-semibold text-white sm:text-xs lg:h-auto lg:w-auto lg:rounded-full lg:px-2 lg:py-1'
                          >
                            {dashboardData.fxRate.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {isCurrencyCalculating && (
                    <LoadingOverlay
                      compact
                      title='계산 중'
                      accentColor={`var(--${activeCategory}-theme)`}
                    />
                  )}
                </div>

                {/* Status Card */}
                <Popover>
                  <div className='relative order-1 flex w-full min-w-0 shrink-0 flex-col items-start justify-center gap-1.5 rounded-xl border border-white/10 bg-card/10 p-3 text-base shadow-sm backdrop-blur-md sm:text-sm lg:order-2 lg:w-auto lg:min-w-[200px] lg:gap-2 lg:rounded-2xl lg:p-4 lg:shadow-md'>
                    {isDesktopViewport && (
                      <PopoverAnchor className='pointer-events-none absolute inset-0' />
                    )}
                    <div className='flex flex-wrap items-center gap-2 lg:flex-nowrap'>
                      <RefreshCw
                        className={cn(
                          'h-4 w-4',
                          activeTheme?.text ?? 'text-primary',
                        )}
                      />
                      <span className='font-medium text-foreground'>
                        파일 업데이트:
                      </span>
                      <span className='group relative text-muted-foreground lg:cursor-help'>
                        {timeAgo(dashboardData.lastUpdated)}
                        <span className='lg:hidden'>
                          {' ('}
                          {formatDateKr(dashboardData.lastUpdated)})
                        </span>
                        <div className='pointer-events-none absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 lg:block'>
                          {formatDateKr(dashboardData.lastUpdated)}
                        </div>
                      </span>
                    </div>
                    <div className='relative flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap'>
                      {!isDesktopViewport && (
                        <PopoverAnchor className='pointer-events-none absolute inset-x-0 top-0 h-px' />
                      )}
                      <CalendarDays
                        className={cn(
                          'h-4 w-4',
                          activeTheme?.text ?? 'text-primary',
                        )}
                      />
                      <span className='font-medium text-foreground'>조회일:</span>
                      <PopoverTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          style={dateButtonStyle}
                          className={cn(
                            'interactive-lift group h-10 cursor-pointer rounded-md border border-white/15 bg-white/[0.06] px-2 py-0 text-xs font-medium text-foreground shadow-sm hover:bg-[var(--date-button-hover)] hover:text-white data-[state=open]:!cursor-pointer data-[state=open]:!bg-[var(--date-button-hover)] data-[state=open]:!text-white data-[state=open]:hover:!bg-[var(--date-button-hover)] data-[state=open]:hover:!text-white data-[state=open]:hover:!transform-none data-[state=open]:hover:!shadow-sm focus-visible:ring-2 sm:h-6 sm:text-xs',
                          )}
                        >
                          <span>{formatDateKr(dashboardData.date)}</span>
                          <ChevronDown className='h-3.5 w-3.5 opacity-70 group-hover:text-white group-data-[state=open]:!text-white' />
                        </Button>
                      </PopoverTrigger>
                    </div>
                    <PopoverContent
                      className='z-[90] w-auto border-white/10 !bg-transparent p-0 shadow-none'
                      align={isDesktopViewport ? 'end' : 'center'}
                      side={isDesktopViewport ? 'bottom' : 'top'}
                      sideOffset={isDesktopViewport ? 24 : 8}
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
                  </div>
                </Popover>
                </div>
              </div>
            </div>
          </header>

          <main className='min-w-0 flex-1 pt-5 lg:min-w-[auto] lg:pt-8'>
            {children}
            <Disclaimer />
            <SiteFooter
              className='mx-3.5 mt-5 lg:mx-0 lg:mt-6'
              accentColor={`var(--${activeCategory}-theme)`}
            />
          </main>
        </div>
      </div>
      <Button
        type='button'
        variant='ghost'
        style={{ color: `var(--${activeCategory}-theme)` }}
        className={cn(
          'interactive-lift liquid-glass-surface fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-[60] h-12 w-12 cursor-pointer rounded-full p-0 lg:hidden',
          isMobileControlsOpen && 'hidden',
        )}
        aria-label='조회 설정 열기'
        aria-expanded={isMobileControlsOpen}
        onClick={() => setIsMobileControlsOpen(true)}
      >
        <SlidersHorizontal className='h-4 w-4' />
      </Button>
      {isDashboardCalculating &&
        !isCurrencyCalculating &&
        pathname !== '/dashboard/settings' && (
          <div className='fixed inset-0 z-[100]'>
            <LoadingOverlay
              title='대시보드 분석 중'
              description='선택한 계좌 데이터를 계산하고 있습니다.'
              accentColor={`var(--${activeCategory}-theme)`}
            />
          </div>
        )}
    </div>
  );
}
