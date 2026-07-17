'use client';

import {
  PortfolioAllocationChart,
  type PortfolioAllocationSummary,
} from '@/components/chart';
import DashboardCard from '@/components/dashboard/dashboard-card';
import { HoldingsView } from '@/components/dashboard/holdings-view';
import { ChartLayoutToggleButton } from '@/components/ui/chart-layout-toggle-button';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/store/dashboard';
import { useChartLayoutStore } from '@/store/options';
import { Boxes, Gauge, Layers } from 'lucide-react';
import { useCallback, useState } from 'react';

export default function Page() {
  const themeColor = 'var(--portfolio-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const chartLayout = useChartLayoutStore((state) => state.chartLayout);
  const setChartLayout = useChartLayoutStore((state) => state.setChartLayout);
  const [allocationSummary, setAllocationSummary] =
    useState<PortfolioAllocationSummary | null>(null);
  const [sectorSummary, setSectorSummary] =
    useState<PortfolioAllocationSummary | null>(null);
  const handleSummaryChange = useCallback(
    (summary: PortfolioAllocationSummary) => setAllocationSummary(summary),
    [],
  );
  const handleSectorSummaryChange = useCallback(
    (summary: PortfolioAllocationSummary) => setSectorSummary(summary),
    [],
  );

  return (
    <>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <DashboardCard
          title='보유 종목'
          value={dashboardData.stocks.length.toLocaleString()}
          description='현재 계좌에 직접 보유한 종목 수'
          icon={Boxes}
          themeColor={themeColor}
        />
        <DashboardCard
          title='구성 종목'
          value={
            allocationSummary
              ? allocationSummary.holdingCount.toLocaleString()
              : '-'
          }
          description='ETF 내부 구성까지 반영한 종목 수'
          icon={Layers}
          themeColor={themeColor}
        />
        <DashboardCard
          title='종목 집중도'
          value={
            allocationSummary
              ? `${(allocationSummary.concentrationHhi / 100).toFixed(1)}%`
              : '-'
          }
          description='높을수록 일부 종목에 집중된 상태'
          info='보유 종목과 현금 비중의 제곱을 합산한 허핀달-허쉬만 지수(HHI)를 백분율로 환산한 값입니다. 높을수록 일부 종목에 집중된 상태입니다.'
          icon={Gauge}
          themeColor={themeColor}
        />
        <DashboardCard
          title='섹터 집중도'
          value={
            sectorSummary
              ? `${(sectorSummary.concentrationHhi / 100).toFixed(1)}%`
              : '-'
          }
          description='높을수록 일부 섹터에 집중된 상태'
          info='섹터와 현금 비중의 제곱을 합산한 허핀달-허쉬만 지수(HHI)를 백분율로 환산한 값입니다. 높을수록 일부 섹터에 집중된 상태입니다.'
          icon={Gauge}
          themeColor={themeColor}
        />
      </div>
      <div className='mt-8 flex items-center justify-between'>
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
          onSummaryChange={handleSummaryChange}
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
          onSummaryChange={handleSectorSummaryChange}
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
