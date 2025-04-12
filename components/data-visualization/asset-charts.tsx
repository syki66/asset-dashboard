'use client';

import { useState, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { useCurrencyStore } from '@/store/account';

// 다양한 기간별 자산 변화 데이터 (샘플)
const assetHistoryData = {
  '1m': [
    { date: '2023-12-01', assets: 56800000 },
    { date: '2023-12-08', assets: 57100000 },
    { date: '2023-12-15', assets: 56900000 },
    { date: '2023-12-22', assets: 57300000 },
    { date: '2023-12-29', assets: 57500000 },
  ],
  '3m': [
    { date: '2023-10-01', assets: 54500000 },
    { date: '2023-10-15', assets: 55300000 },
    { date: '2023-11-01', assets: 56100000 },
    { date: '2023-11-15', assets: 56400000 },
    { date: '2023-12-01', assets: 56800000 },
    { date: '2023-12-15', assets: 56900000 },
    { date: '2023-12-29', assets: 57500000 },
  ],
  '6m': [
    { date: '2023-07-01', assets: 50500000 },
    { date: '2023-08-01', assets: 51700000 },
    { date: '2023-09-01', assets: 53200000 },
    { date: '2023-10-01', assets: 54500000 },
    { date: '2023-11-01', assets: 56100000 },
    { date: '2023-12-01', assets: 56800000 },
    { date: '2023-12-29', assets: 57500000 },
  ],
  '1y': [
    { date: '2023-01-01', assets: 45000000 },
    { date: '2023-02-01', assets: 46200000 },
    { date: '2023-03-01', assets: 47500000 },
    { date: '2023-04-01', assets: 48100000 },
    { date: '2023-05-01', assets: 47800000 },
    { date: '2023-06-01', assets: 49200000 },
    { date: '2023-07-01', assets: 50500000 },
    { date: '2023-08-01', assets: 51700000 },
    { date: '2023-09-01', assets: 53200000 },
    { date: '2023-10-01', assets: 54500000 },
    { date: '2023-11-01', assets: 56100000 },
    { date: '2023-12-01', assets: 56800000 },
    { date: '2023-12-29', assets: 57500000 },
  ],
  ytd: [
    { date: '2023-01-01', assets: 45000000 },
    { date: '2023-02-01', assets: 46200000 },
    { date: '2023-03-01', assets: 47500000 },
    { date: '2023-04-01', assets: 48100000 },
    { date: '2023-05-01', assets: 47800000 },
    { date: '2023-06-01', assets: 49200000 },
    { date: '2023-07-01', assets: 50500000 },
    { date: '2023-08-01', assets: 51700000 },
    { date: '2023-09-01', assets: 53200000 },
    { date: '2023-10-01', assets: 54500000 },
    { date: '2023-11-01', assets: 56100000 },
    { date: '2023-12-01', assets: 56800000 },
    { date: '2023-12-29', assets: 57500000 },
  ],
  '3y': [
    { date: '2021-01-01', assets: 30000000 },
    { date: '2021-07-01', assets: 33500000 },
    { date: '2022-01-01', assets: 38000000 },
    { date: '2022-07-01', assets: 42500000 },
    { date: '2023-01-01', assets: 45000000 },
    { date: '2023-07-01', assets: 50500000 },
    { date: '2023-12-29', assets: 57500000 },
  ],
  '5y': [
    { date: '2019-01-01', assets: 20000000 },
    { date: '2020-01-01', assets: 25000000 },
    { date: '2021-01-01', assets: 30000000 },
    { date: '2022-01-01', assets: 38000000 },
    { date: '2023-01-01', assets: 45000000 },
    { date: '2023-12-29', assets: 57500000 },
  ],
  '10y': [
    { date: '2014-01-01', assets: 5000000 },
    { date: '2015-01-01', assets: 8000000 },
    { date: '2016-01-01', assets: 12000000 },
    { date: '2017-01-01', assets: 15000000 },
    { date: '2018-01-01', assets: 18000000 },
    { date: '2019-01-01', assets: 20000000 },
    { date: '2020-01-01', assets: 25000000 },
    { date: '2021-01-01', assets: 30000000 },
    { date: '2022-01-01', assets: 38000000 },
    { date: '2023-01-01', assets: 45000000 },
    { date: '2023-12-29', assets: 57500000 },
  ],
  total: [
    { date: '2010-01-01', assets: 1000000 },
    { date: '2012-01-01', assets: 2500000 },
    { date: '2014-01-01', assets: 5000000 },
    { date: '2016-01-01', assets: 12000000 },
    { date: '2018-01-01', assets: 18000000 },
    { date: '2020-01-01', assets: 25000000 },
    { date: '2022-01-01', assets: 38000000 },
    { date: '2023-12-29', assets: 57500000 },
  ],
};

// 모든 데이터를 하나의 배열로 합치기 (날짜 중복 제거)
const allAssetData = Object.values(assetHistoryData)
  .flat()
  .reduce((acc, curr) => {
    if (!acc.some((item) => item.date === curr.date)) {
      acc.push(curr);
    }
    return acc;
  }, [] as { date: string; assets: number }[])
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

interface AssetChartsProps {
  dateRange: DateRange | undefined;
  view: 'summary' | 'detail';
  className?: string;
}

export function AssetCharts({ dateRange, view, className }: AssetChartsProps) {
  const currency = useCurrencyStore((state) => state.currency);

  const [timeRange, setTimeRange] =
    useState<keyof typeof assetHistoryData>('1y');
  const [customData, setCustomData] = useState<
    (typeof assetHistoryData)['custom']
  >([]);

  // 날짜 범위가 변경될 때 커스텀 데이터 업데이트
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const filteredData = allAssetData.filter((item) => {
        const itemDate = parseISO(item.date);
        return isWithinInterval(itemDate, {
          start: dateRange.from!,
          end: dateRange.to!,
        });
      });

      setCustomData(filteredData);
      setTimeRange('custom');
    } else if (timeRange === 'custom') {
      // 날짜 범위가 초기화되면 기본 기간으로 돌아감
      setTimeRange('1y');
    }
  }, [dateRange]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    // 기간에 따라 다른 형식으로 날짜 표시
    if (timeRange === '1m' || timeRange === '3m' || timeRange === 'custom') {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } else if (
      timeRange === '6m' ||
      timeRange === '1y' ||
      timeRange === 'ytd'
    ) {
      return `${date.getMonth() + 1}월`;
    } else {
      return `${date.getFullYear()}`;
    }
  };

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
    assets: {
      label: '자산',
      color: 'hsl(var(--chart-1))',
    },
  };

  // 현재 표시할 데이터 결정
  const currentData =
    timeRange === 'custom' ? customData : assetHistoryData[timeRange];

  // 데이터가 있는 경우에만 계산
  const initialValue = currentData.length > 0 ? currentData[0].assets : 0;
  const currentValue =
    currentData.length > 0 ? currentData[currentData.length - 1].assets : 0;
  const absoluteChange = currentValue - initialValue;
  const percentChange =
    initialValue > 0 ? (absoluteChange / initialValue) * 100 : 0;

  // 날짜 범위 문자열 생성
  const getDateRangeText = () => {
    if (timeRange === 'custom') {
      return '사용자 지정 기간';
    }

    return timeRange === 'total'
      ? '전체 기간'
      : timeRange === 'ytd'
      ? '올해'
      : timeRange === '1m'
      ? '1개월'
      : timeRange === '3m'
      ? '3개월'
      : timeRange === '6m'
      ? '6개월'
      : timeRange === '1y'
      ? '1년'
      : timeRange === '3y'
      ? '3년'
      : timeRange === '5y'
      ? '5년'
      : '10년';
  };

  // 차트 높이 설정 (상세 보기일 때 더 크게)
  const chartHeight = view === 'detail' ? 400 : 300;

  // 차트 너비 설정 (상세 보기일 때 더 넓게)
  const chartWidth = view === 'detail' ? '100%' : 'auto';

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>자산 변화 추이</CardTitle>
          <CardDescription>{getDateRangeText()} 자산 변화</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`text-sm font-medium ${
              absoluteChange >= 0 ? 'text-red-600' : 'text-blue-600'
            }`}
          >
            {absoluteChange >= 0 ? '+' : ''}
            {formatCurrency(absoluteChange)} ({percentChange.toFixed(2)}%)
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs
          value={timeRange}
          onValueChange={(v) => {
            if (v !== 'custom') {
              setTimeRange(v as keyof typeof assetHistoryData);
            }
          }}
        >
          <TabsList className="grid grid-cols-9 w-full">
            <TabsTrigger value="1m">1M</TabsTrigger>
            <TabsTrigger value="3m">3M</TabsTrigger>
            <TabsTrigger value="6m">6M</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
            <TabsTrigger value="ytd">YTD</TabsTrigger>
            <TabsTrigger value="3y">3Y</TabsTrigger>
            <TabsTrigger value="5y">5Y</TabsTrigger>
            <TabsTrigger value="10y">10Y</TabsTrigger>
            <TabsTrigger value="total">전체</TabsTrigger>
          </TabsList>
        </Tabs>

        <div
          className="h-[400px] mt-4"
          style={{ height: chartHeight, width: chartWidth }}
        >
          {currentData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart
                data={currentData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                width={view === 'detail' ? 1000 : 500}
                height={chartHeight}
              >
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value) => {
                    if (currency === 'usd') {
                      return `$${(value / 1350 / 10000).toFixed(1)}만`;
                    }
                    return `${(value / 10000000).toFixed(1)}천만`;
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <Line
                  type="monotone"
                  dataKey="assets"
                  stroke="var(--color-assets)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex min-w-[100px] items-center text-xs text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]
                            ?.label || name}
                          <div className="ml-auto font-medium tabular-nums text-foreground">
                            {formatCurrency(value as number)}
                          </div>
                        </div>
                      )}
                    />
                  }
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                선택한 기간에 데이터가 없습니다
              </p>
            </div>
          )}
        </div>

        {currentData.length > 0 && (
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <div className="text-muted-foreground">시작</div>
              <div className="font-medium">{formatCurrency(initialValue)}</div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground">현재</div>
              <div className="font-medium">{formatCurrency(currentValue)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
