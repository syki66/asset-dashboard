'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_FX_RATE } from '@/constants/keywords';
import { useCurrencyStore, useDashboardStore } from '@/store/account';
import { DashboardProps } from '@/types';
import { formatDateKr } from '@/utils/format';
import AssetChart from './asset-charts';
import DividendChart from './dividend-chart';

const initialDashboardData: DashboardProps = {
  date: '1970-01-01',
  lastUpdated: '1970-01-01',
  fxRate: DEFAULT_FX_RATE,
  currentValue: 0,
  principal: 0,
  profit: 0,
  returnRate: 0,
  totalTaxFee: 0,
  dividends: 0,
  yieldOnCost: 0,
  dividendYield: 0,
  cash: 0,
  usdCash: 0,
  krwCash: 0,
  benchmarkValue: 0,
  maxDrawdown: 0,
  maxDrawdownPeriod: '1970-01-01 ~ 1970-01-01',
  maxDailyDrawdown: 0,
  maxDailyDrawdownDate: '1970-01-01',
  principalChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  currentValueChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  profitChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  drawdownChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  dividendHistoryChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  dividendYieldChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  yieldOnCostChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  benchmarkChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  benchmarkProfitChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
  profitAfterTaxChartData: [
    {
      date: '1970-01-01',
      value: 0,
    },
  ],
};

export function AssetOverview() {
  const dashboardData =
    useDashboardStore((state) => state.dashboardData) ?? initialDashboardData;
  const data = Object.keys(dashboardData).length
    ? dashboardData
    : initialDashboardData;
  const currency = useCurrencyStore((state) => state.currency);

  // formatCurrency 함수 수정
  function formatCurrency(
    amount: number,
    currencyOverride?: 'usd' | 'krw'
  ): string {
    const selectedCurrency = currencyOverride || currency;
    if (selectedCurrency === 'usd') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(amount);
    } else {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
      }).format(amount);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">자산 현황</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AssetCard
          title="날짜"
          value={formatDateKr(data.date)}
          description={`최근 업데이트: ${data.lastUpdated}`}
        />
        <AssetCard
          title="총 자산"
          value={formatCurrency(data.currentValue)}
          description={`원금: ${formatCurrency(data.principal)}`}
        />
        <AssetCard
          title="수익금"
          value={`${formatCurrency(data.profit)} (${data.returnRate}%)`}
          description={`지표 대비 초과수익 (세후): ${formatCurrency(
            data.profit -
              data.totalTaxFee -
              (data.benchmarkValue - data.principal)
          )}`}
          valueClassName={data.profit >= 0 ? 'text-red-600' : 'text-blue-600'}
        />
        <AssetCard
          title="배당금 (최근 1년)"
          value={formatCurrency(data.dividends)}
          description={`배당률: ${data.dividendYield}% (원금대비: ${data.yieldOnCost}%)`}
          valueClassName={'text-yellow-600'}
        />
        <AssetCard
          title="환율"
          value={data.fxRate.toLocaleString()}
          description="USD/KRW"
        />
        <AssetCard
          title={`최대 손실 낙폭 (${data.maxDrawdownPeriod})`}
          value={formatCurrency(data.maxDrawdown)}
          description={`하루 최대 낙폭: ${formatCurrency(
            data.maxDailyDrawdown
          )} (${data.maxDailyDrawdownDate})`}
          valueClassName="text-blue-600"
          descClassName={'text-blue-600'}
        />
        <AssetCard
          title="세금 및 제비용"
          value={formatCurrency(data.totalTaxFee, 'krw')}
          description={`세후 수익금: ${formatCurrency(
            data.profit - data.totalTaxFee
          )}`}
          valueClassName="text-red-600"
        />
        <AssetCard
          title="현금"
          value={formatCurrency(data.cash)}
          description={`${formatCurrency(
            data.usdCash,
            'usd'
          )} + ${formatCurrency(data.krwCash, 'krw')}`}
          valueClassName="text-red-600"
        />
      </div>
      <div className="mt-8">
        <AssetChart
          series={[
            {
              id: 'principal',
              name: '원금',
              color: '#888888',
              data: data.principalChartData,
            },
            {
              id: 'currentValue',
              name: '평가금',
              color: '#F44336',
              data: data.currentValueChartData,
            },
            {
              id: 'profit',
              name: '수익금',
              color: '#4CAF50',
              data: data.profitChartData,
            },
            {
              id: 'benchmark',
              name: '예금',
              color: '#2196F3',
              data: data.benchmarkChartData,
            },
            {
              id: 'benchmarkProfit',
              name: '예금 수익금',
              color: '#FF9800',
              data: data.benchmarkProfitChartData,
            },
            {
              id: 'profitAfterTax',
              name: '세후 수익금',
              color: '#673AB7',
              data: data.profitAfterTaxChartData,
            },
          ]}
          title="자산 포트폴리오 차트"
          description="자산 클래스별 포트폴리오 변화 추이"
        />
      </div>
      <div className="mt-8">
        <AssetChart
          series={[
            {
              id: 'drawdown',
              name: '손실 낙폭',
              color: '#F44336',
              data: data.drawdownChartData,
            },
          ]}
          title="최대 손실 낙폭 차트"
          description="자산 클래스별 최대 손실 낙폭 변화 추이"
          reverseYAxis={true}
        />
      </div>
      <div className="mt-8">
        <AssetChart
          series={[
            {
              id: 'cash',
              name: '현금',
              color: '#F44336',
              data: data.currentValueChartData,
            },
          ]}
          title="현금 포트폴리오 차트"
          description="자산 클래스별 포트폴리오 변화 추이"
        />
      </div>
      <div className="mt-8">
        <DividendChart dividendData={data.dividendHistoryChartData} />
      </div>
      <div className="mt-8">
        <AssetChart
          series={[
            {
              id: 'YoC',
              name: '원금대비배당률',
              color: '#F44336',
              data: data.yieldOnCostChartData,
            },
          ]}
          title="원금대비배당률 차트"
          description="자산 클래스별 원금대비배당률 변화 추이"
        />
      </div>
      <div className="mt-8">
        <AssetChart
          series={[
            {
              id: 'dividendYield',
              name: '배당률',
              color: '#F44336',
              data: data.dividendYieldChartData,
            },
          ]}
          title="배당률 차트"
          description="자산 클래스별 배당률 변화 추이"
        />
      </div>
    </div>
  );
}

interface AssetCardProps {
  title: string;
  value: string;
  description: string;
  valueClassName?: string;
  descClassName?: string;
}

function AssetCard({
  title,
  value,
  description,
  valueClassName = '',
  descClassName = '',
}: AssetCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
        <p className={`text-xs text-muted-foreground mt-1 ${descClassName}`}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
