'use client';

import { useState, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  format,
  subMonths,
  subYears,
  isAfter,
  parseISO,
  getYear,
  getMonth,
  getQuarter,
} from 'date-fns';
import { ko } from 'date-fns/locale';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer } from '@/components/ui/chart';

// Generate more frequent dummy dividend data spanning 10 years
const generateDummyData = () => {
  const data = [];
  const now = new Date();
  const startDate = subYears(now, 10);

  // Generate monthly dividends with some randomness
  const currentDate = new Date(startDate);
  while (isAfter(now, currentDate)) {
    // Add some randomness to make the data more realistic
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    // Monthly dividends with varying amounts
    const baseValue = Math.floor(Math.random() * 800) + 200;

    // Add some yearly trends - increasing over time
    const yearsSinceStart = year - startDate.getFullYear();
    const growthFactor = 1 + yearsSinceStart * 0.15;

    // Add seasonal variations
    const seasonalFactor = 1 + (month % 12) * 0.02;

    // Add some randomness for realistic data
    const randomFactor = 0.8 + Math.random() * 0.4;

    const value = Math.floor(
      baseValue * growthFactor * seasonalFactor * randomFactor
    );

    data.push({
      date: format(currentDate, 'yyyy-MM-dd'),
      value: value,
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Add the example data
  data.push({ date: '2024-03-22', value: 5800 });
  data.push({ date: '2024-04-11', value: 430 });

  // Sort by date
  return data.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

const dividendData = generateDummyData();

type TimeFilter =
  | '1m'
  | '3m'
  | '6m'
  | '9m'
  | '1y'
  | '2y'
  | '3y'
  | '5y'
  | '10y'
  | 'all';

export default function DividendChart() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1y');

  const filteredData = useMemo(() => {
    const now = new Date();
    let filterDate = now;

    switch (timeFilter) {
      case '1m':
        filterDate = subMonths(now, 1);
        break;
      case '3m':
        filterDate = subMonths(now, 3);
        break;
      case '6m':
        filterDate = subMonths(now, 6);
        break;
      case '9m':
        filterDate = subMonths(now, 9);
        break;
      case '1y':
        filterDate = subYears(now, 1);
        break;
      case '2y':
        filterDate = subYears(now, 2);
        break;
      case '3y':
        filterDate = subYears(now, 3);
        break;
      case '5y':
        filterDate = subYears(now, 5);
        break;
      case '10y':
        filterDate = subYears(now, 10);
        break;
      case 'all':
      default:
        filterDate = new Date(0); // Beginning of time
    }

    return dividendData.filter((item) =>
      isAfter(parseISO(item.date), filterDate)
    );
  }, [timeFilter]);

  // Aggregate data based on time filter
  const aggregatedData = useMemo(() => {
    if (!filteredData.length) return [];

    const aggregateByPeriod = (data, periodFn, formatFn) => {
      const aggregated = {};

      data.forEach((item) => {
        const date = parseISO(item.date);
        const periodKey = periodFn(date);

        if (!aggregated[periodKey]) {
          aggregated[periodKey] = {
            periodKey,
            displayLabel: formatFn(date),
            totalValue: 0,
            count: 0,
            items: [],
          };
        }

        aggregated[periodKey].totalValue += item.value;
        aggregated[periodKey].count += 1;
        aggregated[periodKey].items.push(item);
      });

      return Object.values(aggregated);
    };

    // Different aggregation strategies based on time filter
    switch (timeFilter) {
      case '1m':
      case '3m':
        // Show individual dividends for short periods
        return filteredData.map((item) => ({
          periodKey: item.date,
          displayLabel: format(parseISO(item.date), 'MM월 dd일', {
            locale: ko,
          }),
          totalValue: item.value,
          count: 1,
          items: [item],
        }));

      case '6m':
      case '9m':
        // Aggregate by month for medium-short periods
        return aggregateByPeriod(
          filteredData,
          (date) => `${getYear(date)}-${getMonth(date)}`,
          (date) => format(date, 'yyyy년 MM월', { locale: ko })
        );

      case '1y':
        // Aggregate by month for 1 year
        return aggregateByPeriod(
          filteredData,
          (date) => `${getYear(date)}-${getMonth(date)}`,
          (date) => format(date, 'yyyy년 MM월', { locale: ko })
        );

      case '2y':
      case '3y':
        // Aggregate by quarter for 2-3 years
        return aggregateByPeriod(
          filteredData,
          (date) => `${getYear(date)}-Q${getQuarter(date)}`,
          (date) => `${getYear(date)}년 ${getQuarter(date)}분기`
        );

      case '5y':
        // Aggregate by half-year for 5 years
        return aggregateByPeriod(
          filteredData,
          (date) => `${getYear(date)}-${Math.floor(getMonth(date) / 6) + 1}`,
          (date) =>
            `${getYear(date)}년 ${Math.floor(getMonth(date) / 6) + 1}반기`
        );

      case '10y':
      case 'all':
        // Aggregate by year for 10 years or all
        return aggregateByPeriod(
          filteredData,
          (date) => getYear(date),
          (date) => `${getYear(date)}년`
        );

      default:
        return filteredData;
    }
  }, [filteredData, timeFilter]);

  const summaryData = useMemo(() => {
    const total = filteredData.reduce((sum, item) => sum + item.value, 0);
    const average =
      filteredData.length > 0 ? Math.round(total / filteredData.length) : 0;

    return {
      total: total.toLocaleString(),
      average: average.toLocaleString(),
      count: filteredData.length,
    };
  }, [filteredData]);

  const formatTooltipValue = (value: number) => {
    return `${value.toLocaleString()}원`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>배당금 내역</CardTitle>
        <CardDescription>기간별 배당금 내역을 확인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="1y"
          value={timeFilter}
          onValueChange={(value) => setTimeFilter(value as TimeFilter)}
        >
          <TabsList className="grid grid-cols-5 md:grid-cols-10 mb-4">
            <TabsTrigger value="1m">1달</TabsTrigger>
            <TabsTrigger value="3m">3개월</TabsTrigger>
            <TabsTrigger value="6m">6개월</TabsTrigger>
            <TabsTrigger value="9m">9개월</TabsTrigger>
            <TabsTrigger value="1y">1년</TabsTrigger>
            <TabsTrigger value="2y">2년</TabsTrigger>
            <TabsTrigger value="3y">3년</TabsTrigger>
            <TabsTrigger value="5y">5년</TabsTrigger>
            <TabsTrigger value="10y">10년</TabsTrigger>
            <TabsTrigger value="all">전체</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm text-muted-foreground">
                  총 배당금
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summaryData.total}원</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm text-muted-foreground">
                  평균 배당금
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summaryData.average}원</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm text-muted-foreground">
                  배당 횟수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summaryData.count}회</p>
              </CardContent>
            </Card>
          </div>

          <ChartContainer
            config={{
              dividend: {
                label: '배당금',
                color: 'hsl(var(--chart-1))',
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aggregatedData.map((item) => ({
                  periodKey: item.periodKey,
                  displayLabel: item.displayLabel,
                  dividend: item.totalValue,
                  count: item.count,
                  items: item.items,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="displayLabel"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tickMargin={10}
                />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  width={50}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const totalValue = data.dividend;
                      const count = data.count;
                      const label = data.displayLabel;

                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{label}</span>
                            <span className="font-bold">
                              {formatTooltipValue(totalValue)}
                            </span>
                            {count > 1 && (
                              <span className="text-xs text-muted-foreground">
                                {count}회 배당 합계
                              </span>
                            )}
                            {data.items &&
                              data.items.length > 1 &&
                              timeFilter !== '1m' &&
                              timeFilter !== '3m' && (
                                <div className="mt-1 pt-1 border-t text-xs">
                                  <div className="font-medium mb-1">
                                    상세 내역:
                                  </div>
                                  {data.items.slice(0, 5).map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between"
                                    >
                                      <span>
                                        {format(
                                          parseISO(item.date),
                                          'yyyy-MM-dd'
                                        )}
                                      </span>
                                      <span>
                                        {item.value.toLocaleString()}원
                                      </span>
                                    </div>
                                  ))}
                                  {data.items.length > 5 && (
                                    <div className="text-center text-muted-foreground mt-1">
                                      외 {data.items.length - 5}건
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="dividend"
                  fill="var(--color-dividend)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Tabs>
      </CardContent>
    </Card>
  );
}
