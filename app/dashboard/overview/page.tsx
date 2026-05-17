'use client';

import { AssetChart } from '@/components/chart';
import { DashboardOverviewCard } from '@/components/dashboard/dashboard-overview-card';
import { DollarSign, Trophy, TrendingUp, PiggyBank } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';
import { formatCurrency, getReturnRateColorClass } from '@/utils/format';

export default function Page() {
  const themeColor = 'var(--overview-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);

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
              value: formatCurrency(
                dashboardData.performance.currentValue,
                currency,
              ),
              valueClassName: 'animate-gradient-text text-lg',
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
              value: formatCurrency(dashboardData.performance.profit, currency),
              valueClassName: getReturnRateColorClass(
                dashboardData.performance.profit,
              ),
              info: '평가금액 - 원금',
            },
            {
              label: '수익률',
              value: `${dashboardData.performance.returnRate}%`,
              valueClassName: getReturnRateColorClass(
                dashboardData.performance.returnRate,
              ),
              info: '수익금 ÷ 원금',
            },
          ]}
        />

        <DashboardOverviewCard
          title='배당금 (최근 1년)'
          icon={DollarSign}
          themeColor={themeColor}
          contentItems={[
            {
              label: '배당금',
              value: formatCurrency(
                dashboardData.dividends.annualDividends,
                currency,
              ),
              valueClassName: 'text-yellow-600',
            },
            {
              label: '배당률',
              value: `${dashboardData.dividends.dividendYield}%`,
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
      <div className='mt-4'>
        <AssetChart
          themeColor={themeColor}
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
              id: 'benchmarkProfit',
              name: '벤치마크',
              color: '#03A9F4',
              data: dashboardData.charts.benchmark,
            },
          ]}
          title='자산 포트폴리오 차트'
          description='자산 클래스별 포트폴리오 변화 추이'
        />
      </div>
    </>
  );
}
