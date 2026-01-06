'use client';

import { AssetChart, DividendChart } from '@/components/chart';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';

export default function Page() {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);

  return (
    <>
      <div className="mt-8">
        <DividendChart
          themeColor="var(--dividends-theme)"
          data={dashboardData.charts.dividendHistory}
          title="배당금 지급 내역"
          description="기간별 배당금 지급 내역을 확인합니다."
        />
      </div>
      <div className="mt-8">
        <AssetChart
          themeColor="var(--dividends-theme)"
          series={[
            {
              id: 'YoC',
              name: '원금대비배당률',
              color: '#F44336',
              data: dashboardData.charts.yieldOnCost,
            },
          ]}
          title="원금대비배당률 차트"
          description="자산 클래스별 원금대비배당률 변화 추이"
        />
      </div>
      <div className="mt-8">
        <AssetChart
          themeColor="var(--dividends-theme)"
          series={[
            {
              id: 'dividendYield',
              name: '배당률',
              color: '#F44336',
              data: dashboardData.charts.dividendYield,
            },
          ]}
          title="배당률 차트"
          description="자산 클래스별 배당률 변화 추이"
        />
      </div>
    </>
  );
}
