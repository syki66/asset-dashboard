'use client';

import { useEffect, useState } from 'react';
import { AssetChart } from '@/components/chart';
import { DashboardOverviewCard } from '@/components/dashboard/dashboard-overview-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/store/dashboard';
import { useChartLayoutStore, useCurrencyStore } from '@/store/options';
import { formatCurrency } from '@/utils/format';
import {
  Activity,
  Gauge,
  Maximize2,
  Minimize2,
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
  const rollingRiskInfo =
    '최근 90개 거래일의 TWR 일별 수익률로 계산합니다. 주말 스냅샷은 금요일 가격 복사값이므로 리스크 계산에서 제외합니다.';

  useEffect(() => {
    setRollingChartLayout(chartLayout);
  }, [chartLayout]);

  const chartLayoutButtonStyle =
    rollingChartLayout === 'expanded'
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
        };

  return (
    <>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
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
        <DashboardOverviewCard
          title='샤프지수'
          icon={Gauge}
          themeColor={themeColor}
          contentItems={[
            {
              label: '최상 금리 기준',
              value: dashboardData.drawdown.bestSharpeRatio,
              valueClassName: 'theme-risk',
              info: rollingRiskInfo,
            },
            {
              label: '최악 금리 기준',
              value: dashboardData.drawdown.worstSharpeRatio,
              valueClassName: 'theme-risk',
              info: rollingRiskInfo,
            },
          ]}
        />
        <DashboardOverviewCard
          title='변동성 지수'
          icon={Activity}
          themeColor={themeColor}
          contentItems={[
            {
              label: '90거래일 롤링 변동성',
              value: `${dashboardData.drawdown.volatility}%`,
              valueClassName: 'theme-risk',
              info: rollingRiskInfo,
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
              color: '#F44336',
              data: dashboardData.charts.drawdown,
            },
          ]}
          title='낙폭 상세 차트'
          description='손실 낙폭 변화 추이'
          reverseYAxis={true}
        />
      </div>
      <div className='mt-8 flex items-center justify-between'>
        <h2 className='text-xl font-bold'>90거래일 롤링 지표</h2>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            setRollingChartLayout(
              rollingChartLayout === 'compact' ? 'expanded' : 'compact',
            )
          }
          className='flex items-center gap-2 transition-all hover:opacity-80'
          style={chartLayoutButtonStyle}
        >
          {rollingChartLayout === 'expanded' ? (
            <>
              <Minimize2 className='h-4 w-4' />
              모아보기
            </>
          ) : (
            <>
              <Maximize2 className='h-4 w-4' />
              펼쳐보기
            </>
          )}
        </Button>
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
              color: '#FF9800',
              data: dashboardData.charts.bestSharpeRatio,
              unit: 'number',
            },
            {
              id: 'worstSharpeRatio',
              name: '최악 금리 기준',
              color: '#FFC107',
              data: dashboardData.charts.worstSharpeRatio,
              unit: 'number',
            },
          ]}
          title='90거래일 롤링 샤프지수'
          description='주말 복사 데이터를 제외한 최근 90개 거래일 TWR 수익률과 최상/최악 금리 기준 위험 대비 수익 추이'
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
              color: '#E91E63',
              data: dashboardData.charts.volatility,
              unit: 'percent',
            },
          ]}
          title='90거래일 롤링 변동성'
          description='주말 복사 데이터를 제외한 최근 90개 거래일 TWR 수익률 기준 연환산 변동성'
          showInflationAdjustToggle={false}
          showLogScaleToggle={false}
        />
      </div>
    </>
  );
}
