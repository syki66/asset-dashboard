'use client';

import { AssetChart } from '@/components/chart';
import { DashboardOverviewCard } from '@/components/dashboard/dashboard-overview-card';
import { ComparisonTable } from '@/components/dashboard/comparison-table';
import { TooltipContent } from '@/components/dashboard/tooltip-content';
import { useDashboardStore } from '@/store/dashboard';
import {
  useChartLayoutStore,
  useCurrencyStore,
  useTaxStore,
} from '@/store/options';
import { formatCurrency } from '@/utils/format';
import { ChartLine, Landmark, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Page() {
  const themeColor = 'var(--performance-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);
  const tax = useTaxStore((state) => state.tax);
  const chartLayout = useChartLayoutStore((state) => state.chartLayout);
  const setChartLayout = useChartLayoutStore((state) => state.setChartLayout);
  const showAfterTax = tax === 'post';

  const { performance, benchmark, benchmarkWorst, costs } = dashboardData;
  const mwrInfo = (
    <div className='space-y-1 text-xs'>
      <p>
        입출금 시점과 금액을 반영한 연환산 수익률로, 예금 상품의 금리와
        비교할 수 있습니다.
      </p>
      <p className='text-muted-foreground'>
        (0%는 실제 수익률이 0%이거나, 현금흐름 구조상 계산이 불가능해
        0으로 표시된 값일 수 있습니다.)
      </p>
    </div>
  );
  const cagrInfo =
    '원금이 매년 같은 비율로 복리 성장해 현재 평가금액이 된다고 가정한 연평균 수익률입니다.';
  const averageAnnualReturnInfo =
    '누적수익률을 전체 투자 기간(년)으로 나눈 값입니다. 복리 효과는 반영하지 않습니다.';

  const beforeTaxData = [
    {
      metric: '원금',
      investment: formatCurrency(performance.principal, currency),
      benchmark: formatCurrency(performance.principal, currency),
      benchmarkWorst: formatCurrency(performance.principal, currency),
    },
    {
      metric: '평가금액',
      investment: formatCurrency(performance.currentValue, currency),
      benchmark: formatCurrency(benchmark.value, currency),
      benchmarkWorst: formatCurrency(benchmarkWorst.value, currency),
    },
    {
      metric: '누적수익금',
      investment: formatCurrency(performance.profit, currency),
      benchmark: formatCurrency(benchmark.profit, currency),
      benchmarkWorst: formatCurrency(benchmarkWorst.profit, currency),
    },
    {
      metric: '누적수익률',
      investment: `${performance.returnRate}%`,
      benchmark: `${benchmark.returnRate}%`,
      benchmarkWorst: `${benchmarkWorst.returnRate}%`,
    },
    {
      metric: '복리연평균수익률(CAGR)',
      investment: `${performance.cagr}%`,
      benchmark: `${benchmark.cagr}%`,
      benchmarkWorst: `${benchmarkWorst.cagr}%`,
      info: cagrInfo,
    },
    {
      metric: '단순연평균수익률',
      investment: `${performance.averageAnnualReturn}%`,
      benchmark: `${benchmark.averageAnnualReturn}%`,
      benchmarkWorst: `${benchmarkWorst.averageAnnualReturn}%`,
      info: averageAnnualReturnInfo,
    },
    {
      metric: '금액가중수익률(MWR)',
      investment: `${performance.mwr}%`,
      benchmark: `${benchmark.mwr}%`,
      benchmarkWorst: `${benchmarkWorst.mwr}%`,
      info: mwrInfo,
    },
    {
      metric: '초과수익',
      investment: '-',
      benchmark: formatCurrency(benchmark.excessReturn, currency),
      benchmarkWorst: formatCurrency(benchmarkWorst.excessReturn, currency),
    },
  ];

  const afterTaxData = [
    {
      metric: '원금',
      investment: formatCurrency(performance.principal, currency),
      benchmark: formatCurrency(performance.principal, currency),
      benchmarkWorst: formatCurrency(performance.principal, currency),
    },
    {
      metric: '순평가금액',
      investment: formatCurrency(performance.netCurrentValue, currency),
      benchmark: formatCurrency(benchmark.netValue, currency),
      benchmarkWorst: formatCurrency(benchmarkWorst.netValue, currency),
    },
    {
      metric: '순누적수익금',
      investment: formatCurrency(performance.netProfit, currency),
      benchmark: formatCurrency(benchmark.netProfit, currency),
      benchmarkWorst: formatCurrency(benchmarkWorst.netProfit, currency),
    },
    {
      metric: '순누적수익률',
      investment: `${performance.netReturnRate}%`,
      benchmark: `${benchmark.netReturnRate}%`,
      benchmarkWorst: `${benchmarkWorst.netReturnRate}%`,
    },
    {
      metric: '순복리연평균수익률(CAGR)',
      investment: `${performance.netCagr}%`,
      benchmark: `${benchmark.netCagr}%`,
      benchmarkWorst: `${benchmarkWorst.netCagr}%`,
      info: cagrInfo,
    },
    {
      metric: '순단순연평균수익률',
      investment: `${performance.netAverageAnnualReturn}%`,
      benchmark: `${benchmark.netAverageAnnualReturn}%`,
      benchmarkWorst: `${benchmarkWorst.netAverageAnnualReturn}%`,
      info: averageAnnualReturnInfo,
    },
    {
      metric: '순금액가중수익률(MWR)',
      investment: `${performance.netMwr}%`,
      benchmark: `${benchmark.netMwr}%`,
      benchmarkWorst: `${benchmarkWorst.netMwr}%`,
      info: mwrInfo,
    },
    {
      metric: '순초과수익',
      investment: '-',
      benchmark: formatCurrency(benchmark.netExcessReturn, currency),
      benchmarkWorst: formatCurrency(benchmarkWorst.netExcessReturn, currency),
    },
  ];

  return (
    <>
      <div className='grid md:grid-cols-1 xl:grid-cols-3 gap-y-4 xl:gap-4'>
        <div className='col-span-2'>
          <ComparisonTable
            title={`벤치마크 비교 ${showAfterTax ? '(세후)' : ''}`}
            icon={<ChartLine className='h-5 w-5 theme-performance' />}
            themeColor={themeColor}
            comparisonData={showAfterTax ? afterTaxData : beforeTaxData}
          />
        </div>
        <DashboardOverviewCard
          title='세금 및 제비용'
          icon={Landmark}
          themeColor={themeColor}
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
              value: formatCurrency(costs.usBrokerFee, currency),
            },
            {
              label: '미국 SEC 수수료',
              value: formatCurrency(costs.usSecFee, currency),
            },
            {
              label: '국내주식 제비용',
              value: formatCurrency(
                costs.krTransferTax + costs.krBrokerFee + costs.krRegulatoryFee,
                currency,
              ),
              info: (
                <TooltipContent
                  title='국내주식 제비용 상세'
                  items={[
                    {
                      label: '국내 증권거래세',
                      value: formatCurrency(costs.krTransferTax, currency),
                    },
                    {
                      label: '국내 매도 수수료',
                      value: formatCurrency(costs.krBrokerFee, currency),
                    },
                    {
                      label: '국내 유관기관제비용',
                      value: formatCurrency(costs.krRegulatoryFee, currency),
                    },
                  ]}
                />
              ),
            },
            {
              label: '합산',
              value: formatCurrency(dashboardData.costs.totalCost, currency),
              hasDivider: true,
            },
          ]}
        />
      </div>
      <div className='mt-8 flex items-center justify-between'>
        <h2 className='text-xl font-bold'>상세 차트</h2>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setChartLayout(chartLayout === 'compact' ? 'expanded' : 'compact')}
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
        <div>
          <AssetChart
            title='자산 추이'
            themeColor={themeColor}
            chartType='line'
            fillBetween={['benchmarkWorst', 'benchmark']}
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
                name: '벤치마크 (최상)',
                color: '#FF9800',
                data: dashboardData.charts.benchmark,
              },
              {
                id: 'benchmarkWorst',
                name: '벤치마크 (최악)',
                color: '#FF5722',
                data: dashboardData.charts.benchmarkWorst,
              },
            ]}
          />
        </div>
        <div>
          <AssetChart
            title='수익금 비교'
            themeColor={themeColor}
            chartType='line'
            fillBetween={['benchmarkWorstProfit', 'benchmarkProfit']}
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
                name: '벤치마크 수익금 (최상)',
                color: '#03A9F4',
                data: dashboardData.charts.benchmarkProfit,
              },
              {
                id: 'benchmarkWorstProfit',
                name: '벤치마크 수익금 (최악)',
                color: '#00BCD4',
                data: dashboardData.charts.benchmarkWorstProfit,
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}
