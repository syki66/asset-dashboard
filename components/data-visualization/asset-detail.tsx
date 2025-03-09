'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AssetDetailProps {
  currency: 'KRW' | 'USD';
}

export function AssetDetail({ currency }: AssetDetailProps) {
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
    <Card>
      <CardHeader>
        <CardTitle>자산 상세 내역</CardTitle>
        <CardDescription>자산의 상세 내역을 확인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">원금:</span>
            <span>{formatCurrency(assetData.principal)}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">평가금:</span>
            <span>{formatCurrency(assetData.currentValue)}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">수익금:</span>
            <span
              className={
                assetData.profit >= 0 ? 'text-red-600' : 'text-blue-600'
              }
            >
              {formatCurrency(assetData.profit)}
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">수익률:</span>
            <span
              className={
                assetData.returnRate >= 0 ? 'text-red-600' : 'text-blue-600'
              }
            >
              {assetData.returnRate}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">배당금:</span>
            <span className="text-red-600">
              {formatCurrency(assetData.dividends)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
