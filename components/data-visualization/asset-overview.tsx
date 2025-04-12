'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_FX_RATE } from '@/constants/keywords';
import { useCurrencyStore, useDashboardStore } from '@/store/account';
import { Currency, DashboardProps } from '@/types';
import { formatDateKr } from '@/utils/format';
import { useEffect, useState } from 'react';

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
  maxDrawdown: 0,
  maxDrawdownPeriod: '1970-01-01 ~ 1970-01-01',
  maxDailyDrawdown: 0,
  maxDailyDrawdownDate: '1970-01-01',
};

export function AssetOverview() {
  const totalDashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);

  const [dashboardData, setDashboardData] =
    useState<DashboardProps>(initialDashboardData);

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

  useEffect(() => {
    // 데이터가 존재하면 대시보드 데이터 업데이트
    if (totalDashboardData && totalDashboardData.length > 0) {
      setDashboardData(totalDashboardData.at(-1) as DashboardProps);
    }
  }, [totalDashboardData]);

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
          description={`지표 대비 초과수익 (세후): 000,000,000원`}
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
