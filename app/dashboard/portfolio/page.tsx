'use client';

import { PortfolioAllocationChart } from '@/components/chart';
import { HoldingsView } from '@/components/dashboard/holdings-view';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/store/dashboard';
import { useChartLayoutStore } from '@/store/options';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function Page() {
  const themeColor = 'var(--portfolio-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const chartLayout = useChartLayoutStore((state) => state.chartLayout);
  const setChartLayout = useChartLayoutStore((state) => state.setChartLayout);

  return (
    <>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-bold'>포트폴리오 차트</h2>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            setChartLayout(chartLayout === 'compact' ? 'expanded' : 'compact')
          }
          className='flex items-center gap-2 hover:opacity-80 transition-all'
          style={
            chartLayout === 'expanded'
              ? {
                  color: themeColor,
                  borderColor: themeColor,
                  backgroundColor: 'var(--card)',
                  backdropFilter: 'blur(1.25rem)',
                }
              : {
                  color: '#fff',
                  borderColor: themeColor,
                  backgroundColor: themeColor,
                }
          }
        >
          {chartLayout === 'expanded' ? (
            <>
              <Minimize2 className='w-4 h-4' />
              모아보기
            </>
          ) : (
            <>
              <Maximize2 className='w-4 h-4' />
              펼쳐보기
            </>
          )}
        </Button>
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
          isCompact={chartLayout === 'compact'}
          selectedDate={dashboardData.date}
        />
        <PortfolioAllocationChart
          stocks={dashboardData.stocks}
          cash={dashboardData.cash.total}
          themeColor={themeColor}
          title='섹터 비중'
          description='현금과 VTI, QQQM의 섹터 구성을 합산한 포트폴리오 섹터 배분입니다.'
          allocationMode='sectors'
          isCompact={chartLayout === 'compact'}
          selectedDate={dashboardData.date}
        />
      </div>
      <div className='mt-8'>
        <h2 className='text-xl font-bold'>주식 현황</h2>
      </div>
      <div className='mt-4'>
        <HoldingsView
          stocks={dashboardData.stocks}
          themeColor={themeColor}
        />
      </div>
    </>
  );
}
