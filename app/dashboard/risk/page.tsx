'use client';

import { AssetChart } from '@/components/chart';
import { DashboardOverviewCard } from '@/components/dashboard/dashboard-overview-card';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';
import { formatCurrency } from '@/utils/format';
import { ShieldAlert, TrendingDown } from 'lucide-react';

export default function Page() {
  const themeColor = 'var(--risk-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);

  return (
    <>
      <div className='grid gap-4 lg:grid-cols-2'>
        <DashboardOverviewCard
          title='최대 손실 낙폭(MDD)'
          icon={ShieldAlert}
          themeColor={themeColor}
          contentItems={[
            {
              label: '최대 손실 낙폭(MDD)',
              value: formatCurrency(
                dashboardData.drawdown.maxDrawdown,
                currency
              ),
              valueClassName: 'theme-risk',
            },
            {
              label: '회복 기간',
              value: `${dashboardData.drawdown.maxDrawdownStartDate} ~ ${dashboardData.drawdown.maxDrawdownEndDate}`,
            },
            {
              label: '회복 일수',
              value: `${dashboardData.drawdown.recoveryDuration}일`,
            },
          ]}
        />
        <DashboardOverviewCard
          title='하루 최대 낙폭'
          icon={TrendingDown}
          themeColor={themeColor}
          contentItems={[
            {
              label: '하루 최대 낙폭',
              value: formatCurrency(
                dashboardData.drawdown.maxDailyDrawdown,
                currency
              ),
              valueClassName: 'theme-risk',
            },
            {
              label: '최대 낙폭일',
              value: dashboardData.drawdown.maxDailyDrawdownDate,
            },
          ]}
        />
      </div>
      <div className='mt-8'>
        <h2 className='text-xl font-bold'>상세 차트</h2>
      </div>
      <div className='grid gap-4 mt-4'>
        <AssetChart
          themeColor={themeColor}
          chartType='area'
          series={[
            {
              id: 'drawdown',
              name: '손실 낙폭',
              color: '#F44336',
              data: dashboardData.charts.drawdown,
            },
          ]}
          title='손실 낙폭 차트'
          description='손실 낙폭 변화 추이'
          reverseYAxis={true}
        />
      </div>
    </>
  );
}
