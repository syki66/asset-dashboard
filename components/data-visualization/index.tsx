'use client';

import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardControls } from './dashboard-controls';
import { DashboardSummary } from './dashboard-summary';
import { DashboardDetail } from './dashboard-detail';
import { Disclaimer } from './disclaimer';
import type { DateRange } from 'react-day-picker';

export default function DataVisualization() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currency, setCurrency] = useState<'KRW' | 'USD'>('KRW');

  return (
    <>
      {/* <MainChart
        chartData={chartData}
        chartConfig={{
          evaluationAmount: {
            label: '평가금액',
            color: 'hsl(var(--chart-1))',
          },
          principalAmount: {
            label: '원금',
            color: 'hsl(var(--chart-2))',
          },
        }}
      /> */}
      {/* <AccountInfo accountData={mergedAccountData} /> */}

      <>
        <div className="container mx-auto py-8 px-4 relative">
          <h1 className="text-3xl font-bold mb-8">자산 대시보드</h1>

          <DashboardControls
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            currency={currency}
            onCurrencyChange={setCurrency}
          />

          <div className="grid gap-8 dashboard-content">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full max-w-md grid grid-cols-2 mb-6">
                <TabsTrigger value="summary">요약</TabsTrigger>
                <TabsTrigger value="detail">상세</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <DashboardSummary dateRange={dateRange} currency={currency} />
              </TabsContent>

              <TabsContent value="detail">
                <DashboardDetail dateRange={dateRange} currency={currency} />
              </TabsContent>
            </Tabs>

            <Disclaimer />
          </div>
        </div>
      </>
    </>
  );
}
