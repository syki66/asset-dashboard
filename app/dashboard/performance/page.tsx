'use client';

import { AssetChart } from '@/components/chart';
import { DashboardOverviewCard } from '@/components/dashboard/dashboard-overview-card';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';
import { formatCurrency } from '@/utils/format';
import { Award, ChartColumnStacked, ChartLine, Landmark } from 'lucide-react';

export default function Page() {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardOverviewCard
          title="자산 분석"
          icon={Award}
          themeColor="var(--performance-theme)"
          contentItems={[
            {
              label: '평가자산',
              value: formatCurrency(dashboardData.currentValue, currency),
              valueClassName: 'animate-gradient-text text-lg',
            },
            {
              label: '원금',
              value: formatCurrency(dashboardData.principal, currency),
            },
            {
              label: '연평균 수익률',
              value: `${3}%`,
            },
            {
              label: '샤프 지수',
              value: `1.25`,
            },
          ]}
        />
        <DashboardOverviewCard
          title="투자 성과"
          icon={ChartLine}
          themeColor="var(--performance-theme)"
          contentItems={[
            {
              label: '수익금',
              value: formatCurrency(dashboardData.profit, currency),
            },
            {
              label: '수익률',
              value: `${dashboardData.returnRate}%`,
            },
            {
              label: '세후 수익금',
              value: formatCurrency(dashboardData.netProfit, currency),
            },
            {
              label: '세후 수익률',
              value: `${dashboardData.netReturnRate}%`,
            },
          ]}
        />
        <DashboardOverviewCard
          title="벤치마크 비교 (세후)"
          icon={ChartColumnStacked}
          themeColor="var(--performance-theme)"
          contentItems={[
            {
              label: '벤치마크 평가금',
              value: formatCurrency(dashboardData.benchmarkNetValue, currency),
            },
            {
              label: '벤치마크 수익금',
              value: formatCurrency(dashboardData.benchmarkNetValue, currency),
            },
            {
              label: '벤치마크 수익률',
              value: `${3}%`,
            },
            { label: '벤치마크 초과수익', value: formatCurrency(5625, 'krw') },
          ]}
        />
        <DashboardOverviewCard
          title="세금 및 제비용"
          icon={Landmark}
          themeColor="var(--performance-theme)"
          contentItems={[
            {
              label: '세금',
              value: formatCurrency(1200, 'krw'),
            },
            {
              label: '환전 수수료',
              value: formatCurrency(3000, 'krw'),
            },
            {
              label: '기타 비용',
              value: formatCurrency(5625, 'krw'),
            },
            {
              label: '합산',
              value: formatCurrency(dashboardData.totalTaxFee, 'krw'),
            },
          ]}
        />
      </div>
      <div className="mt-4">
        <AssetChart
          title="자산 추이"
          themeColor="var(--performance-theme)"
          chartType="line"
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
              id: 'benchmark',
              name: '벤치마크',
              color: '#FF9800',
              data: dashboardData.benchmarkChartData,
            },
          ]}
        />
      </div>
      <div className="mt-4">
        <AssetChart
          title="수익금 비교"
          themeColor="var(--performance-theme)"
          chartType="line"
          series={[
            {
              id: 'profit',
              name: '수익금',
              color: '#4CAF50',
              data: dashboardData.profitChartData,
            },
            {
              id: 'netProfit',
              name: '세후 수익금',
              color: '#673AB7',
              data: dashboardData.netProfitChartData,
            },
            {
              id: 'benchmarkProfit',
              name: '벤치마크 수익금',
              color: '#03A9F4',
              data: dashboardData.benchmarkProfitChartData,
            },
          ]}
        />
      </div>
      <div className="mt-4">
        <AssetChart
          title="지표 비교"
          themeColor="var(--performance-theme)"
          chartType="line"
          series={[
            {
              id: 'cagr',
              name: 'CAGR (연평균 수익률)',
              color: '#3F51B5',
              data: [],
            },
            {
              id: 'sharpeRatio',
              name: '샤프 지수',
              color: '#009688',
              data: [],
            },
          ]}
        />
      </div>
    </>
  );
}
