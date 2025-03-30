'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Currency, DashboardProps } from '@/types';
import { formatDateKr } from '@/utils/format';

// 함수 선언부 업데이트
interface AssetOverviewProps {
  currency: Currency;
  data: DashboardProps;
}

export function AssetOverview({ currency, data }: AssetOverviewProps) {
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
          description={`지표 대비 초과수익 (세후): 000,000,000원`}
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
