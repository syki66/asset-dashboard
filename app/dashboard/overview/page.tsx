'use client';

import { AssetChart } from '@/components/chart';
import { DashboardOverviewCard } from '@/components/dashboard/dashboard-overview-card';
import { DollarSign, Trophy, TrendingUp, PiggyBank } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';
import { formatCurrency, getReturnRateColorClass } from '@/utils/format';

export default function Page() {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardOverviewCard
          title="총 자산"
          icon={Trophy}
          contentItems={[
            {
              label: '현재 가치',
              value: formatCurrency(dashboardData.currentValue, currency),
              valueClassName: 'animate-gradient-text text-lg',
            },
            {
              label: '원금',
              value: formatCurrency(dashboardData.principal, currency),
            },
          ]}
        />
        <DashboardOverviewCard
          title="투자 성과"
          icon={TrendingUp}
          contentItems={[
            {
              label: '평가 손익',
              value: formatCurrency(dashboardData.profit, currency),
              valueClassName: getReturnRateColorClass(dashboardData.profit),
            },
            {
              label: '수익률',
              value: `${dashboardData.returnRate}%`,
              valueClassName: getReturnRateColorClass(dashboardData.returnRate),
            },
            {
              label: '세후 수익금',
              value: formatCurrency(
                dashboardData.profit - dashboardData.totalTaxFee,
                currency
              ),
              valueClassName: getReturnRateColorClass(
                dashboardData.profit - dashboardData.totalTaxFee
              ),
            },
          ]}
        />

        <DashboardOverviewCard
          title="배당금 (최근 1년)"
          icon={DollarSign}
          contentItems={[
            {
              label: '배당금',
              value: formatCurrency(dashboardData.dividends, currency),
              valueClassName: 'text-yellow-600',
            },
            {
              label: '배당률',
              value: `${dashboardData.dividendYield}%`,
            },
          ]}
        />
        <DashboardOverviewCard
          title="현금 보유"
          icon={PiggyBank}
          contentItems={[
            {
              label: '원화',
              value: formatCurrency(dashboardData.krwCash, 'krw'),
            },
            {
              label: '달러',
              value: formatCurrency(dashboardData.usdCash, 'usd'),
            },
            {
              label: '환율 (USD/KRW)',
              value: dashboardData.fxRate.toLocaleString(),
            },
          ]}
        />
      </div>
      <div className="mt-4">
        <AssetChart
          series={[
            {
              id: 'principal',
              name: '원금',
              color: '#888888',
              data: dashboardData.principalChartData,
            },
            {
              id: 'currentValue',
              name: '평가금',
              color: '#F44336',
              data: dashboardData.currentValueChartData,
            },
            {
              id: 'profit',
              name: '수익금',
              color: '#4CAF50',
              data: dashboardData.profitChartData,
            },

            {
              id: 'profitAfterTax',
              name: '세후 수익금',
              color: '#673AB7',
              data: dashboardData.profitAfterTaxChartData,
            },
          ]}
          title="자산 포트폴리오 차트"
          description="자산 클래스별 포트폴리오 변화 추이"
        />
      </div>
    </>
  );
}
