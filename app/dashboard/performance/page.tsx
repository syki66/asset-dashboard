'use client';

import { useEffect, useState } from 'react';
import { AssetChart, DividendChart } from '@/components/chart';
import { DashboardOverviewCard } from '@/components/dashboard/dashboard-overview-card';
import { ComparisonTable } from '@/components/dashboard/comparison-table';
import { useDashboardStore } from '@/store/dashboard';
import {
  useChartLayoutStore,
  useCurrencyStore,
  useTaxStore,
} from '@/store/options';
import { formatCurrency } from '@/utils/format';
import {
  ChartLine,
  Landmark,
  TrendingUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartLayoutToggleButton } from '@/components/ui/chart-layout-toggle-button';
import { useFeeSettingsStore } from '@/store/fee-settings';
import {
  BEST_WORST_YEAR_INFO,
  CURRENT_VALUE_INFO,
  MWR_INFO,
  NET_CURRENT_VALUE_INFO,
  PRINCIPAL_INFO,
  PROFIT_INFO,
  RETURN_RATE_INFO,
} from '@/constants/dashboard-info';
import { PERFORMANCE_CHART_COLORS } from '@/constants/chart-colors';

type ChartLayout = 'expanded' | 'compact';

export default function Page() {
  const themeColor = 'var(--performance-theme)';
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);
  const tax = useTaxStore((state) => state.tax);
  const chartLayout = useChartLayoutStore((state) => state.chartLayout);
  const feeSettings = useFeeSettingsStore((state) => state.feeSettings);
  const [detailChartLayout, setDetailChartLayout] =
    useState<ChartLayout>(chartLayout);
  const [returnChartLayout, setReturnChartLayout] =
    useState<ChartLayout>(chartLayout);
  const showAfterTax = tax === 'post';

  useEffect(() => {
    setDetailChartLayout(chartLayout);
    setReturnChartLayout(chartLayout);
  }, [chartLayout]);

  const { performance, benchmarkBest, benchmarkWorst, costs } = dashboardData;
  const twrInfo =
    '입출금 영향을 제거해 운용 성과를 보는 연환산 수익률입니다. 현재 데이터는 일별 스냅샷 기준이라 입출금의 하루 중 발생 시점은 반영하지 않는 근사치입니다.';
  const cagrInfo =
    '원금이 매년 같은 비율로 복리 성장해 현재 평가금액이 된다고 가정한 연평균 수익률입니다.';
  const averageAnnualReturnInfo =
    '누적수익률을 전체 투자 기간(년)으로 나눈 값입니다. 복리 효과는 반영하지 않습니다.';
  const principalInfo = PRINCIPAL_INFO;
  const excessReturnInfo = (
    <div className='space-y-1 text-xs'>
      <p>
        벤치마크 수익금에서 내 포트폴리오 수익금을 뺀 값입니다. 양수면
        벤치마크가 더 높고, 음수면 내 포트폴리오가 더 높습니다.
      </p>
      <p className='text-muted-foreground'>
        같은 기간의 입출금 흐름과 사용자가 입력한 금리를 기준으로 예금
        복리상품 시뮬레이션을 돌려 비교합니다.
      </p>
    </div>
  );
  const formatRate = (rate: number) => `${Number((rate * 100).toFixed(6))}%`;
  const fxFeeRate =
    feeSettings.exchangeFeeRate * feeSettings.exchangeSpreadRate;
  const fxDiscountRate = 1 - feeSettings.exchangeFeeRate;
  const costCurrencyOptions =
    currency === 'usd'
      ? {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      : undefined;
  const costInfo = {
    usTax: (
      <div className='space-y-1 text-xs'>
        <p>
          해외주식 양도차익에 적용하는 추정 세금입니다. 양도차익이
          양수일 때 {formatRate(feeSettings.usCapitalGainsTaxRate)}를 단순
          적용하며, 연 250만원 기본공제는 계산하지 않습니다.
        </p>
        <p>
          실제 양도소득세는 확정 매도 시점의 환율, 기본공제, 수수료 등
          신고 기준을 반영하므로 화면의 값과 다를 수 있습니다.
        </p>
      </div>
    ),
    usFxFee: `달러 자산을 원화로 환산할 때 반영하는 추정 환전 비용입니다. 환스프레드 ${formatRate(feeSettings.exchangeSpreadRate)}에 환전우대 ${formatRate(fxDiscountRate)}를 적용해 ${formatRate(fxFeeRate)}를 반영합니다.`,
    usBrokerFee: `해외주식 매도 시 발생하는 증권사 수수료입니다. 평가금액에 ${formatRate(feeSettings.usBrokerFeeRate)}를 적용합니다.`,
    usSecFee: `미국 주식 매도 시 부과되는 SEC 수수료입니다. 평가금액에 ${formatRate(feeSettings.usSecFeeRate)}를 적용합니다.`,
    krTransferTax: `국내주식 매도 시 부과되는 증권거래세입니다. 평가금액에 ${formatRate(feeSettings.krTransferTaxRate)}를 적용합니다.`,
    krBrokerFee: `국내주식 매도 시 발생하는 증권사 수수료입니다. 평가금액에 ${formatRate(feeSettings.krBrokerFeeRate)}를 적용합니다.`,
    krRegulatoryFee: `국내주식 매도 시 발생하는 유관기관제비용입니다. 평가금액에 ${formatRate(feeSettings.krRegulatoryFeeRate)}를 적용합니다.`,
  };
  const bestYear = showAfterTax ? performance.netBestYear : performance.bestYear;
  const worstYear = showAfterTax
    ? performance.netWorstYear
    : performance.worstYear;
  const yearlyProfits = showAfterTax
    ? performance.netYearlyProfits
    : performance.yearlyProfits;
  const yearlyProfitChartData = yearlyProfits.map((yearProfit) => ({
    date: `${yearProfit.year}-01-01`,
    value: yearProfit.profit,
  }));
  const renderChartLayoutButton = (
    layout: ChartLayout,
    setLayout: (layout: ChartLayout) => void,
  ) => (
    <ChartLayoutToggleButton
      layout={layout}
      themeColor={themeColor}
      onToggle={() => setLayout(layout === 'compact' ? 'expanded' : 'compact')}
    />
  );

  const beforeTaxData = [
    {
      metric: '원금',
      investment: formatCurrency(performance.principal, currency),
      benchmarkBest: formatCurrency(performance.principal, currency),
      benchmarkWorst: formatCurrency(performance.principal, currency),
      info: principalInfo,
    },
    {
      metric: '평가금액',
      investment: formatCurrency(performance.currentValue, currency),
      benchmarkBest: formatCurrency(benchmarkBest.value, currency),
      benchmarkWorst: formatCurrency(benchmarkWorst.value, currency),
      info: CURRENT_VALUE_INFO,
    },
    {
      metric: '누적수익금',
      investment: formatCurrency(performance.profit, currency),
      benchmarkBest: formatCurrency(benchmarkBest.profit, currency),
      benchmarkWorst: formatCurrency(benchmarkWorst.profit, currency),
      info: PROFIT_INFO,
    },
    {
      metric: '누적수익률',
      investment: `${performance.returnRate}%`,
      benchmarkBest: `${benchmarkBest.returnRate}%`,
      benchmarkWorst: `${benchmarkWorst.returnRate}%`,
      info: RETURN_RATE_INFO,
    },
    {
      metric: '금액가중수익률(MWR)',
      investment: `${performance.mwr}%`,
      benchmarkBest: `${benchmarkBest.mwr}%`,
      benchmarkWorst: `${benchmarkWorst.mwr}%`,
      info: MWR_INFO,
    },
    {
      metric: '시간가중수익률(TWR)',
      investment: `${performance.twr}%`,
      benchmarkBest: `${benchmarkBest.twr}%`,
      benchmarkWorst: `${benchmarkWorst.twr}%`,
      info: twrInfo,
    },
    {
      metric: '복리연평균수익률(CAGR)',
      investment: `${performance.cagr}%`,
      benchmarkBest: `${benchmarkBest.cagr}%`,
      benchmarkWorst: `${benchmarkWorst.cagr}%`,
      info: cagrInfo,
    },
    {
      metric: '단순연평균수익률',
      investment: `${performance.averageAnnualReturn}%`,
      benchmarkBest: `${benchmarkBest.averageAnnualReturn}%`,
      benchmarkWorst: `${benchmarkWorst.averageAnnualReturn}%`,
      info: averageAnnualReturnInfo,
    },
    {
      metric: '초과수익',
      investment: '-',
      benchmarkBest: formatCurrency(benchmarkBest.excessReturn, currency),
      benchmarkWorst: formatCurrency(benchmarkWorst.excessReturn, currency),
      info: excessReturnInfo,
    },
  ];

  const afterTaxData = [
    {
      metric: '원금',
      investment: formatCurrency(performance.principal, currency),
      benchmarkBest: formatCurrency(performance.principal, currency),
      benchmarkWorst: formatCurrency(performance.principal, currency),
      info: principalInfo,
    },
    {
      metric: '순평가금액',
      investment: formatCurrency(performance.netCurrentValue, currency),
      benchmarkBest: formatCurrency(benchmarkBest.netValue, currency),
      benchmarkWorst: formatCurrency(benchmarkWorst.netValue, currency),
      info: NET_CURRENT_VALUE_INFO,
    },
    {
      metric: '순누적수익금',
      investment: formatCurrency(performance.netProfit, currency),
      benchmarkBest: formatCurrency(benchmarkBest.netProfit, currency),
      benchmarkWorst: formatCurrency(benchmarkWorst.netProfit, currency),
      info: PROFIT_INFO,
    },
    {
      metric: '순누적수익률',
      investment: `${performance.netReturnRate}%`,
      benchmarkBest: `${benchmarkBest.netReturnRate}%`,
      benchmarkWorst: `${benchmarkWorst.netReturnRate}%`,
      info: RETURN_RATE_INFO,
    },
    {
      metric: '순금액가중수익률(MWR)',
      investment: `${performance.netMwr}%`,
      benchmarkBest: `${benchmarkBest.netMwr}%`,
      benchmarkWorst: `${benchmarkWorst.netMwr}%`,
      info: MWR_INFO,
    },
    {
      metric: '순시간가중수익률(TWR)',
      investment: `${performance.netTwr}%`,
      benchmarkBest: `${benchmarkBest.netTwr}%`,
      benchmarkWorst: `${benchmarkWorst.netTwr}%`,
      info: twrInfo,
    },
    {
      metric: '순복리연평균수익률(CAGR)',
      investment: `${performance.netCagr}%`,
      benchmarkBest: `${benchmarkBest.netCagr}%`,
      benchmarkWorst: `${benchmarkWorst.netCagr}%`,
      info: cagrInfo,
    },
    {
      metric: '순단순연평균수익률',
      investment: `${performance.netAverageAnnualReturn}%`,
      benchmarkBest: `${benchmarkBest.netAverageAnnualReturn}%`,
      benchmarkWorst: `${benchmarkWorst.netAverageAnnualReturn}%`,
      info: averageAnnualReturnInfo,
    },
    {
      metric: '순초과수익',
      investment: '-',
      benchmarkBest: formatCurrency(benchmarkBest.netExcessReturn, currency),
      benchmarkWorst: formatCurrency(benchmarkWorst.netExcessReturn, currency),
      info: excessReturnInfo,
    },
  ];

  return (
    <>
      <div className='grid md:grid-cols-1 xl:grid-cols-3 gap-y-4 xl:gap-4'>
        <div className='col-span-2'>
          <ComparisonTable
            title={`예금 벤치마크 비교 ${showAfterTax ? '(세후)' : ''}`}
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
              value: formatCurrency(
                costs.usTax,
                currency,
                costs.usTax === 0 ? undefined : costCurrencyOptions,
              ),
              info: costInfo.usTax,
            },
            {
              label: '환전 수수료',
              value: formatCurrency(
                costs.usFxFee,
                currency,
                costs.usFxFee === 0 ? undefined : costCurrencyOptions,
              ),
              info: costInfo.usFxFee,
            },
            {
              label: '해외주식 매도 수수료',
              value: formatCurrency(
                costs.usBrokerFee,
                currency,
                costs.usBrokerFee === 0 ? undefined : costCurrencyOptions,
              ),
              info: costInfo.usBrokerFee,
            },
            {
              label: '미국 SEC 수수료',
              value: formatCurrency(
                costs.usSecFee,
                currency,
                costs.usSecFee === 0 ? undefined : costCurrencyOptions,
              ),
              info: costInfo.usSecFee,
            },
            {
              label: '국내 증권거래세',
              value: formatCurrency(
                costs.krTransferTax,
                currency,
                costs.krTransferTax === 0 ? undefined : costCurrencyOptions,
              ),
              info: costInfo.krTransferTax,
            },
            {
              label: '국내주식 매도 수수료',
              value: formatCurrency(
                costs.krBrokerFee,
                currency,
                costs.krBrokerFee === 0 ? undefined : costCurrencyOptions,
              ),
              info: costInfo.krBrokerFee,
            },
            {
              label: '국내 유관기관제비용',
              value: formatCurrency(
                costs.krRegulatoryFee,
                currency,
                costs.krRegulatoryFee === 0 ? undefined : costCurrencyOptions,
              ),
              info: costInfo.krRegulatoryFee,
            },
            {
              label: '합산',
              value: formatCurrency(
                dashboardData.costs.totalCost,
                currency,
                dashboardData.costs.totalCost === 0
                  ? undefined
                  : costCurrencyOptions,
              ),
              hasDivider: true,
            },
          ]}
        />
      </div>
      <div className='mt-4 grid gap-4 xl:grid-cols-[minmax(18rem,24rem)_1fr]'>
        <DashboardOverviewCard
          title='Best / Worst Year'
          icon={TrendingUpDown}
          themeColor={themeColor}
          contentItems={[
            {
              label: 'Best Year',
              value: bestYear.year,
              info: BEST_WORST_YEAR_INFO,
            },
            {
              label: showAfterTax ? '순수익금' : '수익금',
              value: formatCurrency(bestYear.profit, currency),
              valueClassName: 'theme-performance',
              info: BEST_WORST_YEAR_INFO,
            },
            {
              label: 'Worst Year',
              value: worstYear.year,
              hasDivider: true,
              info: BEST_WORST_YEAR_INFO,
            },
            {
              label: showAfterTax ? '순수익금' : '수익금',
              value: formatCurrency(worstYear.profit, currency),
              valueClassName: 'theme-performance',
              info: BEST_WORST_YEAR_INFO,
            },
          ]}
        />
        <DividendChart
          themeColor={themeColor}
          data={yearlyProfitChartData}
          title={showAfterTax ? '연도별 순수익금' : '연도별 수익금'}
          description=''
          icon={ChartLine}
          valueLabel={showAfterTax ? '순수익금' : '수익금'}
          showTimeRangeTabs={false}
          defaultTimeRange='max'
          chartHeightClassName='h-40'
        />
      </div>
      <div className='mt-8 flex items-center justify-between'>
        <h2 className='text-xl font-bold'>상세 차트</h2>
        {renderChartLayoutButton(detailChartLayout, setDetailChartLayout)}
      </div>
      <div
        className={cn(
          'mt-4 grid gap-4',
          detailChartLayout === 'compact' ? 'lg:grid-cols-2' : 'grid-cols-1',
        )}
      >
        <div className='h-full'>
          <AssetChart
            title='자산 추이'
            themeColor={themeColor}
            chartType='line'
            calendarCategory='performance'
            fillBetween={
              showAfterTax
                ? ['benchmarkWorstNet', 'benchmarkBestNet']
                : ['benchmarkWorst', 'benchmarkBest']
            }
            seriesToggleGroups={[
              {
                id: 'benchmarkRange',
                name: showAfterTax ? '벤치마크 세후 평가금' : '벤치마크 평가금',
                color: PERFORMANCE_CHART_COLORS.benchmarkAverage,
                showActiveBackground: false,
                seriesIds: showAfterTax
                  ? ['benchmarkBestNet', 'benchmarkWorstNet']
                  : ['benchmarkBest', 'benchmarkWorst'],
              },
            ]}
            series={[
              {
                id: 'principal',
                name: '원금',
                color: PERFORMANCE_CHART_COLORS.neutral,
                zIndex: 10,
                tooltipOrder: 1,
                data: dashboardData.charts.principal,
              },
              {
                id: 'currentValue',
                name: showAfterTax ? '세후 평가금' : '평가금',
                color: PERFORMANCE_CHART_COLORS.currentValue,
                zIndex: 30,
                tooltipOrder: 0,
                data: showAfterTax
                  ? dashboardData.charts.netCurrentValue
                  : dashboardData.charts.currentValue,
              },
              {
                id: showAfterTax ? 'benchmarkBestNet' : 'benchmarkBest',
                name: showAfterTax
                  ? '벤치마크 세후 평가금 (최상)'
                  : '벤치마크 평가금 (최상)',
                color: PERFORMANCE_CHART_COLORS.benchmarkAverage,
                zIndex: 20,
                tooltipOrder: 2,
                data: showAfterTax
                  ? dashboardData.charts.benchmarkBestNet
                  : dashboardData.charts.benchmarkBest,
              },
              {
                id: showAfterTax ? 'benchmarkWorstNet' : 'benchmarkWorst',
                name: showAfterTax
                  ? '벤치마크 세후 평가금 (최악)'
                  : '벤치마크 평가금 (최악)',
                color: PERFORMANCE_CHART_COLORS.benchmarkAverage,
                zIndex: 20,
                tooltipOrder: 3,
                data: showAfterTax
                  ? dashboardData.charts.benchmarkWorstNet
                  : dashboardData.charts.benchmarkWorst,
              },
            ]}
          />
        </div>
        <div className='h-full'>
          <AssetChart
            title='수익금 비교'
            themeColor={themeColor}
            chartType='line'
            calendarCategory='performance'
            fillBetween={
              showAfterTax
                ? ['benchmarkWorstNetProfit', 'benchmarkBestNetProfit']
                : ['benchmarkWorstProfit', 'benchmarkBestProfit']
            }
            seriesToggleGroups={[
              {
                id: 'benchmarkProfitRange',
                name: showAfterTax ? '벤치마크 세후 수익금' : '벤치마크 수익금',
                color: PERFORMANCE_CHART_COLORS.benchmarkAverage,
                showActiveBackground: false,
                seriesIds: showAfterTax
                  ? ['benchmarkBestNetProfit', 'benchmarkWorstNetProfit']
                  : ['benchmarkBestProfit', 'benchmarkWorstProfit'],
              },
            ]}
            series={[
              {
                id: 'profit',
                name: showAfterTax ? '세후 수익금' : '수익금',
                color: PERFORMANCE_CHART_COLORS.primary,
                data: showAfterTax
                  ? dashboardData.charts.netProfit
                  : dashboardData.charts.profit,
              },
              {
                id: showAfterTax ? 'benchmarkBestNetProfit' : 'benchmarkBestProfit',
                name: showAfterTax
                  ? '벤치마크 세후 수익금 (최상)'
                  : '벤치마크 수익금 (최상)',
                color: PERFORMANCE_CHART_COLORS.benchmarkAverage,
                data: showAfterTax
                  ? dashboardData.charts.benchmarkBestNetProfit
                  : dashboardData.charts.benchmarkBestProfit,
              },
              {
                id: showAfterTax
                  ? 'benchmarkWorstNetProfit'
                  : 'benchmarkWorstProfit',
                name: showAfterTax
                  ? '벤치마크 세후 수익금 (최악)'
                  : '벤치마크 수익금 (최악)',
                color: PERFORMANCE_CHART_COLORS.benchmarkAverage,
                data: showAfterTax
                  ? dashboardData.charts.benchmarkWorstNetProfit
                  : dashboardData.charts.benchmarkWorstProfit,
              },
            ]}
          />
        </div>
        <div
          className={cn(
            'mt-8',
            detailChartLayout === 'compact' ? 'lg:col-span-2' : undefined,
          )}
        >
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-xl font-bold'>수익률 차트</h2>
            {renderChartLayoutButton(returnChartLayout, setReturnChartLayout)}
          </div>
          <div
            className={cn(
              'grid gap-4',
              returnChartLayout === 'compact' ? 'lg:grid-cols-2' : 'grid-cols-1',
            )}
          >
            <AssetChart
              title={`누적수익률 비교 ${showAfterTax ? '(세후)' : ''}`}
              themeColor={themeColor}
              chartType='line'
              calendarCategory='performance'
              fillBetween={['benchmarkWorstReturnRate', 'benchmarkBestReturnRate']}
              seriesToggleGroups={[
                {
                  id: 'benchmarkRange',
                  name: showAfterTax ? '벤치마크 순수익률' : '벤치마크 수익률',
                  color: PERFORMANCE_CHART_COLORS.benchmarkAverage,
                  showActiveBackground: false,
                  seriesIds: [
                    'benchmarkBestReturnRate',
                    'benchmarkWorstReturnRate',
                  ],
                },
              ]}
              showLogScaleToggle={false}
              showInflationAdjustToggle={false}
              series={[
                {
                  id: 'returnRate',
                  name: showAfterTax ? '순누적수익률' : '누적수익률',
                  color: PERFORMANCE_CHART_COLORS.cumulativeReturn,
                  data: showAfterTax
                    ? dashboardData.charts.netReturnRate
                    : dashboardData.charts.returnRate,
                  unit: 'percent',
                },
                {
                  id: 'benchmarkBestReturnRate',
                  name: showAfterTax
                    ? '벤치마크 순수익률 (최상)'
                    : '벤치마크 수익률 (최상)',
                  color: PERFORMANCE_CHART_COLORS.benchmarkAverage,
                  data: showAfterTax
                    ? dashboardData.charts.benchmarkBestNetReturnRate
                    : dashboardData.charts.benchmarkBestReturnRate,
                  unit: 'percent',
                },
                {
                  id: 'benchmarkWorstReturnRate',
                  name: showAfterTax
                    ? '벤치마크 순수익률 (최악)'
                    : '벤치마크 수익률 (최악)',
                  color: PERFORMANCE_CHART_COLORS.benchmarkAverage,
                  data: showAfterTax
                    ? dashboardData.charts.benchmarkWorstNetReturnRate
                    : dashboardData.charts.benchmarkWorstReturnRate,
                  unit: 'percent',
                },
              ]}
            />
            <AssetChart
              title={`연환산 수익률 분석 ${showAfterTax ? '(세후)' : ''}`}
              themeColor={themeColor}
              chartType='line'
              calendarCategory='performance'
              showLogScaleToggle={false}
              showInflationAdjustToggle={false}
              series={[
                {
                  id: 'mwr',
                  name: showAfterTax ? '순MWR' : 'MWR',
                  color: PERFORMANCE_CHART_COLORS.primary,
                  data: showAfterTax
                    ? dashboardData.charts.netMwr
                    : dashboardData.charts.mwr,
                  unit: 'percent',
                },
                {
                  id: 'twr',
                  name: showAfterTax ? '순TWR' : 'TWR',
                  color: PERFORMANCE_CHART_COLORS.secondary,
                  data: showAfterTax
                    ? dashboardData.charts.netTwr
                    : dashboardData.charts.twr,
                  unit: 'percent',
                },
                {
                  id: 'cagr',
                  name: showAfterTax ? '순CAGR' : 'CAGR',
                  color: PERFORMANCE_CHART_COLORS.tertiary,
                  data: showAfterTax
                    ? dashboardData.charts.netCagr
                    : dashboardData.charts.cagr,
                  unit: 'percent',
                },
                {
                  id: 'averageAnnualReturn',
                  name: showAfterTax ? '순단순연평균' : '단순연평균',
                  color: PERFORMANCE_CHART_COLORS.averageAnnualReturn,
                  data: showAfterTax
                    ? dashboardData.charts.netAverageAnnualReturn
                    : dashboardData.charts.averageAnnualReturn,
                  unit: 'percent',
                },
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
