'use client';

import { AssetChart, DividendChart } from '@/components/chart';
import DashboardCard from '@/components/dashboard/dashboard-card';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';
import { formatCurrency } from '@/utils/format';
import { CircleDollarSign, Landmark, Receipt, TrendingUp, TrendingUpDown } from 'lucide-react';

export default function Page() {
  const themeColor = 'var(--dividends-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);
  const { dividends } = dashboardData;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <DashboardCard
          title="배당금"
          value={formatCurrency(dividends.annualDividends, currency)}
          description="최근 1년 동안 받은 배당금"
          icon={Landmark}
          themeColor={themeColor}
        />
        <DashboardCard
          title="배당률"
          value={`${dividends.dividendYield}%`}
          description="현재 자산 평가액 대비 배당금 비율"
          icon={TrendingUp}
          themeColor={themeColor}
        />
        <DashboardCard
          title="배당률 (원금 기준)"
          value={`${dividends.yieldOnCost}%`}
          description="총 투자 원금 대비 배당금 비율"
          icon={CircleDollarSign}
          themeColor={themeColor}
        />
        <DashboardCard
          title="누적 배당금"
          value={formatCurrency(dividends.totalDividends, currency)}
          description="지금까지 받은 누적 배당금"
          icon={Receipt}
          themeColor={themeColor}
        />
      </div>
      <div className="mt-8">
        <DividendChart
          themeColor={themeColor}
          data={dashboardData.charts.dividendHistory}
          title="배당금 지급 내역"
          description="기간별 배당금 지급 내역을 확인합니다."
        />
      </div>
      <div className="mt-8">
        <AssetChart
          themeColor={themeColor}
          series={[
            {
              id: 'dividendYield',
              name: '배당률',
              color: '#FFEB3B', 
              data: dashboardData.charts.dividendYield,
              unit: 'percent',
            },
          ]}
          title="배당률 변화 추이"
          description="자산 평가액 대비 배당률 (Dividend Yield)"
          showInflationAdjustToggle={false}
          showLogScaleToggle={false}
        />
      </div>
      <div className="mt-8">
        <AssetChart
          themeColor={themeColor}
          series={[
            {
              id: 'YoC',
              name: '원금대비배당률',
              color: '#FFC107',
              data: dashboardData.charts.yieldOnCost,
              unit: 'percent',
            },
          ]}
          title="원금 대비 배당률 변화 추이"
          description="원금 대비 배당률 (Yield on Cost)"
          icon={TrendingUpDown}
          showInflationAdjustToggle={false}
          showLogScaleToggle={false}
        />
      </div>

    </>
  );
}
