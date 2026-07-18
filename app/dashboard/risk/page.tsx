'use client';

import { useEffect, useState } from 'react';
import { AssetChart } from '@/components/chart';
import { DashboardOverviewCard } from '@/components/dashboard/dashboard-overview-card';
import { ChartLayoutToggleButton } from '@/components/ui/chart-layout-toggle-button';
import { RISK_CHART_COLORS } from '@/constants/chart-colors';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/store/dashboard';
import { useChartLayoutStore, useCurrencyStore } from '@/store/options';
import { formatCurrency } from '@/utils/format';
import {
  BEST_SHARPE_RATIO_INFO,
  DRAWDOWN_DAYS_INFO,
  DAILY_DRAWDOWN_INFO,
  DRAWDOWN_PERIOD_INFO,
  MAX_DRAWDOWN_INFO,
  VOLATILITY_INFO,
  WORST_SHARPE_RATIO_INFO,
} from '@/constants/dashboard-info';
import {
  Activity,
  ShieldAlert,
  TrendingDown,
} from 'lucide-react';

type ChartLayout = 'expanded' | 'compact';

export default function Page() {
  const themeColor = 'var(--risk-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);
  const chartLayout = useChartLayoutStore((state) => state.chartLayout);
  const [rollingChartLayout, setRollingChartLayout] =
    useState<ChartLayout>(chartLayout);

  useEffect(() => {
    setRollingChartLayout(chartLayout);
  }, [chartLayout]);

  return (
    <>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
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
              info: MAX_DRAWDOWN_INFO,
            },
            {
              label: '회복 기간',
              value: `${dashboardData.drawdown.maxDrawdownStartDate} ~ ${dashboardData.drawdown.maxDrawdownEndDate}`,
              info: DRAWDOWN_PERIOD_INFO,
            },
            {
              label: '회복 일수',
              value: `${dashboardData.drawdown.recoveryDuration}일`,
              info: DRAWDOWN_DAYS_INFO,
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
              info: DAILY_DRAWDOWN_INFO,
            },
            {
              label: '최대 낙폭일',
              value: dashboardData.drawdown.maxDailyDrawdownDate,
              info: DAILY_DRAWDOWN_INFO,
            },
          ]}
        />
        <DashboardOverviewCard
          title='리스크 지표'
          icon={Activity}
          themeColor={themeColor}
          contentItems={[
            {
              label: '샤프지수 (최상 금리)',
              value: dashboardData.drawdown.bestSharpeRatio,
              valueClassName: 'theme-risk',
              info: BEST_SHARPE_RATIO_INFO,
            },
            {
              label: '샤프지수 (최악 금리)',
              value: dashboardData.drawdown.worstSharpeRatio,
              valueClassName: 'theme-risk',
              info: WORST_SHARPE_RATIO_INFO,
            },
            {
              label: '90거래일 롤링 변동성',
              value: `${dashboardData.drawdown.volatility}%`,
              valueClassName: 'theme-risk',
              info: VOLATILITY_INFO,
            },
          ]}
        />
      </div>
      <div className='mt-8'>
        <h2 className='text-xl font-bold'>상세 낙폭 차트</h2>
      </div>
      <div className='grid gap-4 mt-4'>
        <AssetChart
          themeColor={themeColor}
          calendarCategory='risk'
          chartType='area'
          series={[
            {
              id: 'drawdown',
              name: '손실 낙폭',
              color: RISK_CHART_COLORS.primary,
              data: dashboardData.charts.drawdown,
            },
          ]}
          title='낙폭 상세 차트'
          description='손실 낙폭 변화 추이'
          reverseYAxis={true}
          displayAsNegative
          showLogScaleToggle={false}
          showInflationAdjustToggle={false}
        />
      </div>
      <div className='mt-8 flex items-center justify-between'>
        <h2 className='text-xl font-bold'>90거래일 롤링 지표</h2>
        <ChartLayoutToggleButton
          layout={rollingChartLayout}
          themeColor={themeColor}
          onToggle={() =>
            setRollingChartLayout(
              rollingChartLayout === 'compact' ? 'expanded' : 'compact',
            )
          }
        />
      </div>
      <div
        className={cn(
          'mt-4 grid gap-4',
          rollingChartLayout === 'compact' ? 'lg:grid-cols-2' : 'grid-cols-1',
        )}
      >
        <AssetChart
          themeColor={themeColor}
          calendarCategory='risk'
          chartType='line'
          series={[
            {
              id: 'bestSharpeRatio',
              name: '최상 금리 기준',
              color: RISK_CHART_COLORS.rollingBest,
              data: dashboardData.charts.bestSharpeRatio,
              unit: 'number',
            },
            {
              id: 'worstSharpeRatio',
              name: '최악 금리 기준',
              color: RISK_CHART_COLORS.rollingWorst,
              data: dashboardData.charts.worstSharpeRatio,
              unit: 'number',
            },
          ]}
          title='90거래일 롤링 샤프지수'
          description='최근 90개 거래일의 TWR 일별 수익률과 사용자가 입력한 최상/최하 금리를 무위험 수익률로 가정한 위험 대비 수익 추이'
          showInflationAdjustToggle={false}
          showLogScaleToggle={false}
        />
        <AssetChart
          themeColor={themeColor}
          calendarCategory='risk'
          chartType='line'
          series={[
            {
              id: 'volatility',
              name: '변동성',
              color: RISK_CHART_COLORS.rollingVolatility,
              data: dashboardData.charts.volatility,
              unit: 'percent',
            },
          ]}
          title='90거래일 롤링 변동성'
          description='주말 복사 데이터를 제외한 최근 90개 거래일 TWR 수익률 기준 연환산 변동성'
          showInflationAdjustToggle={false}
          showLogScaleToggle={false}
          yAxisMin={0}
        />
      </div>
    </>
  );
}
