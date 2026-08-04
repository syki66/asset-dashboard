'use client';

import { useState, useEffect, useMemo, type ElementType } from 'react';
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
  startOfQuarter,
  startOfYear,
  formatISO,
  isValid,
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
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrencyStore } from '@/store/options';
import { formatCompactCurrency } from '@/utils/format';
import { adjustValueForInflation } from '@/utils/inflation';

interface DividendData {
  date: string;
  value: number;
}

interface DividendChartProps {
  data: DividendData[];
  title?: string;
  description?: string;
  themeColor?: string;
  icon?: ElementType;
  valueLabel?: string;
  showTimeRangeTabs?: boolean;
  defaultTimeRange?: TimeRange;
  chartHeightClassName?: string;
  referenceDate?: string;
}

type AggregationPeriod = 'monthly' | 'quarterly' | 'annual';
type TimeRange = 'ytd' | '1y' | '3y' | '5y' | '10y' | 'max';
type DividendTooltipPayloadItem = {
  payload: {
    value: number;
  };
};
type DividendTooltipProps = {
  active?: boolean;
  payload?: DividendTooltipPayloadItem[];
  label?: string;
};

export function DividendChart({
  data = [],
  title = '배당금 내역 차트',
  description = '수령한 배당금의 내역입니다.',
  themeColor = 'var(--dividends-theme)',
  icon: Icon = Landmark,
  valueLabel = '배당금',
  showTimeRangeTabs = true,
  defaultTimeRange = 'ytd',
  chartHeightClassName = 'h-80',
  referenceDate,
}: DividendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [adjustForInflation, setAdjustForInflation] = useState(false);
  const [isMobileChart, setIsMobileChart] = useState(false);
  const { currency } = useCurrencyStore();
  const hoverColor = themeColor.replace('-theme)', '-hover-bg)');

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const mobileMediaQuery = window.matchMedia('(max-width: 639px)');
    const updateMobileChart = () => setIsMobileChart(mobileMediaQuery.matches);

    updateMobileChart();
    mobileMediaQuery.addEventListener('change', updateMobileChart);

    return () =>
      mobileMediaQuery.removeEventListener('change', updateMobileChart);
  }, []);

  const formatCurrencyValue = (value: number, compact = false) => {
    if (currency === 'usd') {
      if (compact) {
        return formatCompactCurrency(value, currency);
      }

      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    }

    if (compact) {
      return formatCompactCurrency(value, currency);
    }

    return `${new Intl.NumberFormat('ko-KR', {
      maximumFractionDigits: 0,
    }).format(value)}원`;
  };

  const { chartData, aggregationPeriod } = useMemo(() => {
    if (!data || data.length === 0)
      return { chartData: [], aggregationPeriod: 'annual' };

    const parsedReferenceDate = referenceDate
      ? parseISO(referenceDate)
      : new Date();
    const rangeEndDate = isValid(parsedReferenceDate)
      ? parsedReferenceDate
      : new Date();
    let startDate: Date;
    let aggPeriod: AggregationPeriod;

    switch (timeRange) {
      case 'ytd':
        startDate = startOfYear(rangeEndDate);
        aggPeriod = 'monthly';
        break;
      case '1y':
        startDate = subYears(rangeEndDate, 1);
        aggPeriod = 'monthly';
        break;
      case '3y':
        startDate = startOfYear(subYears(rangeEndDate, 2));
        aggPeriod = 'quarterly';
        break;
      case '5y':
        startDate = startOfYear(subYears(rangeEndDate, 4));
        aggPeriod = 'annual';
        break;
      case '10y':
        startDate = startOfYear(subYears(rangeEndDate, 9));
        aggPeriod = 'annual';
        break;
      case 'max':
      default:
        startDate = new Date(0);
        aggPeriod = 'annual';
        break;
    }

    const filteredData = data.filter((item) => {
      const itemDate = parseISO(item.date);
      return itemDate >= startDate && itemDate <= rangeEndDate;
    });

    const aggregated = filteredData.reduce(
      (acc, item) => {
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
            date: formatISO(date, { representation: 'date' }),
          };
        }
        const adjustedValue = adjustForInflation
          ? adjustValueForInflation(item.value, item.date)
          : item.value;

        acc[key].value += adjustedValue;
        return acc;
      },
      {} as Record<string, { value: number; date: string }>,
    );

    const sortedChartData = Object.entries(aggregated)
      .map(([period, values]) => ({
        period,
        date: values.date,
        value: values.value,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (aggPeriod === 'annual') {
      const startYear = startDate.getFullYear();
      const endYear = rangeEndDate.getFullYear();
      const availableYears = sortedChartData.map((item) => Number(item.period));
      const firstDataYear = availableYears.length
        ? Math.min(...availableYears)
        : startYear;
      const displayStartYear = Math.max(startYear, firstDataYear);

      return {
        chartData: Array.from(
          { length: endYear - displayStartYear + 1 },
          (_, index) => {
            const year = (displayStartYear + index).toString();
            return {
              period: year,
              date: formatISO(new Date(Number(year), 0, 1), {
                representation: 'date',
              }),
              value: aggregated[year]?.value ?? 0,
            };
          },
        ),
        aggregationPeriod: aggPeriod,
      };
    }

    return { chartData: sortedChartData, aggregationPeriod: aggPeriod };
  }, [adjustForInflation, data, referenceDate, timeRange]);

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

  const CustomTooltip = ({ active, payload, label }: DividendTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const labelText = label ?? '';
      const formattedLabel =
        aggregationPeriod === 'monthly'
          ? format(parseISO(`${labelText}-01`), 'yyyy년 M월', { locale: ko })
          : aggregationPeriod === 'quarterly'
            ? `${labelText.split('-')[0]}년 ${labelText.split('-')[1]}`
            : `${labelText}년`;

      return (
        <div className='liquid-glass-surface glassmorphism-tooltip max-w-[calc(100vw-2rem)] lg:max-w-none'>
          <p className='text-center font-bold text-base mb-2'>
            {formattedLabel}
          </p>
          <hr className='border-border my-1' />
          <div className='space-y-1 mt-2'>
            <div className='flex items-center justify-between text-sm'>
              <div className='flex items-center'>
                <div
                  className='w-2.5 h-2.5 rounded-full mr-2'
                  style={{ backgroundColor: themeColor }}
                />
                <span>{valueLabel}</span>
              </div>
              <span className='font-semibold ml-4'>
                {formatCurrencyValue(data.value)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className='chart-card w-full glass-card'>
      <CardHeader className='p-3.5 sm:p-4 lg:p-6'>
        <div className='flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between lg:items-center lg:gap-4'>
          <div className='min-w-0 sm:flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-4'>
            <div className='flex min-h-9 items-center justify-between gap-2 sm:min-h-8 lg:contents'>
              <CardTitle className='flex min-w-0 items-center gap-2 text-lg leading-snug'>
                <Icon style={{ color: themeColor }} className='h-5 w-5' />
                {title}
              </CardTitle>
              <Button
                type='button'
                variant='outline'
                size='sm'
                aria-pressed={adjustForInflation}
                onClick={() => setAdjustForInflation((current) => !current)}
                className='interactive-lift h-9 shrink-0 cursor-pointer gap-1.5 rounded-md border-white/15 bg-white/[0.04] px-3 text-xs font-semibold shadow-sm hover:bg-white/[0.1] hover:text-foreground sm:h-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center lg:text-sm'
                style={
                  adjustForInflation
                    ? {
                        backgroundColor: themeColor,
                        borderColor: themeColor,
                        color: '#fff',
                      }
                    : undefined
                }
              >
                <span className='whitespace-nowrap'>물가 보정</span>
                <span
                  className={
                    adjustForInflation
                      ? 'text-[10px] text-white/80 lg:text-xs'
                      : 'text-[10px] lg:text-xs'
                  }
                  style={
                    adjustForInflation ? undefined : { color: themeColor }
                  }
                >
                  {adjustForInflation ? 'ON' : 'OFF'}
                </span>
              </Button>
            </div>
            {description && (
              <CardDescription className='mt-1 lg:col-start-1 lg:row-start-2'>
                {description}
              </CardDescription>
            )}
          </div>
          {showTimeRangeTabs && (
            <Tabs
              defaultValue={defaultTimeRange}
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as TimeRange)}
              style={
                { '--active-tab-color': themeColor } as React.CSSProperties
              }
              className='w-full sm:w-auto'
            >
              <TabsList className='grid w-full grid-cols-6 rounded-lg border border-white/15 bg-white/10 shadow-sm backdrop-blur-xs lg:w-auto [&>button]:px-1 [&>button]:text-xs sm:[&>button]:px-3 lg:[&>button]:text-xs'>
                <TabsTrigger value='ytd' className='interactive-lift rounded-md font-semibold'>
                  YTD
                </TabsTrigger>
                <TabsTrigger value='1y' className='interactive-lift rounded-md font-semibold'>
                  1년
                </TabsTrigger>
                <TabsTrigger value='3y' className='interactive-lift rounded-md font-semibold'>
                  3년
                </TabsTrigger>
                <TabsTrigger value='5y' className='interactive-lift rounded-md font-semibold'>
                  5년
                </TabsTrigger>
                <TabsTrigger value='10y' className='interactive-lift rounded-md font-semibold'>
                  10년
                </TabsTrigger>
                <TabsTrigger value='max' className='interactive-lift rounded-md font-semibold'>
                  MAX
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      <CardContent className='px-2 pb-4 sm:px-4'>
        <div className={chartHeightClassName}>
          <ResponsiveContainer width='100%' height='100%'>
            {chartData.length > 0 ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='period'
                  tickFormatter={formatPeriodLabel}
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  fontSize={12}
                  width={isMobileChart ? 44 : 60}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    formatCurrencyValue(value as number, true)
                  }
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: hoverColor }}
                />
                <Bar
                  dataKey='value'
                  radius={[4, 4, 0, 0]}
                  style={
                    {
                      fill: themeColor,
                    } as React.CSSProperties
                  }
                />
              </BarChart>
            ) : (
              <div className='flex items-center justify-center h-full'>
                <p className='text-muted-foreground'>
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
