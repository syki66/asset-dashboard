'use client';

import { PortfolioAllocationChart } from '@/components/chart';
import { HoldingsView } from '@/components/dashboard/holdings-view';
import { ChartLayoutToggleButton } from '@/components/ui/chart-layout-toggle-button';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/store/dashboard';
import { useChartLayoutStore } from '@/store/options';

export default function Page() {
  const themeColor = 'var(--portfolio-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const chartLayout = useChartLayoutStore((state) => state.chartLayout);
  const setChartLayout = useChartLayoutStore((state) => state.setChartLayout);

  return (
    <>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-bold'>포트폴리오 차트</h2>
        <ChartLayoutToggleButton
          layout={chartLayout}
          themeColor={themeColor}
          onToggle={() =>
            setChartLayout(chartLayout === 'compact' ? 'expanded' : 'compact')
          }
        />
      </div>
      <div
        className={cn(
          'mt-4 grid gap-4',
          chartLayout === 'compact' ? 'lg:grid-cols-2' : 'grid-cols-1',
        )}
      >
        <PortfolioAllocationChart
          stocks={dashboardData.stocks}
          cash={dashboardData.cash.total}
          themeColor={themeColor}
          description='포트폴리오 내 포함된 ETF의 개별 종목 비중을 합산하여 실제 비중을 계산해 표시합니다. 현재는 일부 ETF만 지원합니다.'
          isCompact={chartLayout === 'compact'}
          selectedDate={dashboardData.date}
        />
        <PortfolioAllocationChart
          stocks={dashboardData.stocks}
          cash={dashboardData.cash.total}
          themeColor={themeColor}
          title='섹터 비중'
          description='포트폴리오 내 포함된 ETF의 섹터 비중을 계산하여 표시합니다. 현재는 일부 ETF만 지원합니다.'
          allocationMode='sectors'
          isCompact={chartLayout === 'compact'}
          selectedDate={dashboardData.date}
        />
      </div>
      <div className='mt-8'>
        <h2 className='text-xl font-bold'>주식 현황</h2>
      </div>
      <div className='mt-4'>
        <HoldingsView stocks={dashboardData.stocks} themeColor={themeColor} />
      </div>
    </>
  );
}
