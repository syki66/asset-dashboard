'use client';

import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardControls } from './dashboard-controls';
import { DashboardSummary } from './dashboard-summary';
import { DashboardDetail } from './dashboard-detail';
import { Disclaimer } from './disclaimer';
import type { DateRange } from 'react-day-picker';
import { Currency, DashboardProps } from '@/types';
import { DEFAULT_FX_RATE } from '@/constants/keywords';

const defaultDashboardData: DashboardProps = {
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
  maxDrawdownPeriod: '1970-01-01 > 1970-01-01',
  maxDailyDrawdown: 0,
  maxDailyDrawdownDate: '1970-01-01',
};

export default function DataVisualization() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currency, setCurrency] = useState<Currency>('krw');
  const [selectedDashboardData, setSelectedDashboardData] =
    useState<DashboardProps>(defaultDashboardData);

  const handleDashboardDataChange = (dashboardData: DashboardProps[]) => {
    setSelectedDashboardData(dashboardData.at(-1) || defaultDashboardData); // 선택된 날짜에 맞는 데이터 넣으면 됨
  };

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
            onDashboardDataChange={handleDashboardDataChange}
          />

          <div className="grid gap-8 dashboard-content">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full max-w-md grid grid-cols-2 mb-6">
                <TabsTrigger value="summary">요약</TabsTrigger>
                <TabsTrigger value="detail">상세</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <DashboardSummary
                  dateRange={dateRange}
                  currency={currency}
                  data={selectedDashboardData}
                />
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
