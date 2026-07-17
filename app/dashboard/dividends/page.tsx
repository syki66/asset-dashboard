'use client';

import { AssetChart, DividendChart } from '@/components/chart';
import DashboardCard from '@/components/dashboard/dashboard-card';
import { useDashboardStore } from '@/store/dashboard';
import {
  useChartLayoutStore,
  useCurrencyStore,
  useTaxStore,
} from '@/store/options';
import { formatCurrency } from '@/utils/format';
import {
  CircleDollarSign,
  Landmark,
  Receipt,
  TrendingUp,
  TrendingUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartLayoutToggleButton } from '@/components/ui/chart-layout-toggle-button';
import { DIVIDENDS_CHART_COLORS } from '@/constants/chart-colors';
import { DIVIDENDS_INFO } from '@/constants/dashboard-info';

export default function Page() {
  const themeColor = 'var(--dividends-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);
  const tax = useTaxStore((state) => state.tax);
  const chartLayout = useChartLayoutStore((state) => state.chartLayout);
  const setChartLayout = useChartLayoutStore((state) => state.setChartLayout);
  const showAfterTax = tax === 'post';
  const { dividends } = dashboardData;

  return (
    <>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <DashboardCard
          title={showAfterTax ? '세후 배당금' : '배당금'}
          value={formatCurrency(
            showAfterTax
              ? dividends.netAnnualDividends
              : dividends.annualDividends,
            currency,
          )}
          description={
            showAfterTax
              ? '최근 1년 동안 받은 세후 배당금'
              : '최근 1년 동안 받은 배당금'
          }
          info={DIVIDENDS_INFO}
          icon={Landmark}
          themeColor={themeColor}
        />
        <DashboardCard
          title={showAfterTax ? '세후 배당률' : '배당률'}
          value={`${showAfterTax ? dividends.netDividendYield : dividends.dividendYield}%`}
          description={
            showAfterTax
              ? '현재 자산 평가액 대비 세후 배당률'
              : '현재 자산 평가액 대비 배당금 비율'
          }
          icon={TrendingUp}
          themeColor={themeColor}
        />
        <DashboardCard
          title={
            showAfterTax ? '세후 배당률 (원금 기준)' : '배당률 (원금 기준)'
          }
          value={`${showAfterTax ? dividends.netYieldOnCost : dividends.yieldOnCost}%`}
          description={
            showAfterTax
              ? '총 투자 원금 대비 세후 배당률'
              : '총 투자 원금 대비 배당금 비율'
          }
          icon={CircleDollarSign}
          themeColor={themeColor}
        />
        <DashboardCard
          title={showAfterTax ? '세후 누적 배당금' : '누적 배당금'}
          value={formatCurrency(
            showAfterTax
              ? dividends.netTotalDividends
              : dividends.totalDividends,
            currency,
          )}
          description={
            showAfterTax
              ? '지금까지 받은 세후 배당금 총액'
              : '지금까지 받은 배당금 총액'
          }
          icon={Receipt}
          themeColor={themeColor}
        />
      </div>
      <div className='mt-8'>
        <h2 className='text-xl font-bold'>배당금 내역</h2>
      </div>
      <div className='mt-4'>
        <DividendChart
          themeColor={themeColor}
          data={
            showAfterTax
              ? dashboardData.charts.dividendHistoryNet
              : dashboardData.charts.dividendHistory
          }
          title={showAfterTax ? '세후 배당금 지급 내역' : '배당금 지급 내역'}
          description={
            showAfterTax
              ? '기간별 세후 배당금 지급 내역을 확인합니다.'
              : '기간별 배당금 지급 내역을 확인합니다.'
          }
        />
      </div>
      <div className='mt-8 flex items-center justify-between'>
        <h2 className='text-xl font-bold'>상세 차트</h2>
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
        <AssetChart
          themeColor={themeColor}
          calendarCategory='dividends'
          series={[
            {
              id: 'dividendYield',
              name: showAfterTax ? '세후 배당률' : '배당률',
              color: DIVIDENDS_CHART_COLORS.primary,
              data: showAfterTax
                ? dashboardData.charts.dividendYieldNet
                : dashboardData.charts.dividendYield,
              unit: 'percent',
            },
          ]}
          title={showAfterTax ? '세후 배당률 변화 추이' : '배당률 변화 추이'}
          description='자산 평가액 대비 세후 배당률'
          showInflationAdjustToggle={false}
          showLogScaleToggle={false}
        />
        <AssetChart
          themeColor={themeColor}
          calendarCategory='dividends'
          series={[
            {
              id: 'YoC',
              name: showAfterTax ? '세후 원금 대비 배당률' : '원금 대비 배당률',
              color: DIVIDENDS_CHART_COLORS.secondary,
              data: showAfterTax
                ? dashboardData.charts.yieldOnCostNet
                : dashboardData.charts.yieldOnCost,
              unit: 'percent',
            },
          ]}
          title={
            showAfterTax
              ? '세후 원금 대비 배당률 변화 추이'
              : '원금 대비 배당률 변화 추이'
          }
          description='세후 원금 대비 배당률'
          icon={TrendingUpDown}
          showInflationAdjustToggle={false}
          showLogScaleToggle={false}
        />
      </div>
    </>
  );
}
