'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 함수 선언부 업데이트
interface AssetOverviewProps {
  currency: 'KRW' | 'USD';
}

export function AssetOverview({ currency }: AssetOverviewProps) {
  // 실제 구현에서는 API나 상태 관리 라이브러리에서 데이터를 가져올 수 있습니다
  const assetData = {
    principal: 50000000,
    currentValue: 57500000,
    profit: 7500000,
    returnRate: 15,
    dividends: 1200000,
  };

  // formatCurrency 함수 수정
  function formatCurrency(amount: number): string {
    if (currency === 'USD') {
      // KRW에서 USD로 변환 (1350 KRW = 1 USD 가정)
      const usdValue = amount / 1350;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(usdValue);
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
          title="총 자산"
          value={formatCurrency(assetData.currentValue)}
          description="현재 평가 금액"
        />
        <AssetCard
          title="수익금"
          value={formatCurrency(assetData.profit)}
          description={`수익률: ${assetData.returnRate}%`}
          valueClassName={
            assetData.profit >= 0 ? 'text-red-600' : 'text-blue-600'
          }
        />
        <AssetCard
          title="원금"
          value={formatCurrency(assetData.principal)}
          description="총 투자 금액"
        />
        <AssetCard
          title="배당금"
          value={formatCurrency(assetData.dividends)}
          description="올해 받은 배당금"
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
