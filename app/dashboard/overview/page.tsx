'use client';

import { AssetChart, PortfolioAllocationChart } from '@/components/chart';
import { DashboardOverviewCard } from '@/components/dashboard/dashboard-overview-card';
import { DollarSign, Trophy, TrendingUp, PiggyBank, Maximize2, Minimize2 } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';
import { useChartLayoutStore, useCurrencyStore, useTaxStore } from '@/store/options';
import { formatCurrency, getReturnRateColorClass } from '@/utils/format';
import { Button } from '@/components/ui/button';

export default function Page() {
  const themeColor = 'var(--overview-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);
  const tax = useTaxStore((state) => state.tax);
  const chartLayout = useChartLayoutStore((state) => state.chartLayout);
  const setChartLayout = useChartLayoutStore((state) => state.setChartLayout);

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
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <DashboardOverviewCard
          title='총 자산'
          icon={Trophy}
          themeColor={themeColor}
          contentItems={[
            {
              label: '평가금액',
              value: formatCurrency(currentValue, currency),
              valueClassName: 'asset-value-wave',
              info: '주식 + KRX금현물 + 현금',
            },
            {
              label: '원금',
              value: formatCurrency(
                dashboardData.performance.principal,
                currency,
              ),
              info: '입금 총액 - 출금 총액',
            },
          ]}
        />
        <DashboardOverviewCard
          title='투자 성과'
          icon={TrendingUp}
          themeColor={themeColor}
          contentItems={[
            {
              label: '수익금',
              value: formatCurrency(profit, currency),
              valueClassName: getReturnRateColorClass(profit),
              info: '평가금액 - 원금',
            },
            {
              label: '수익률',
              value: `${returnRate}%`,
              valueClassName: getReturnRateColorClass(returnRate),
              info: '수익금 ÷ 원금',
            },
          ]}
        />

        <DashboardOverviewCard
          title={isPostTax ? '세후 배당금 (최근 1년)' : '배당금 (최근 1년)'}
          icon={DollarSign}
          themeColor={themeColor}
          contentItems={[
            {
              label: isPostTax ? '세후 배당금' : '배당금',
              value: formatCurrency(
                isPostTax
                  ? dashboardData.dividends.netAnnualDividends
                  : dashboardData.dividends.annualDividends,
                currency,
              ),
              valueClassName: 'text-yellow-600',
            },
            {
              label: isPostTax ? '세후 배당률' : '배당률',
              value: `${isPostTax ? dashboardData.dividends.netDividendYield : dashboardData.dividends.dividendYield}%`,
            },
          ]}
        />
        <DashboardOverviewCard
          title='현금 보유'
          icon={PiggyBank}
          themeColor={themeColor}
          contentItems={[
            {
              label: '원화',
              value: formatCurrency(dashboardData.cash.krwCash, 'krw'),
            },
            {
              label: '달러',
              value: formatCurrency(dashboardData.cash.usdCash, 'usd'),
            },
          ]}
        />
      </div>
      <div className='mt-8 flex items-center justify-between'>
        <h2 className='text-xl font-bold'>포트폴리오 요약</h2>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setChartLayout(chartLayout === 'compact' ? 'expanded' : 'compact')}
          className='flex items-center gap-2 hover:opacity-80 transition-all'
          style={
            chartLayout === 'expanded'
              ? {
                  color: themeColor,
                  borderColor: themeColor,
                  backgroundColor: 'var(--card)',
                  backdropFilter: 'blur(1.25rem)',
                }
              : {
                  color: '#fff',
                  borderColor: themeColor,
                  backgroundColor: themeColor,
                }
          }
        >
          {chartLayout === 'expanded' ? (
            <>
              <Minimize2 className='w-4 h-4' />
              모아보기
            </>
          ) : (
            <>
              <Maximize2 className='w-4 h-4' />
              펼쳐보기
            </>
          )}
        </Button>
      </div>
      <div
        className={`mt-4 grid gap-4 ${
          chartLayout === 'expanded' ? 'grid-cols-1' : 'lg:grid-cols-2'
        }`}
      >
        <AssetChart
          themeColor={themeColor}
          calendarCategory='overview'
          chartType='line'
          series={[
            {
              id: 'principal',
              name: '원금',
              color: '#888888',
              data: dashboardData.charts.principal,
            },
            {
              id: 'currentValue',
              name: '평가금',
              color: '#F44336',
              data: dashboardData.charts.currentValue,
            },
            {
              id: 'benchmarkBest',
              name: '벤치마크 (최상)',
              color: '#03A9F4',
              data: dashboardData.charts.benchmarkBest,
            },
          ]}
          title='자산 추이'
          description='자산 클래스별 변화 추이'
        />
        <PortfolioAllocationChart
          stocks={dashboardData.stocks}
          cash={dashboardData.cash.total}
          themeColor={themeColor}
          isCompact={chartLayout === 'compact'}
        />
      </div>
    </>
  );
}
