'use client';

import { AssetChart } from '@/components/chart';
import DashboardLayout from '@/components/layouts/dashboardLayout';
import DashboardCard from '@/components/ui/dashboard-card';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';
import { formatCurrency, formatDateKr } from '@/utils/format';

export default function Page() {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);

  return (
    <>
      <DashboardLayout
        title="대시보드 개요"
        subTitle="자산 현황을 한눈에 파악하고, 투자 성과를 분석해보세요."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="총 자산"
            value={formatCurrency(dashboardData.currentValue, currency)}
            description={`원금: ${formatCurrency(
              dashboardData.principal,
              currency
            )}`}
          />
          <DashboardCard
            title="수익금"
            value={`${formatCurrency(dashboardData.profit, currency)} (${
              dashboardData.returnRate
            }%)`}
            description={`지표 대비 초과수익 (세후): ${formatCurrency(
              dashboardData.profit -
                dashboardData.totalTaxFee -
                (dashboardData.benchmarkValue - dashboardData.principal),
              currency
            )}`}
            valueClassName={
              dashboardData.profit >= 0 ? 'text-red-600' : 'text-blue-600'
            }
          />
          <DashboardCard
            title="배당금 (최근 1년)"
            value={formatCurrency(dashboardData.dividends, currency)}
            description={`배당률: ${dashboardData.dividendYield}% (원금대비: ${dashboardData.yieldOnCost}%)`}
            valueClassName={'text-yellow-600'}
          />
          <DashboardCard
            title="환율"
            value={dashboardData.fxRate.toLocaleString()}
            description="USD/KRW"
          />
        </div>
        <div className="mt-8">
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
                id: 'benchmark',
                name: '예금',
                color: '#2196F3',
                data: dashboardData.benchmarkChartData,
              },
              {
                id: 'benchmarkProfit',
                name: '예금 수익금',
                color: '#FF9800',
                data: dashboardData.benchmarkProfitChartData,
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
      </DashboardLayout>
    </>
  );
}
