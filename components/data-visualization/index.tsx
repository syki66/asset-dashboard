'use client';

import { useEffect, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardControls } from './dashboard-controls';
import { DashboardSummary } from './dashboard-summary';
import { DashboardDetail } from './dashboard-detail';
import { Disclaimer } from './disclaimer';
import type { DateRange } from 'react-day-picker';
import { AccountProps, Currency, DisplayDataProps } from '@/types';

export default function DataVisualization() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currency, setCurrency] = useState<Currency>('krw');
  const [displayData, setDisplayData] = useState<DisplayDataProps>({
    currentValue: 0,
    principal: 0,
    profit: 0,
    returnRate: 0,
    dividends: 0,
    yieldOnCost: 0,
    dividendYield: 0,
  });

  const handleAccountDataChange = (
    newAccountData: AccountProps[],
    currency: Currency
  ) => {
    // 화면 표시용 데이터 가공하기
    const data = newAccountData.at(-1); // 날짜가 바뀌면 해당 날짜 1개의 원소만 가져오면 됨

    if (!data) {
      return;
    }

    // USD 주식 총 금액 계산
    const usdStockValue = data.usd.stocks.reduce(
      (acc, stock) => acc + stock.price * stock.balance.length,
      0
    );

    // KRW 주식 총 금액 계산
    const krwStockValue = data.krw.stocks.reduce(
      (acc, stock) => acc + stock.price * stock.balance.length,
      0
    );

    // 주식 평가금액 총합
    const stockValue =
      currency === 'usd'
        ? usdStockValue + krwStockValue / data.fxRate
        : usdStockValue * data.fxRate + krwStockValue;

    // 평가 금액
    const currentValue =
      currency === 'usd'
        ? stockValue + data.usd.cash + data.krw.cash / data.fxRate
        : stockValue + data.krw.cash + data.usd.cash * data.fxRate;

    // 원금
    const principal =
      currency === 'usd' ? data.usd.principalAmount : data.krw.principalAmount;

    // 수익금
    const profit = currentValue - principal;

    // 수익률
    const returnRate = Number(((profit / principal) * 100).toFixed(2));

    // 배당금 (최근 1년간)
    const oneYearAgo = new Date(data.date);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const dividendsKrw = data.krw.dividends
      .filter((dividend) => {
        const dividendDate = new Date(dividend.date);
        return dividendDate >= oneYearAgo;
      })
      .reduce(
        (acc, dividend) =>
          currency === 'usd'
            ? acc + dividend.price / dividend.fxRate
            : acc + dividend.price,
        0
      );

    const dividendsUsd = data.usd.dividends
      .filter((dividend) => {
        const dividendDate = new Date(dividend.date);
        return dividendDate >= oneYearAgo;
      })
      .reduce(
        (acc, dividend) =>
      currency === 'usd'
            ? acc + dividend.price
            : acc + dividend.price * dividend.fxRate,
        0
      );

    const dividends = dividendsUsd + dividendsKrw; // 위에서 이미 환전처리 되어있음

    // 원금대비배당률
    const yieldOnCost = Number(((dividends / principal) * 100).toFixed(2));

    // 평가금대비배당률
    const dividendYield = Number(((dividends / currentValue) * 100).toFixed(2));

    setDisplayData({
      currentValue,
      principal,
      profit,
      returnRate,
      dividends,
      yieldOnCost,
      dividendYield,
    });
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
            onAccountDataChange={handleAccountDataChange}
          />

          {displayData && (
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
                    displayData={displayData}
                  />
                </TabsContent>

                <TabsContent value="detail">
                  <DashboardDetail dateRange={dateRange} currency={currency} />
                </TabsContent>
              </Tabs>

              <Disclaimer />
            </div>
          )}
        </div>
      </>
    </>
  );
}
