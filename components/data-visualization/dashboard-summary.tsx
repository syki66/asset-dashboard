'use client';

import type { DateRange } from 'react-day-picker';
import { AssetOverview } from '@/components/data-visualization/asset-overview';
import { AssetCharts } from '@/components/data-visualization/asset-charts';
import { DividendChart } from '@/components/data-visualization/dividend-chart';
import { StockHoldingsSummary } from '@/components/data-visualization/stock-holdings-summary';
import { Currency, DisplayDataProps } from '@/types';

interface DashboardSummaryProps {
  dateRange: DateRange | undefined;
  currency: Currency;
  displayData: DisplayDataProps;
}

export function DashboardSummary({
  dateRange,
  currency,
  displayData,
}: DashboardSummaryProps) {
  return (
    <div className="grid gap-8">
      <AssetOverview currency={currency} displayData={displayData} />

      <div className="grid gap-6 md:grid-cols-2">
        <AssetCharts dateRange={dateRange} currency={currency} view="summary" />
        <DividendChart dateRange={dateRange} currency={currency} />
      </div>

      <StockHoldingsSummary currency={currency} />
    </div>
  );
}
