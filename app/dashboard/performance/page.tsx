'use client';

import { AssetChart } from '@/components/chart';
import { DashboardOverviewCard } from '@/components/dashboard/dashboard-overview-card';
import { ComparisonTable } from '@/components/dashboard/comparison-table';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';
import { formatCurrency } from '@/utils/format';
import { Award, ChartLine, Landmark } from 'lucide-react';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function Page() {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);
  const [showAfterTax, setShowAfterTax] = useState(false);

  const { performance, benchmark, costs } = dashboardData;

  const handleToggle = (checked: boolean) => {
    setShowAfterTax(checked);
  };

  const beforeTaxData = [
    {
      metric: '원금',
      investment: formatCurrency(performance.principal, currency),
      benchmark: formatCurrency(performance.principal, currency),
    },
    {
      metric: '평가금액',
      investment: formatCurrency(performance.currentValue, currency),
      benchmark: formatCurrency(benchmark.value, currency),
    },
    {
      metric: '수익금',
      investment: formatCurrency(performance.profit, currency),
      benchmark: formatCurrency(benchmark.profit, currency),
    },
    {
      metric: '수익률',
      investment: `${performance.returnRate}%`,
      benchmark: `${benchmark.returnRate}%`,
    },
    {
      metric: '연평균수익률',
      investment: `${performance.cagr}%`,
      benchmark: `${benchmark.cagr}%`,
    },
    {
      metric: '초과수익',
      investment: formatCurrency(benchmark.excessReturn, currency),
      benchmark: '-',
    },
  ];

  const afterTaxData = [
    {
      metric: '원금',
      investment: formatCurrency(performance.principal, currency),
      benchmark: formatCurrency(performance.principal, currency),
    },
    {
      metric: '순평가금액',
      investment: formatCurrency(performance.netCurrentValue, currency),
      benchmark: formatCurrency(benchmark.netValue, currency),
    },
    {
      metric: '순수익금',
      investment: formatCurrency(performance.netProfit, currency),
      benchmark: formatCurrency(benchmark.netProfit, currency),
    },
    {
      metric: '순수익률',
      investment: `${performance.netReturnRate}%`,
      benchmark: `${benchmark.netReturnRate}%`,
    },
    {
      metric: '순연평균수익률',
      investment: `${performance.netCagr}%`,
      benchmark: `${benchmark.netCagr}%`,
    },
    {
      metric: '순초과수익',
      investment: formatCurrency(benchmark.netExcessReturn, currency),
      benchmark: '-',
    },
  ];

  return (
    <>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <DashboardOverviewCard
          title='자산 분석'
          icon={Award}
          themeColor='var(--performance-theme)'
          contentItems={[
            {
              label: '평가자산',
              value: formatCurrency(
                dashboardData.performance.currentValue,
                currency
              ),
              valueClassName: 'animate-gradient-text text-lg',
            },
            {
              label: '순평가자산',
              value: formatCurrency(
                dashboardData.performance.netCurrentValue,
                currency
              ),
            },
            {
              label: '원금',
              value: formatCurrency(
                dashboardData.performance.principal,
                currency
              ),
            },
          ]}
        />
        <DashboardOverviewCard
          title='투자 성과'
          icon={ChartLine}
          themeColor='var(--performance-theme)'
          contentItems={[
            {
              label: '수익금',
              value: formatCurrency(dashboardData.performance.profit, currency),
            },
            {
              label: '수익률',
              value: `${dashboardData.performance.returnRate}%`,
            },
            {
              label: '순수익금',
              value: formatCurrency(
                dashboardData.performance.netProfit,
                currency
              ),
            },
            {
              label: '순수익률',
              value: `${dashboardData.performance.netReturnRate}%`,
            },
            {
              label: '연평균 수익률',
              value: `${dashboardData.performance.cagr}%`,
            },
          ]}
        />
        <DashboardOverviewCard
          title='세금 및 제비용'
          icon={Landmark}
          themeColor='var(--performance-theme)'
          contentItems={[
            {
              label: '해외주식 양도소득세',
              value: formatCurrency(costs.usTax, currency),
            },
            {
              label: '환전 수수료',
              value: formatCurrency(costs.usFxFee, currency),
            },
            {
              label: '해외주식 매도 수수료',
              value: formatCurrency(costs.usFee, currency),
            },
            {
              label: '기타 비용 (국내주식 비용)',
              value: formatCurrency(costs.krTaxFee, currency),
            },
            {
              label: '합산',
              value: formatCurrency(dashboardData.costs.totalCost, currency),
            },
          ]}
        />
      </div>
      <div className='mt-4'>
        <ComparisonTable
          title={`벤치마크 비교 ${showAfterTax ? '(세후)' : ''}`}
          icon={<ChartLine className='h-5 w-5 theme-performance' />}
          themeColor='var(--performance-theme)'
          comparisonData={showAfterTax ? afterTaxData : beforeTaxData}
          addon={
            <div className='flex items-center space-x-2'>
              <Switch
                id='tax-switch'
                checked={showAfterTax}
                onCheckedChange={handleToggle}
                style={
                  { '--switch-bg': 'var(--performance-theme)' } as React.CSSProperties
                }
              />
              <Label htmlFor='tax-switch'>세후</Label>
            </div>
          }
        />
      </div>
      <div className='mt-4'>
        <AssetChart
          title='자산 추이'
          themeColor='var(--performance-theme)'
          chartType='line'
          series={[
            {
              id: 'principal',
              name: '원금',
              color: '#888888',
              data: dashboardData.charts.principal,
            },
            {
              id: 'currentValue',
              name: '평가금',
              color: '#F44336',
              data: dashboardData.charts.currentValue,
            },
            {
              id: 'benchmark',
              name: '벤치마크',
              color: '#FF9800',
              data: dashboardData.charts.benchmark,
            },
          ]}
        />
      </div>
      <div className='mt-4'>
        <AssetChart
          title='수익금 비교'
          themeColor='var(--performance-theme)'
          chartType='line'
          series={[
            {
              id: 'profit',
              name: '수익금',
              color: '#4CAF50',
              data: dashboardData.charts.profit,
            },
            {
              id: 'netProfit',
              name: '세후 수익금',
              color: '#673AB7',
              data: dashboardData.charts.netProfit,
            },
            {
              id: 'benchmarkProfit',
              name: '벤치마크 수익금',
              color: '#03A9F4',
              data: dashboardData.charts.benchmarkProfit,
            },
          ]}
        />
      </div>
    </>
  );
}
