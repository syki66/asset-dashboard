'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { parseISO, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronDown, TrendingUp } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SeriesToggleButtons, SeriesInfo } from '../ui/series-toggle-buttons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { StockTradeHistoryChartProps } from '@/types';
import { cn } from '@/lib/utils';
import { useCurrencyStore } from '@/store/options';
import { formatCompactCurrency } from '@/utils/format';
import { TRANSACTION_CHART_COLORS } from '@/constants/chart-colors';

interface AggregatedTradeData {
  date: string;
  [key: string]: string | number;
}

type TradePayload = AggregatedTradeData;

type DynamicBarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  fillOpacity?: number;
  payload: TradePayload;
  selectedStocks: string[];
  stock: string;
  position: 'top' | 'bottom';
};

type TooltipPayloadItem = {
  color: string;
  dataKey: string;
  value: number;
};

type TradeTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
};

type BarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  fillOpacity?: number;
  payload: TradePayload;
};

interface StockTradeChartProps {
  data: StockTradeHistoryChartProps[];
  title?: string;
  description?: string;
  themeColor?: string;
  onSummaryChange?: (summary: StockTradeChartSummary) => void;
}

type DataViewMode = 'quantity' | 'price';
type AggregationMode = 'daily' | 'monthly' | 'yearly';

export type StockTradeChartSummary = {
  buyQuantity: number;
  buyAmount: number;
  sellQuantity: number;
  sellAmount: number;
  netQuantity: number;
  netAmount: number;
  buyStockCount: number;
  sellStockCount: number;
};

const generateStockColor = (index: number): string => {
  return TRANSACTION_CHART_COLORS[index % TRANSACTION_CHART_COLORS.length];
};

const DynamicBarShape = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill,
  fillOpacity,
  payload,
  selectedStocks,
  stock,
  position,
}: DynamicBarShapeProps) => {
  if (!width || !height) return null;

  let shouldRound = false;

  if (position === 'top') { // buy
    for (let i = selectedStocks.length - 1; i >= 0; i--) {
      const s = selectedStocks[i];
      if (payload[`${s}(매수)`] && payload[`${s}(매수)`] !== 0) {
        if (s === stock) shouldRound = true;
        break;
      }
    }
  } else if (position === 'bottom') { // sell
    for (let i = selectedStocks.length - 1; i >= 0; i--) {
      const s = selectedStocks[i];
      if (payload[`${s}(매도)`] && payload[`${s}(매도)`] !== 0) {
        if (s === stock) shouldRound = true;
        break;
      }
    }
  }

  const h = Math.abs(height);
  const r = shouldRound ? Math.min(4, h / 2, width / 2) : 0;
  const topY = Math.min(y, y + height);
  const bottomY = topY + h;

  let d = '';

  if (r === 0) {
    // Normal rectangle
    d = `
      M ${x},${topY}
      L ${x + width},${topY}
      L ${x + width},${bottomY}
      L ${x},${bottomY}
      Z
    `;
  } else if (position === 'top') {
    d = `
      M ${x},${bottomY}
      L ${x + width},${bottomY}
      L ${x + width},${topY + r}
      Q ${x + width},${topY} ${x + width - r},${topY}
      L ${x + r},${topY}
      Q ${x},${topY} ${x},${topY + r}
      Z
    `;
  } else if (position === 'bottom') {
    d = `
      M ${x},${topY}
      L ${x + width},${topY}
      L ${x + width},${bottomY - r}
      Q ${x + width},${bottomY} ${x + width - r},${bottomY}
      L ${x + r},${bottomY}
      Q ${x},${bottomY} ${x},${bottomY - r}
      Z
    `;
  }

  return <path d={d} fill={fill} fillOpacity={fillOpacity ?? 1} />;
};

export function StockTradeChart({
  data = [],
  title = '일별 주식 매매 현황',
  description = '각 날짜별로 매매한 주식 종목과 수량/금액을 확인합니다.',
  themeColor = '#EF4444', // Default to a red theme
  onSummaryChange,
}: StockTradeChartProps) {
  const [viewMode, setViewMode] = useState<DataViewMode>('quantity');
  const [aggregationMode, setAggregationMode] = useState<AggregationMode>('daily');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const currency = useCurrencyStore((state) => state.currency);
  const formatTradeValue = (value: number) => {
    if (viewMode === 'quantity') {
      return `${Math.round(value).toLocaleString()}주`;
    }

    if (currency === 'usd') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }

    const formattedValue = value.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });

    return `${formattedValue}원`;
  };

  const allStocks = useMemo(
    () =>
      Array.from(
        new Set(data.flatMap((item) => Object.keys(item.quantityBySymbol))),
      ).sort((a, b) => a.localeCompare(b)),
    [data],
  );

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(data.map((item) => item.date.substring(0, 4))),
    ).sort();
  }, [data]);

  const filteredStocks = useMemo(() => {
    const filtered = selectedPeriod === 'all'
      ? data
      : data.filter((item) => item.date.startsWith(selectedPeriod));
    return Array.from(
      new Set(filtered.flatMap((item) => Object.keys(item.quantityBySymbol))),
    ).sort((a, b) => a.localeCompare(b));
  }, [data, selectedPeriod]);

  const stockDisplayNames = useMemo(
    () =>
      data.reduce(
        (acc, item) => {
          Object.entries(item.namesBySymbol ?? {}).forEach(([symbol, name]) => {
            acc[symbol] = name;
          });
          return acc;
        },
        {} as Record<string, string>,
      ),
    [data],
  );

  const getStockDisplayName = useCallback(
    (stock: string) => stockDisplayNames[stock] ?? stock,
    [stockDisplayNames],
  );

  const [selectedStocks, setSelectedStocks] = useState<string[]>(allStocks);

  useEffect(() => {
    setSelectedStocks(filteredStocks);
  }, [filteredStocks]);

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

  const getAggregationKey = useCallback((date: string): string => {
    switch (aggregationMode) {
      case 'monthly': return date.substring(0, 7);   // YYYY-MM
      case 'yearly': return date.substring(0, 4);   // YYYY
      default: return date;                    // YYYY-MM-DD
    }
  }, [aggregationMode]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const filtered = selectedPeriod === 'all'
      ? data
      : data.filter((item) => item.date.startsWith(selectedPeriod));

    const aggregatedByKey = new Map<string, AggregatedTradeData>();

    // Pre-fill 12 months if viewing a specific year with monthly aggregation
    if (selectedPeriod !== 'all' && aggregationMode === 'monthly') {
      for (let i = 1; i <= 12; i++) {
        const monthStr = i.toString().padStart(2, '0');
        const key = `${selectedPeriod}-${monthStr}`;
        aggregatedByKey.set(key, { date: key });
      }
    }

    filtered.forEach((item) => {
      const dataSource =
        viewMode === 'quantity' ? item.quantityBySymbol : item.priceBySymbol;

      const key = getAggregationKey(item.date);

      if (!aggregatedByKey.has(key)) {
        aggregatedByKey.set(key, { date: key });
      }

      const aggregatedItem = aggregatedByKey.get(key)!;
      selectedStocks.forEach((stock) => {
        const stockValue = dataSource[stock];

        if (stockValue) {
          const buyKey = `${stock}(매수)`;
          const sellKey = `${stock}(매도)`;

          if (item.type === 'buy') {
            const currentValue = aggregatedItem[buyKey];
            aggregatedItem[buyKey] =
              (typeof currentValue === 'number' ? currentValue : 0) +
              stockValue;
          } else {
            const currentValue = aggregatedItem[sellKey];
            aggregatedItem[sellKey] =
              (typeof currentValue === 'number' ? currentValue : 0) -
              stockValue;
          }
        }
      });
    });

    return Array.from(aggregatedByKey.values())
      .filter((item) => {
        // Always show all 12 months when viewing a specific year with monthly aggregation
        if (selectedPeriod !== 'all' && aggregationMode === 'monthly') {
          return true;
        }

        // Otherwise, filter out dates that have no non-zero values for currently active stocks
        return selectedStocks.some((stock) => {
          const buyKey = `${stock}(매수)`;
          const sellKey = `${stock}(매도)`;
          return (
            (item[buyKey] && item[buyKey] !== 0) ||
            (item[sellKey] && item[sellKey] !== 0)
          );
        });
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [
    data,
    selectedPeriod,
    selectedStocks,
    viewMode,
    aggregationMode,
    getAggregationKey,
  ]);

  const stockSeries: SeriesInfo[] = useMemo(
    () =>
      filteredStocks.map((stock) => ({
        id: stock,
        name: getStockDisplayName(stock),
        color: stockColors[stock],
      })),
    [filteredStocks, getStockDisplayName, stockColors],
  );

  const toggleStock = (stock: string) => {
    setSelectedStocks((prev) =>
      prev.includes(stock)
        ? prev.filter((s) => s !== stock)
        : [...prev, stock].sort((a, b) => a.localeCompare(b)),
    );
  };

  const CustomTooltip = ({ active, payload, label }: TradeTooltipProps) => {
    if (active && payload && payload.length) {
      const filteredPayload = payload.filter((p) => p.value !== 0);
      if (filteredPayload.length === 0) return null;

      const sortedPayload = [...filteredPayload].sort((a, b) =>
        a.dataKey.localeCompare(b.dataKey),
      );

      const buyTotal = sortedPayload
        .filter((e) => e.dataKey.endsWith('(매수)'))
        .reduce((sum, e) => sum + e.value, 0);

      const sellTotal = sortedPayload
        .filter((e) => e.dataKey.endsWith('(매도)'))
        .reduce((sum, e) => sum + e.value, 0);

      const netTotal = buyTotal + sellTotal;

      const buyItems = sortedPayload.filter((e) =>
        e.dataKey.endsWith('(매수)'),
      );
      const sellItems = sortedPayload.filter((e) =>
        e.dataKey.endsWith('(매도)'),
      );

      const renderSection = (
        title: string,
        items: TooltipPayloadItem[],
        textColorClass: string,
      ) => {
        if (items.length === 0) return null;
        return (
          <div className='my-2'>
            <div className={`text-xs font-bold mb-1 ${textColorClass}`}>{title}</div>
            <div className='space-y-1.5'>
              {items.map((entry, index) => (
                <div key={index} className='flex items-center justify-between text-sm'>
                  <div className='flex items-center gap-2'>
                    <div
                      className='w-2.5 h-2.5 rounded-full'
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className={`font-medium ${textColorClass}`}>
                      {getStockDisplayName(
                        entry.dataKey.replace(/\(매수\)|\(매도\)/g, ''),
                      )}
                    </span>
                  </div>
                  <span className={`font-semibold ml-4 ${textColorClass}`}>
                    {formatTradeValue(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      };

      const labelText = label ?? '';

      return (
        <div className='liquid-glass-surface glassmorphism-tooltip min-w-[13.75rem]'>
          <p className='text-center font-bold text-base mb-2'>
            {aggregationMode === 'yearly'
              ? `${labelText}년`
              : aggregationMode === 'monthly'
                ? `${labelText.substring(0, 4)}년 ${parseInt(
                    labelText.substring(5, 7),
                  )}월`
                : format(parseISO(labelText), 'yyyy년 M월 d일', {
                    locale: ko,
                  })}
          </p>
          <hr className='border-border my-1' />

          {renderSection('매수', buyItems, 'text-rose-500')}

          {buyItems.length > 0 && sellItems.length > 0 && (
            <div className='h-px bg-border/50 my-2 w-full mx-auto' />
          )}

          {renderSection('매도', sellItems, 'text-blue-600')}

          <hr className='border-border my-2' />
          <div className='flex items-center justify-between font-bold text-sm text-foreground'>
            <span>합계</span>
            <span className={netTotal > 0 ? 'text-rose-500' : netTotal < 0 ? 'text-blue-600' : ''}>
              {netTotal > 0 ? '+' : ''}{formatTradeValue(netTotal)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };



  const tradeSummary = useMemo(() => {
    const filtered =
      selectedPeriod === 'all'
        ? data
        : data.filter((item) => item.date.startsWith(selectedPeriod));
    let buyQuantity = 0;
    let buyAmount = 0;
    let sellQuantity = 0;
    let sellAmount = 0;
    const buyStocks = new Set<string>();
    const sellStocks = new Set<string>();

    filtered.forEach((item) => {
      selectedStocks.forEach((stock) => {
        const quantity = item.quantityBySymbol[stock] ?? 0;
        const amount = item.priceBySymbol[stock] ?? 0;
        if (!quantity && !amount) return;

        if (item.type === 'buy') {
          buyQuantity += quantity;
          buyAmount += amount;
          buyStocks.add(stock);
        } else {
          sellQuantity -= quantity;
          sellAmount -= amount;
          sellStocks.add(stock);
        }
      });
    });

    return {
      buyQuantity,
      buyAmount,
      sellQuantity,
      sellAmount,
      netQuantity: buyQuantity + sellQuantity,
      netAmount: buyAmount + sellAmount,
      buyStockCount: buyStocks.size,
      sellStockCount: sellStocks.size,
    };
  }, [data, selectedPeriod, selectedStocks]);

  useEffect(() => {
    onSummaryChange?.(tradeSummary);
  }, [onSummaryChange, tradeSummary]);

  const getYAxisLabel = () => {
    if (viewMode === 'quantity') {
      return (value: number) =>
        new Intl.NumberFormat('ko-KR', {
          notation: 'compact',
          maximumFractionDigits: 0,
        }).format(value) + '주';
    } else {
      return (value: number) => {
        if (currency === 'usd') {
          return formatCompactCurrency(value, currency);
        }

        return formatCompactCurrency(value, currency);
      };
    }
  };

  const tradeThemeHoverColor = `color-mix(in srgb, ${themeColor} 15%, transparent)`;
  const liquidDropdownStyle = {
    backgroundColor: 'oklch(0.98 0.01 200 / 0.1)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  } as React.CSSProperties;

  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
    if (newPeriod !== 'all' && aggregationMode === 'yearly') {
      setAggregationMode('monthly');
    }
  };

  return (
    <Card
      className='chart-card w-full glass-card'
      style={
        {
          '--trade-theme-hover': tradeThemeHoverColor,
          '--trade-theme-main': themeColor,
        } as React.CSSProperties
      }
    >
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
                className={cn(
                  'interactive-lift h-7 cursor-pointer',
                  viewMode !== 'quantity' &&
                    'hover:!bg-[var(--trade-theme-hover)] hover:!text-current',
                )}
                style={viewMode === 'quantity' ? { backgroundColor: themeColor } : {}}
              >
                수량
              </Button>
              <Button
                variant={viewMode === 'price' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setViewMode('price')}
                className={cn(
                  'interactive-lift h-7 cursor-pointer',
                  viewMode !== 'price' &&
                    'hover:!bg-[var(--trade-theme-hover)] hover:!text-current',
                )}
                style={viewMode === 'price' ? { backgroundColor: themeColor } : {}}
              >
                가격
              </Button>
            </div>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  className='interactive-lift group !cursor-pointer liquid-glass-surface h-9 w-[6.75rem] justify-between border-white/15 px-3 text-sm font-medium hover:!bg-[var(--date-button-hover)] hover:!text-white data-[state=open]:!bg-[var(--date-button-hover)] data-[state=open]:!text-white data-[state=open]:hover:!bg-[var(--date-button-hover)] data-[state=open]:hover:!text-white data-[state=open]:hover:!transform-none data-[state=open]:hover:!shadow-sm'
                  style={{
                    ...liquidDropdownStyle,
                    '--date-button-hover': themeColor,
                  } as React.CSSProperties}
                >
                  {selectedPeriod === 'all' ? '전체기간' : `${selectedPeriod}년`}
                  <ChevronDown className='h-4 w-4 text-muted-foreground group-hover:text-white group-data-[state=open]:text-white' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='liquid-glass-surface w-[6.75rem] border-white/15 p-1'
                style={{
                  ...liquidDropdownStyle,
                  '--trade-theme-hover': tradeThemeHoverColor,
                  '--trade-theme-main': themeColor,
                } as React.CSSProperties}
              >
                <DropdownMenuRadioGroup
                  value={selectedPeriod}
                  onValueChange={handlePeriodChange}
                >
                  <DropdownMenuRadioItem
                    value='all'
                    showIndicator={false}
                    className='interactive-lift cursor-pointer rounded-md px-3 py-2 text-sm hover:!bg-[var(--trade-theme-hover)] hover:!text-current data-[state=checked]:!bg-[var(--trade-theme-main)] data-[state=checked]:!text-white data-[state=checked]:hover:!bg-[var(--trade-theme-main)]'
                  >
                    전체기간
                  </DropdownMenuRadioItem>
                  {availableYears.map((year) => (
                    <DropdownMenuRadioItem
                      key={year}
                      value={year}
                      showIndicator={false}
                      className='interactive-lift cursor-pointer rounded-md px-3 py-2 text-sm hover:!bg-[var(--trade-theme-hover)] hover:!text-current data-[state=checked]:!bg-[var(--trade-theme-main)] data-[state=checked]:!text-white data-[state=checked]:hover:!bg-[var(--trade-theme-main)]'
                    >
                      {year}년
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  className='interactive-lift group !cursor-pointer liquid-glass-surface h-9 w-[7.5rem] justify-between border-white/15 px-3 text-sm font-medium hover:!bg-[var(--date-button-hover)] hover:!text-white data-[state=open]:!bg-[var(--date-button-hover)] data-[state=open]:!text-white data-[state=open]:hover:!bg-[var(--date-button-hover)] data-[state=open]:hover:!text-white data-[state=open]:hover:!transform-none data-[state=open]:hover:!shadow-sm'
                  style={{
                    ...liquidDropdownStyle,
                    '--date-button-hover': themeColor,
                  } as React.CSSProperties}
                >
                  {aggregationMode === 'daily'
                    ? '일별 합산'
                    : aggregationMode === 'monthly'
                      ? '월별 합산'
                      : '연도별 합산'}
                  <ChevronDown className='h-4 w-4 text-muted-foreground group-hover:text-white group-data-[state=open]:text-white' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='liquid-glass-surface w-[7.5rem] border-white/15 p-1'
                style={{
                  ...liquidDropdownStyle,
                  '--trade-theme-hover': tradeThemeHoverColor,
                  '--trade-theme-main': themeColor,
                } as React.CSSProperties}
              >
                <DropdownMenuRadioGroup
                  value={aggregationMode}
                  onValueChange={(value) =>
                    setAggregationMode(value as AggregationMode)
                  }
                >
                  <DropdownMenuRadioItem
                    value='daily'
                    showIndicator={false}
                    className='interactive-lift cursor-pointer rounded-md px-3 py-2 text-sm hover:!bg-[var(--trade-theme-hover)] hover:!text-current data-[state=checked]:!bg-[var(--trade-theme-main)] data-[state=checked]:!text-white data-[state=checked]:hover:!bg-[var(--trade-theme-main)]'
                  >
                    일별 합산
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value='monthly'
                    showIndicator={false}
                    className='interactive-lift cursor-pointer rounded-md px-3 py-2 text-sm hover:!bg-[var(--trade-theme-hover)] hover:!text-current data-[state=checked]:!bg-[var(--trade-theme-main)] data-[state=checked]:!text-white data-[state=checked]:hover:!bg-[var(--trade-theme-main)]'
                  >
                    월별 합산
                  </DropdownMenuRadioItem>
                  {selectedPeriod === 'all' && (
                    <DropdownMenuRadioItem
                      value='yearly'
                      showIndicator={false}
                      className='interactive-lift cursor-pointer rounded-md px-3 py-2 text-sm hover:!bg-[var(--trade-theme-hover)] hover:!text-current data-[state=checked]:!bg-[var(--trade-theme-main)] data-[state=checked]:!text-white data-[state=checked]:hover:!bg-[var(--trade-theme-main)]'
                    >
                      연도별 합산
                    </DropdownMenuRadioItem>
                  )}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
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
                    aggregationMode === 'yearly'
                      ? `${dateStr}년`
                      : aggregationMode === 'monthly'
                        ? `${dateStr.substring(2, 4)}/${dateStr.substring(5, 7)}`
                        : format(parseISO(dateStr), 'yy/MM/dd')
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
                <defs>
                  {selectedStocks.map((stock) => (
                    <pattern
                      key={`pattern-${stock}`}
                      id={`pattern-${stock}`}
                      patternUnits='userSpaceOnUse'
                      width='8'
                      height='8'
                      patternTransform='rotate(45)'
                    >
                      <rect width='8' height='8' fill={stockColors[stock]} />
                      <line
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='8'
                        stroke='#ffffff'
                        strokeWidth='3'
                        strokeOpacity='0.4'
                      />
                    </pattern>
                  ))}
                </defs>
                {selectedStocks.map((stock) => (
                  <Bar
                    key={`${stock}-buy`}
                    dataKey={`${stock}(매수)`}
                    stackId='a'
                    fill={stockColors[stock]}
                    name={`${stock}(매수)`}
                    shape={(props: unknown) => (
                      <DynamicBarShape
                        {...(props as BarShapeProps)}
                        selectedStocks={selectedStocks}
                        stock={stock}
                        position='top'
                      />
                    )}
                  />
                ))}
                {selectedStocks.map((stock) => (
                  <Bar
                    key={`${stock}-sell`}
                    dataKey={`${stock}(매도)`}
                    stackId='a'
                    fill={`url(#pattern-${stock})`}
                    name={`${stock}(매도)`}
                    shape={(props: unknown) => (
                      <DynamicBarShape
                        {...(props as BarShapeProps)}
                        selectedStocks={selectedStocks}
                        stock={stock}
                        position='bottom'
                      />
                    )}
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
      </CardContent>
    </Card>
  );
}
