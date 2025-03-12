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
  // 실제 구현에서는 API나 상태 관리 라이브러리에서 데이터를 가져올 수 있습니다
  const assetData = {
    dividends: 1200000,
  };

  // formatCurrency 함수 수정
  function formatCurrency(amount: number): string {
    if (currency === 'usd') {
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
          value={formatCurrency(data.profit)}
          description={`수익률: ${data.returnRate}%`}
          valueClassName={data.profit >= 0 ? 'text-red-600' : 'text-blue-600'}
        />
        <AssetCard
          title="배당금 (최근 1년)"
          value={formatCurrency(data.dividends)}
          description={`배당률: ${data.dividendYield}% (원금대비: ${data.yieldOnCost}%)`}
        />
        <AssetCard
          title="최대 손실 낙폭 (MDD)"
          value={formatCurrency(assetData.dividends)}
          description="하루 최대 손실 낙폭: ??"
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
}

function AssetCard({
  title,
  value,
  description,
  valueClassName = '',
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
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
