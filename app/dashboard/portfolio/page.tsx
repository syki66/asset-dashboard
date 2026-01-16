'use client';

import { AssetChart } from '@/components/chart';
import DashboardCard from '@/components/dashboard/dashboard-card';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';
import { formatCurrency } from '@/utils/format';

export default function Page() {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);

  return (
    <>
      <DashboardCard
        title="현금"
        value={formatCurrency(dashboardData.cash.total, currency)}
        description={`${formatCurrency(
          dashboardData.cash.usdCash,
          'usd'
        )} + ${formatCurrency(dashboardData.cash.krwCash, 'krw')}`}
        valueClassName="text-red-600"
      />

      <div className="mt-8">
        <AssetChart
          themeColor="var(--portfolio-theme)"
          series={[
            {
              id: 'cash',
              name: '현금',
              color: '#F44336',
              data: dashboardData.charts.currentValue,
            },
          ]}
          title="현금 포트폴리오 차트"
          description="자산 클래스별 포트폴리오 변화 추이"
        />
      </div>
    </>
  );
}
