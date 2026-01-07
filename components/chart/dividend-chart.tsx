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
  parseISO,
  format,
  subYears,
  subMonths,
  startOfQuarter,
  startOfYear,
  formatISO,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Landmark } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrencyStore } from '@/store/options';
import { cn } from '@/lib/utils';

interface DividendData {
  date: string;
  value: number;
  yoc?: number;
}

interface DividendChartProps {
  data: DividendData[];
  title?: string;
  description?: string;
  themeColor?: string;
}

type AggregationPeriod = 'monthly' | 'quarterly' | 'annual';
type TimeRange = 'ytd' | '1y' | '3y' | '5y' | '10y' | 'max';

const glassmorphismTooltipStyle = {
  backgroundColor: 'var(--card)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  color: 'var(--card-foreground)',
};

export function DividendChart({
  data = [],
  title = '배당금 내역 차트',
  description = '수령한 배당금의 내역입니다.',
  themeColor = 'var(--dividends-theme)',
}: DividendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('ytd');
  const { currency } = useCurrencyStore();

  const { chartData, aggregationPeriod } = useMemo(() => {
    if (!data || data.length === 0)
      return { chartData: [], aggregationPeriod: 'annual' };

    const now = new Date();
    let startDate: Date;
    let aggPeriod: AggregationPeriod;

    switch (timeRange) {
      case 'ytd':
        startDate = startOfYear(now);
        aggPeriod = 'monthly';
        break;
      case '1y':
        startDate = subYears(now, 1);
        aggPeriod = 'monthly';
        break;
      case '3y':
        startDate = subYears(now, 3);
        aggPeriod = 'quarterly';
        break;
      case '5y':
        startDate = subYears(now, 5);
        aggPeriod = 'quarterly';
        break;
      case '10y':
        startDate = subYears(now, 10);
        aggPeriod = 'annual';
        break;
      case 'max':
      default:
        startDate = new Date(0);
        aggPeriod = 'annual';
        break;
    }

    const filteredData = data.filter(
      (item) => parseISO(item.date) >= startDate
    );

    const aggregated = filteredData.reduce((acc, item) => {
      const date = parseISO(item.date);
      let key: string;

      if (aggPeriod === 'monthly') {
        key = format(date, 'yyyy-MM');
      } else if (aggPeriod === 'quarterly') {
        const quarterStart = startOfQuarter(date);
        key = format(quarterStart, 'yyyy-QQQ');
      } else {
        key = format(date, 'yyyy');
      }

      if (!acc[key]) {
        acc[key] = {
          value: 0,
          count: 0,
          yocSum: 0,
          date: formatISO(date, { representation: 'date' }),
        };
      }
      acc[key].value += item.value;
      if (item.yoc) {
        acc[key].yocSum += item.yoc;
        acc[key].count += 1;
      }
      return acc;
    }, {} as Record<string, { value: number; count: number; yocSum: number; date: string }>);

    const sortedChartData = Object.entries(aggregated)
      .map(([period, values]) => ({
        period,
        date: values.date,
        value: values.value,
        yoc: values.count > 0 ? values.yocSum / values.count : undefined,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { chartData: sortedChartData, aggregationPeriod: aggPeriod };
  }, [data, timeRange]);

  const formatPeriodLabel = (period: string) => {
    if (aggregationPeriod === 'monthly') {
      const date = parseISO(`${period}-01`);
      return format(date, 'yy년 M월', { locale: ko });
    }
    if (aggregationPeriod === 'quarterly') {
      const [year, quarter] = period.split('-');
      return `${year.slice(-2)}' ${quarter}`;
    }
    return period;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formattedLabel =
        aggregationPeriod === 'monthly'
          ? format(parseISO(`${label}-01`), 'yyyy년 M월', { locale: ko })
          : aggregationPeriod === 'quarterly'
          ? `${label.split('-')[0]}년 ${label.split('-')[1]}`
          : `${label}년`;

      return (
        <div
          style={glassmorphismTooltipStyle}
          className="p-3 rounded-lg shadow-lg"
        >
          <p className="text-center font-bold text-base mb-2">
            {formattedLabel}
          </p>
          <hr className="border-border my-1" />
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div
                  className="w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: themeColor }}
                />
                <span>배당금</span>
              </div>
              <span className="font-semibold ml-4">
                {new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: currency.toUpperCase(),
                  maximumFractionDigits: 0,
                }).format(data.value)}
              </span>
            </div>
            {data.yoc !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full mr-2"
                    style={{ backgroundColor: themeColor, opacity: 0.6 }}
                  />
                  <span>YoC</span>
                </div>
                <span className="font-semibold ml-4">
                  {data.yoc.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full glass-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Landmark style={{ color: themeColor }} className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Tabs
            defaultValue="ytd"
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
            style={
              { '--active-tab-color': themeColor } as React.CSSProperties
            }
          >
            <TabsList className="grid grid-cols-6">
              <TabsTrigger value="ytd">YTD</TabsTrigger>
              <TabsTrigger value="1y">1년</TabsTrigger>
              <TabsTrigger value="3y">3년</TabsTrigger>
              <TabsTrigger value="5y">5년</TabsTrigger>
              <TabsTrigger value="10y">10년</TabsTrigger>
              <TabsTrigger value="max">MAX</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartData.length > 0 ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tickFormatter={formatPeriodLabel}
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat('ko-KR', {
                      style: 'currency',
                      currency: currency.toUpperCase(),
                      notation: 'compact',
                    }).format(value as number)
                  }
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'var(--dividends-hover-bg)' }}
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  style={
                    {
                      fill: themeColor,
                    } as React.CSSProperties
                  }
                />
              </BarChart>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  선택한 기간에 데이터가 없습니다.
                </p>
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
