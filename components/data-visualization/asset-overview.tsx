'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrencyStore, useDetailToggleStore } from '@/store/account';
import { formatDateKr } from '@/utils/format';
import {
  AssetChart,
  DividendChart,
  StockPurchaseChart,
} from '@/components/chart';
import { useDashboardStore } from '@/store/dashboard';

export function AssetOverview() {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);
  const showDetail = useDetailToggleStore((state) => state.showDetail);

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
          value={formatDateKr(dashboardData.date)}
          description={`최근 업데이트: ${dashboardData.lastUpdated}`}
        />
        <AssetCard
          title="총 자산"
          value={formatCurrency(dashboardData.currentValue)}
          description={`원금: ${formatCurrency(dashboardData.principal)}`}
        />
        <AssetCard
          title="수익금"
          value={`${formatCurrency(dashboardData.profit)} (${
            dashboardData.returnRate
          }%)`}
          description={`지표 대비 초과수익 (세후): ${formatCurrency(
            dashboardData.profit -
              dashboardData.totalTaxFee -
              (dashboardData.benchmarkValue - dashboardData.principal)
          )}`}
          valueClassName={
            dashboardData.profit >= 0 ? 'text-red-600' : 'text-blue-600'
          }
        />
        <AssetCard
          title="배당금 (최근 1년)"
          value={formatCurrency(dashboardData.dividends)}
          description={`배당률: ${dashboardData.dividendYield}% (원금대비: ${dashboardData.yieldOnCost}%)`}
          valueClassName={'text-yellow-600'}
        />
        {showDetail && (
          <>
            <AssetCard
              title="환율"
              value={dashboardData.fxRate.toLocaleString()}
              description="USD/KRW"
            />
            <AssetCard
              title={`최대 손실 낙폭 (${dashboardData.maxDrawdownPeriod})`}
              value={formatCurrency(dashboardData.maxDrawdown)}
              description={`하루 최대 낙폭: ${formatCurrency(
                dashboardData.maxDailyDrawdown
              )} (${dashboardData.maxDailyDrawdownDate})`}
              valueClassName="text-blue-600"
              descClassName={'text-blue-600'}
            />
            <AssetCard
              title="세금 및 제비용"
              value={formatCurrency(dashboardData.totalTaxFee, 'krw')}
              description={`세후 수익금: ${formatCurrency(
                dashboardData.profit - dashboardData.totalTaxFee
              )}`}
              valueClassName="text-red-600"
            />
            <AssetCard
              title="현금"
              value={formatCurrency(dashboardData.cash)}
              description={`${formatCurrency(
                dashboardData.usdCash,
                'usd'
              )} + ${formatCurrency(dashboardData.krwCash, 'krw')}`}
              valueClassName="text-red-600"
            />
          </>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="mt-8">
          <AssetChart
            series={[
              {
                id: 'principal',
                name: '원금',
                color: '#888888',
                data: dashboardData.principalChartData,
              },
              {
                id: 'currentValue',
                name: '평가금',
                color: '#F44336',
                data: dashboardData.currentValueChartData,
              },
              {
                id: 'profit',
                name: '수익금',
                color: '#4CAF50',
                data: dashboardData.profitChartData,
              },
              {
                id: 'benchmark',
                name: '예금',
                color: '#2196F3',
                data: dashboardData.benchmarkChartData,
              },
              {
                id: 'benchmarkProfit',
                name: '예금 수익금',
                color: '#FF9800',
                data: dashboardData.benchmarkProfitChartData,
              },
              {
                id: 'profitAfterTax',
                name: '세후 수익금',
                color: '#673AB7',
                data: dashboardData.profitAfterTaxChartData,
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
                data: dashboardData.drawdownChartData,
              },
            ]}
            title="최대 손실 낙폭 차트"
            description="자산 클래스별 최대 손실 낙폭 변화 추이"
            reverseYAxis={true}
          />
        </div>
      </div>
      <div className="mt-8">
        <AssetChart
          series={[
            {
              id: 'cash',
              name: '현금',
              color: '#F44336',
              data: dashboardData.currentValueChartData,
            },
          ]}
          title="현금 포트폴리오 차트"
          description="자산 클래스별 포트폴리오 변화 추이"
        />
      </div>
      <div className="mt-8">
        <DividendChart data={dashboardData.dividendHistoryChartData} />
      </div>
      <div className="mt-8">
        <AssetChart
          series={[
            {
              id: 'YoC',
              name: '원금대비배당률',
              color: '#F44336',
              data: dashboardData.yieldOnCostChartData,
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
              data: dashboardData.dividendYieldChartData,
            },
          ]}
          title="배당률 차트"
          description="자산 클래스별 배당률 변화 추이"
        />
      </div>

      <div className="mt-8">
        <StockPurchaseChart
          data={[
            { date: '2024-01-15', AAPL: 10, GOOGL: 5, MSFT: 8, TSLA: 3 },
            { date: '2024-01-16', AAPL: 15, GOOGL: 7, MSFT: 12, NVDA: 6 },
            { date: '2024-01-17', AAPL: 8, GOOGL: 10, TSLA: 15, NVDA: 4 },
            { date: '2024-01-18', MSFT: 20, TSLA: 8, NVDA: 12, AMZN: 5 },
            { date: '2024-01-19', AAPL: 12, GOOGL: 8, MSFT: 6, AMZN: 10 },
            { date: '2024-01-22', AAPL: 18, TSLA: 12, NVDA: 8, AMZN: 7 },
            { date: '2024-01-23', GOOGL: 15, MSFT: 10, TSLA: 6, NVDA: 14 },
            { date: '2024-01-24', AAPL: 22, GOOGL: 12, AMZN: 15, NVDA: 9 },
            { date: '2024-01-25', MSFT: 16, TSLA: 20, AMZN: 8, NVDA: 11 },
            { date: '2024-01-26', AAPL: 14, GOOGL: 18, MSFT: 13, TSLA: 7 },
          ]}
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
