'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { Currency } from '@/types';

// 배당금 데이터 (샘플) - 월별, 분기별, 연도별 데이터 추가
const dividendData = {
  monthly: [
    { period: '2023-01', dividend: 0 },
    { period: '2023-02', dividend: 120000 },
    { period: '2023-03', dividend: 0 },
    { period: '2023-04', dividend: 180000 },
    { period: '2023-05', dividend: 0 },
    { period: '2023-06', dividend: 0 },
    { period: '2023-07', dividend: 250000 },
    { period: '2023-08', dividend: 0 },
    { period: '2023-09', dividend: 0 },
    { period: '2023-10', dividend: 350000 },
    { period: '2023-11', dividend: 0 },
    { period: '2023-12', dividend: 300000 },
  ],
  quarterly: [
    { period: '2023-Q1', dividend: 120000 },
    { period: '2023-Q2', dividend: 180000 },
    { period: '2023-Q3', dividend: 250000 },
    { period: '2023-Q4', dividend: 650000 },
  ],
  yearly: [
    { period: '2019', dividend: 450000 },
    { period: '2020', dividend: 580000 },
    { period: '2021', dividend: 720000 },
    { period: '2022', dividend: 950000 },
    { period: '2023', dividend: 1200000 },
  ],
};

interface DividendChartProps {
  dateRange: DateRange | undefined;
  currency: Currency;
  className?: string;
}

export function DividendChart({
  dateRange,
  currency,
  className,
}: DividendChartProps) {
  const [dividendTimeRange, setDividendTimeRange] =
    useState<keyof typeof dividendData>('monthly');

  const formatCurrency = (value: number) => {
    if (currency === 'usd') {
      // KRW에서 USD로 변환 (1350 KRW = 1 USD 가정)
      const usdValue = value / 1350;
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
      }).format(value);
    }
  };

  const chartConfig = {
    dividend: {
      label: '배당금',
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>배당금 내역</CardTitle>
          <CardDescription>
            {dividendTimeRange === 'monthly'
              ? '월별'
              : dividendTimeRange === 'quarterly'
              ? '분기별'
              : '연도별'}{' '}
            배당금 수령 내역
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-red-600">
            총 배당금:{' '}
            {formatCurrency(
              dividendData[dividendTimeRange].reduce(
                (sum, item) => sum + item.dividend,
                0
              )
            )}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs
          value={dividendTimeRange}
          onValueChange={(v) =>
            setDividendTimeRange(v as keyof typeof dividendData)
          }
          className="mb-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">월별</TabsTrigger>
            <TabsTrigger value="quarterly">분기별</TabsTrigger>
            <TabsTrigger value="yearly">연도별</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="h-[350px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={dividendData[dividendTimeRange]}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              width={1000}
              height={350}
            >
              <XAxis
                dataKey="period"
                tickFormatter={(period) => {
                  if (dividendTimeRange === 'monthly') {
                    const date = new Date(period);
                    return `${date.getMonth() + 1}월`;
                  } else if (dividendTimeRange === 'quarterly') {
                    return period.replace('Q', '분기');
                  } else {
                    return period;
                  }
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => {
                  if (currency === 'usd') {
                    return `$${(value / 1350 / 1000).toFixed(0)}K`;
                  }
                  return `${(value / 10000).toFixed(0)}만`;
                }}
                axisLine={false}
                tickLine={false}
              />
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <Bar
                dataKey="dividend"
                fill="var(--color-dividend)"
                radius={[4, 4, 0, 0]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex min-w-[100px] items-center text-xs text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label ||
                          name}
                        <div className="ml-auto font-medium tabular-nums text-foreground">
                          {formatCurrency(value as number)}
                        </div>
                      </div>
                    )}
                  />
                }
              />
            </BarChart>
          </ChartContainer>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>
              {dividendTimeRange === 'monthly'
                ? '연간'
                : dividendTimeRange === 'quarterly'
                ? '연간'
                : '5년간'}{' '}
              총 배당금:
            </span>
            <span className="font-medium text-red-600">
              {formatCurrency(
                dividendData[dividendTimeRange].reduce(
                  (sum, item) => sum + item.dividend,
                  0
                )
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>
              평균{' '}
              {dividendTimeRange === 'monthly'
                ? '월'
                : dividendTimeRange === 'quarterly'
                ? '분기'
                : '연간'}{' '}
              배당금:
            </span>
            <span className="font-medium">
              {formatCurrency(
                dividendData[dividendTimeRange].reduce(
                  (sum, item) => sum + item.dividend,
                  0
                ) / dividendData[dividendTimeRange].length
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
