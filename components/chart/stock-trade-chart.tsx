'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { parseISO, format, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TrendingUp, CalendarIcon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SeriesToggleButtons, SeriesInfo } from '../ui/series-toggle-buttons';
import { StockTradeHistoryChartProps } from '@/types';

interface AggregatedTradeData {
  date: string;
  [key: string]: any;
}

interface StockTradeChartProps {
  data: StockTradeHistoryChartProps[];
  title?: string;
  description?: string;
  themeColor?: string;
}

type DataViewMode = 'quantity' | 'price';

const generateStockColor = (index: number): string => {
  const colors = [
    '#3B82F6',
    '#EC4899',
    '#EF4444',
    '#06B6D4',
    '#10B981',
    '#84CC16',
    '#8B5CF6',
    '#F59E0B',
    '#F97316',
    '#14B8A6',
    '#8B5A2B',
    '#DC2626',
    '#7C3AED',
    '#059669',
    '#DB2777',
    '#2563EB',
  ];
  return colors[index % colors.length];
};

export function StockTradeChart({
  data = [],
  title = '일별 주식 매매 현황',
  description = '각 날짜별로 매매한 주식 종목과 수량/금액을 확인합니다.',
  themeColor = '#EF4444', // Default to a red theme
}: StockTradeChartProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [viewMode, setViewMode] = useState<DataViewMode>('quantity');

  const allStocks = useMemo(
    () =>
      Array.from(
        new Set(data.flatMap((item) => Object.keys(item.quantityBySymbol))),
      ).sort((a, b) => a.localeCompare(b)),
    [data],
  );

  const [selectedStocks, setSelectedStocks] = useState<string[]>(allStocks);

  useEffect(() => {
    setSelectedStocks(allStocks);
  }, [allStocks]);

  const stockColors = useMemo(
    () =>
      allStocks.reduce(
        (acc, stock, index) => {
          acc[stock] = generateStockColor(index);
          return acc;
        },
        {} as { [key: string]: string },
      ),
    [allStocks],
  );

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let currentStartDate: Date;
    let currentEndDate: Date;

    if (dateRange.from && dateRange.to) {
      currentStartDate = dateRange.from;
      currentEndDate = dateRange.to;
    } else {
      const allDates = data
        .map((item) => parseISO(item.date))
        .sort((a, b) => a.getTime() - b.getTime());
      currentStartDate = allDates.length > 0 ? allDates[0] : new Date();
      currentEndDate =
        allDates.length > 0 ? allDates[allDates.length - 1] : new Date();
    }

    const filtered = data.filter((item) => {
      const itemDate = parseISO(item.date);
      return isWithinInterval(itemDate, {
        start: currentStartDate,
        end: currentEndDate,
      });
    });

    const aggregatedByDate = new Map<string, AggregatedTradeData>();

    filtered.forEach((item) => {
      const dataSource =
        viewMode === 'quantity' ? item.quantityBySymbol : item.priceBySymbol;

      if (!aggregatedByDate.has(item.date)) {
        aggregatedByDate.set(item.date, { date: item.date });
      }

      const aggregatedItem = aggregatedByDate.get(item.date)!;
      selectedStocks.forEach((stock) => {
        if (dataSource[stock]) {
          const buyKey = `${stock}(매수)`;
          const sellKey = `${stock}(매도)`;
          if (item.type === 'buy') {
            aggregatedItem[buyKey] = (aggregatedItem[buyKey] || 0) + dataSource[stock];
          } else {
            aggregatedItem[sellKey] = (aggregatedItem[sellKey] || 0) - dataSource[stock];
          }
        }
      });
    });

    return Array.from(aggregatedByDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [data, dateRange, selectedStocks, viewMode]);

  const stockSeries: SeriesInfo[] = useMemo(
    () =>
      allStocks.map((stock) => ({
        id: stock,
        name: stock,
        color: stockColors[stock],
      })),
    [allStocks, stockColors],
  );

  const toggleStock = (stock: string) => {
    setSelectedStocks((prev) =>
      prev.includes(stock)
        ? prev.filter((s) => s !== stock)
        : [...prev, stock].sort((a, b) => a.localeCompare(b)),
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const filteredPayload = payload.filter((p: any) => p.value !== 0);
      if (filteredPayload.length === 0) return null;

      const sortedPayload = [...filteredPayload].sort((a: any, b: any) =>
        a.dataKey.localeCompare(b.dataKey),
      );

      const unit = viewMode === 'quantity' ? '주' : '원';

      const buyTotal = sortedPayload
        .filter((e: any) => e.dataKey.endsWith('(매수)'))
        .reduce((sum: number, e: any) => sum + e.value, 0);

      const sellTotal = sortedPayload
        .filter((e: any) => e.dataKey.endsWith('(매도)'))
        .reduce((sum: number, e: any) => sum + e.value, 0);

      const netTotal = buyTotal + sellTotal;

      return (
        <div className='glassmorphism-tooltip min-w-[13.75rem]'>
          <p className='text-center font-bold text-base mb-2'>
            {format(parseISO(label), 'yyyy년 M월 d일', { locale: ko })}
          </p>
          <hr className='border-border my-1' />
          <div className='space-y-1.5 mt-2'>
            {sortedPayload.map((entry: any, index: number) => (
              <div
                key={index}
                className='flex items-center justify-between text-sm'
              >
                <div className='flex items-center gap-2'>
                  <div
                    className='w-2.5 h-2.5 rounded-full'
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className='font-medium'>{entry.dataKey}</span>
                </div>
                <span className='font-semibold ml-4'>
                  {entry.value.toLocaleString()}{unit}
                </span>
              </div>
            ))}
          </div>
          <hr className='border-border my-2' />
          <div className='space-y-1 text-sm'>
            <div className='flex items-center justify-between font-bold'>
              <span>총 매수</span>
              <span>{buyTotal.toLocaleString()}{unit}</span>
            </div>
            <div className='flex items-center justify-between font-bold'>
              <span>총 매도</span>
              <span>{sellTotal.toLocaleString()}{unit}</span>
            </div>
            {netTotal !== 0 && (
              <div className='flex items-center justify-between font-bold text-muted-foreground'>
                <span>순매매</span>
                <span>{netTotal.toLocaleString()}{unit}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleSelectAllPeriod = () => {
    if (data.length > 0) {
      const dates = data
        .map((item) => parseISO(item.date))
        .sort((a, b) => a.getTime() - b.getTime());
      setDateRange({
        from: dates[0],
        to: dates[dates.length - 1],
      });
    }
  };

  const { totalBuy, totalSell } = useMemo(() => {
    let buy = 0;
    let sell = 0;
    chartData.forEach((item) => {
      Object.entries(item)
        .filter(([key]) => key !== 'date')
        .forEach(([key, value]) => {
          if (key.endsWith('(매수)')) {
            buy += value as number;
          } else if (key.endsWith('(매도)')) {
            sell += value as number;
          }
        });
    });
    return { totalBuy: buy, totalSell: sell };
  }, [chartData]);

  const getYAxisLabel = () => {
    if (viewMode === 'quantity') {
      return (value: number) =>
        new Intl.NumberFormat('ko-KR', {
          notation: 'compact',
        }).format(value) + '주';
    } else {
      return (value: number) =>
        new Intl.NumberFormat('ko-KR', {
          notation: 'compact',
          style: 'currency',
          currency: 'KRW',
          maximumFractionDigits: 0,
        }).format(value);
    }
  };

  const getTotalUnit = () => {
    return viewMode === 'quantity' ? '주' : '원';
  };

  return (
    <Card className='w-full glass-card'>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='flex flex-col gap-1'>
            <CardTitle className='text-lg flex items-center gap-2'>
              <TrendingUp style={{ color: themeColor }} className='h-5 w-5' />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className='flex items-center gap-2 flex-wrap justify-end'>
            <div className='flex gap-1 border border-border rounded-md p-1'>
              <Button
                variant={viewMode === 'quantity' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('quantity')}
                className='h-7'
              >
                수량
              </Button>
              <Button
                variant={viewMode === 'price' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('price')}
                className='h-7'
              >
                가격
              </Button>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleSelectAllPeriod}
              className='h-9'
            >
              전체 기간
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id='date'
                  variant={'outline'}
                  className={cn(
                    'w-[15rem] justify-start text-left font-normal h-9',
                    (!dateRange.from || !dateRange.to) &&
                    'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'yy.MM.dd', { locale: ko })} -{' '}
                        {format(dateRange.to, 'yy.MM.dd', { locale: ko })}
                      </>
                    ) : (
                      format(dateRange.from, 'yy.MM.dd', { locale: ko })
                    )
                  ) : (
                    <span>날짜 범위 선택</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='end'>
                <Calendar
                  initialFocus
                  mode='range'
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            {chartData.length > 0 ? (
              <BarChart data={chartData} stackOffset='sign'>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='date'
                  tickFormatter={(dateStr) =>
                    format(parseISO(dateStr), 'yy/MM/dd')
                  }
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                  interval='preserveStartEnd'
                />
                <YAxis
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={getYAxisLabel()}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'var(--transaction-hover-bg)' }}
                />
                {selectedStocks.map((stock) => (
                  <Bar
                    key={`${stock}-buy`}
                    dataKey={`${stock}(매수)`}
                    stackId='a'
                    fill={stockColors[stock]}
                    radius={[4, 4, 0, 0]}
                    name={`${stock}(매수)`}
                  />
                ))}
                {selectedStocks.map((stock) => (
                  <Bar
                    key={`${stock}-sell`}
                    dataKey={`${stock}(매도)`}
                    stackId='a'
                    fill={stockColors[stock]}
                    radius={[0, 0, 4, 4]}
                    name={`${stock}(매도)`}
                    fillOpacity={0.5}
                  />
                ))}
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

        <SeriesToggleButtons
          series={stockSeries}
          activeSeries={selectedStocks}
          onToggle={toggleStock}
          className='mt-4'
        />
        {/* 총 값 Display */}
        <div className='mt-4 text-sm text-muted-foreground flex items-center gap-4'>
          <div className='flex items-center gap-1'>
            <span className='font-semibold'>총 매수:</span>
            <span className='text-foreground text-base font-bold'>
              {totalBuy.toLocaleString()}{getTotalUnit()}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <span className='font-semibold'>총 매도:</span>
            <span className='text-foreground text-base font-bold'>
              {totalSell.toLocaleString()}{getTotalUnit()}
            </span>
          </div>
          <div className='flex items-center gap-1'>
            <span className='font-semibold'>순매매:</span>
            <span className='text-foreground text-base font-bold'>
              {(totalBuy + totalSell).toLocaleString()}{getTotalUnit()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
