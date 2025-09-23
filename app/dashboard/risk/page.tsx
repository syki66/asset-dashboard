'use client';

import { AssetChart } from '@/components/chart';
import DashboardCard from '@/components/ui/dashboard-card';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';
import { formatCurrency } from '@/utils/format';

export default function Page() {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <DashboardCard
          title={`최대 손실 낙폭 (${dashboardData.maxDrawdownPeriod})`}
          value={formatCurrency(dashboardData.maxDrawdown, currency)}
          description={`하루 최대 낙폭: ${formatCurrency(
            dashboardData.maxDailyDrawdown,
            currency
          )} (${dashboardData.maxDailyDrawdownDate})`}
          valueClassName="text-blue-600"
          descClassName={'text-blue-600'}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        <AssetChart
          themeColor="var(--risk-theme)"
          chartType="area"
          series={[
            {
              id: 'drawdown',
              name: '손실 낙폭',
              color: '#F44336',
              data: dashboardData.drawdownChartData,
            },
          ]}
          title="최대 손실 낙폭 차트"
          description="자산 클래스별 최대 손실 낙폭 변화 추이"
          reverseYAxis={true}
        />
      </div>
    </>
  );
}
