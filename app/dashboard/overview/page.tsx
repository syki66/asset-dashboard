'use client';

import { AssetChart, PortfolioAllocationChart } from '@/components/chart';
import { DashboardOverviewCard } from '@/components/dashboard/dashboard-overview-card';
import { DollarSign, Trophy, TrendingUp, PiggyBank } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';
import { useChartLayoutStore, useCurrencyStore, useTaxStore } from '@/store/options';
import {
  CURRENT_VALUE_INFO,
  DIVIDEND_YIELD_INFO,
  DIVIDENDS_INFO,
  KRW_CASH_INFO,
  MWR_INFO,
  PRINCIPAL_INFO,
  PROFIT_INFO,
  RETURN_RATE_INFO,
  USD_CASH_INFO,
} from '@/constants/dashboard-info';
import { formatCurrency, getReturnRateColorClass } from '@/utils/format';
import { ChartLayoutToggleButton } from '@/components/ui/chart-layout-toggle-button';
import {
  PORTFOLIO_CHART_COLORS,
  OVERVIEW_CHART_COLORS,
} from '@/constants/chart-colors';
import { useEffect } from 'react';

export default function Page() {
  const themeColor = 'var(--overview-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);
  const tax = useTaxStore((state) => state.tax);
  const chartLayout = useChartLayoutStore((state) => state.chartLayout);
  const setChartLayout = useChartLayoutStore((state) => state.setChartLayout);

  useEffect(() => {
    window.scrollTo(0, 0);
    const frameId = window.requestAnimationFrame(() => window.scrollTo(0, 0));

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const isPostTax = tax === 'post';
  const currentValue = isPostTax
    ? dashboardData.performance.netCurrentValue
    : dashboardData.performance.currentValue;
  const profit = isPostTax
    ? dashboardData.performance.netProfit
    : dashboardData.performance.profit;
  const returnRate = isPostTax
    ? dashboardData.performance.netReturnRate
    : dashboardData.performance.returnRate;

  return (
    <>
      <div className='grid min-w-0 grid-cols-2 gap-3 lg:min-w-[auto] lg:grid-cols-4 lg:gap-4 xl:grid-cols-4 [&>*]:min-w-0 lg:[&>*]:min-w-[auto]'>
        <DashboardOverviewCard
          title='총 자산'
          icon={Trophy}
          themeColor={themeColor}
          className='order-1'
          contentItems={[
            {
              label: '평가금액',
              value: formatCurrency(currentValue, currency),
              valueClassName: 'asset-value-wave lg:text-lg',
              info: CURRENT_VALUE_INFO,
            },
            {
              label: '원금',
              value: formatCurrency(
                dashboardData.performance.principal,
                currency,
              ),
              info: PRINCIPAL_INFO,
            },
          ]}
        />
        <DashboardOverviewCard
          title='투자 성과'
          icon={TrendingUp}
          themeColor={themeColor}
          className='order-3 lg:order-2'
          contentItems={[
            {
              label: '수익금',
              value: formatCurrency(profit, currency),
              valueClassName: getReturnRateColorClass(profit),
              info: PROFIT_INFO,
            },
            {
              label: '수익률',
              value: `${returnRate}%`,
              valueClassName: getReturnRateColorClass(returnRate),
              info: RETURN_RATE_INFO,
            },
            {
              label: 'MWR',
              value: `${isPostTax ? dashboardData.performance.netMwr : dashboardData.performance.mwr}%`,
              info: MWR_INFO,
            },
          ]}
        />

        <DashboardOverviewCard
          title='배당금 (최근 1년)'
          icon={DollarSign}
          themeColor={themeColor}
          className='order-2 lg:order-3'
          contentItems={[
            {
              label: '배당금',
              value: formatCurrency(
                isPostTax
                  ? dashboardData.dividends.netAnnualDividends
                  : dashboardData.dividends.annualDividends,
                currency,
              ),
              valueClassName: 'text-yellow-600',
              info: DIVIDENDS_INFO,
            },
            {
              label: '배당률',
              value: `${isPostTax ? dashboardData.dividends.netDividendYield : dashboardData.dividends.dividendYield}%`,
              info: DIVIDEND_YIELD_INFO,
            },
          ]}
        />
        <DashboardOverviewCard
          title='현금 보유'
          icon={PiggyBank}
          themeColor={themeColor}
          className='order-4'
          contentItems={[
            {
              label: '원화',
              value: formatCurrency(dashboardData.cash.krwCash, 'krw'),
              valueClassName: 'text-[var(--settings-theme)]',
              info: KRW_CASH_INFO,
            },
            {
              label: '달러',
              value: formatCurrency(dashboardData.cash.usdCash, 'usd'),
              valueClassName: 'text-[var(--settings-theme)]',
              info: USD_CASH_INFO,
            },
            {
              label: '합계',
              value: formatCurrency(dashboardData.cash.total, currency),
              info: '원화와 달러 현금을 조회일 환율로 환산해 합산한 금액입니다.',
            },
          ]}
        />
      </div>
      <div className='mt-12 flex flex-wrap items-center justify-between gap-2 px-3.5 lg:mt-8 lg:flex-nowrap lg:gap-0 lg:px-0'>
        <h2 className='text-xl font-bold'>포트폴리오 요약</h2>
        <ChartLayoutToggleButton
          layout={chartLayout}
          themeColor={themeColor}
          onToggle={() =>
            setChartLayout(chartLayout === 'compact' ? 'expanded' : 'compact')
          }
        />
      </div>
      <div
        className={`mt-4 grid min-w-0 gap-x-3 gap-y-6 lg:min-w-[auto] lg:gap-4 [&>*]:min-w-0 lg:[&>*]:min-w-[auto] ${
          chartLayout === 'expanded'
            ? 'grid-cols-1'
            : 'lg:grid-cols-2 xl:grid-cols-2'
        }`}
      >
        <AssetChart
          themeColor={themeColor}
          calendarCategory='overview'
          chartType='line'
          fillBetween={
            isPostTax
              ? ['benchmarkWorstNet', 'benchmarkBestNet']
              : ['benchmarkWorst', 'benchmarkBest']
          }
          seriesToggleGroups={[
            {
              id: 'benchmarkRange',
              name: '벤치마크',
              color: OVERVIEW_CHART_COLORS.benchmarkAverage,
              showActiveBackground: false,
              seriesIds: isPostTax
                ? ['benchmarkBestNet', 'benchmarkWorstNet']
                : ['benchmarkBest', 'benchmarkWorst'],
            },
          ]}
          series={[
            {
              id: 'principal',
              name: '원금',
              color: OVERVIEW_CHART_COLORS.neutral,
              zIndex: 10,
              tooltipOrder: 1,
              data: dashboardData.charts.principal,
            },
            {
              id: isPostTax ? 'netCurrentValue' : 'currentValue',
              name: isPostTax ? '세후 평가금' : '평가금',
              color: OVERVIEW_CHART_COLORS.currentValue,
              zIndex: 30,
              tooltipOrder: 0,
              data: isPostTax
                ? dashboardData.charts.netCurrentValue
                : dashboardData.charts.currentValue,
            },
            {
              id: isPostTax ? 'benchmarkBestNet' : 'benchmarkBest',
              name: '벤치마크 (최상)',
              color: OVERVIEW_CHART_COLORS.benchmarkAverage,
              zIndex: 20,
              tooltipOrder: 2,
              data: isPostTax
                ? dashboardData.charts.benchmarkBestNet
                : dashboardData.charts.benchmarkBest,
            },
            {
              id: isPostTax ? 'benchmarkWorstNet' : 'benchmarkWorst',
              name: '벤치마크 (최악)',
              color: OVERVIEW_CHART_COLORS.benchmarkAverage,
              zIndex: 20,
              tooltipOrder: 3,
              data: isPostTax
                ? dashboardData.charts.benchmarkWorstNet
                : dashboardData.charts.benchmarkWorst,
            },
          ]}
          title='자산 추이'
          description='자산 클래스별 변화 추이'
        />
        <PortfolioAllocationChart
          stocks={dashboardData.stocks}
          cash={dashboardData.cash.total}
          themeColor={themeColor}
          colors={PORTFOLIO_CHART_COLORS}
          isCompact={chartLayout === 'compact'}
          selectedDate={dashboardData.date}
        />
      </div>
    </>
  );
}
