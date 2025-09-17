'use client';

import DashboardCard from '@/components/ui/dashboard-card';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';
import { formatCurrency } from '@/utils/format';

export default function Page() {
  const dashboardData = useDashboardStore((state) => state.dashboardData);
  const currency = useCurrencyStore((state) => state.currency);
  return (
    <>
      <DashboardCard
        title="세금 및 제비용"
        value={formatCurrency(dashboardData.totalTaxFee, 'krw')}
        description={`세후 수익금: ${formatCurrency(
          dashboardData.profit - dashboardData.totalTaxFee,
          currency
        )}`}
        valueClassName="text-red-600"
      />
    </>
  );
}
