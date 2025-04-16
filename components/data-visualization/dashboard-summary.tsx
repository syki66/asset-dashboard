'use client';

import type { DateRange } from 'react-day-picker';
import { AssetOverview } from '@/components/data-visualization/asset-overview';

import { StockHoldingsSummary } from '@/components/data-visualization/stock-holdings-summary';
import { Currency, DashboardProps } from '@/types';
import AssetChart from './asset-charts';
import DividendChart from './dividend-chart';

interface DashboardSummaryProps {
  dateRange: DateRange | undefined;
}

export function DashboardSummary({ dateRange }: DashboardSummaryProps) {
  return (
    <div className="grid gap-8">
      <AssetOverview />

      <div className="grid gap-6">
        <DividendChart />
      </div>

      <StockHoldingsSummary />
    </div>
  );
}
