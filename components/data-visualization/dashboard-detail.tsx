'use client';

import type { DateRange } from 'react-day-picker';
import { AssetCharts } from '@/components/data-visualization/asset-charts';
import { DividendChart } from '@/components/data-visualization/dividend-chart';
import { StockHoldings } from '@/components/data-visualization/stock-holdings';
import { StockCharts } from '@/components/data-visualization/stock-charts';
import { AssetDetail } from '@/components/data-visualization/asset-detail';

interface DashboardDetailProps {
  dateRange: DateRange | undefined;
  currency: 'KRW' | 'USD';
}

export function DashboardDetail({ dateRange, currency }: DashboardDetailProps) {
  return (
    <div className="grid gap-8">
      <div className="grid gap-6 md:grid-cols-2">
        <AssetDetail currency={currency} />
      </div>
      <AssetCharts
        dateRange={dateRange}
        currency={currency}
        view="detail"
        className="w-full"
      />
      <DividendChart
        dateRange={dateRange}
        currency={currency}
        className="w-full"
      />
      <StockHoldings currency={currency} />
      <StockCharts currency={currency} />
    </div>
  );
}
