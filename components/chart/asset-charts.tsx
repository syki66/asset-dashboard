'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
  Line,
} from 'recharts';
import {
  format,
  parseISO,
  subDays,
  subMonths,
  subYears,
  startOfYear,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  CalendarDays,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { inflationRates } from '@/constants/keywords';
import { Button } from '../ui/button';
import {
  SeriesToggleButtons,
  SeriesInfo,
} from '../ui/series-toggle-buttons';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarPicker } from '../ui/calendar-picker';

// 차트 시리즈 타입 정의
interface AssetDataPoint {
  date: string;
  value: number;
}

interface ProcessedAssetDataPoint extends AssetDataPoint {
  parsedDate: Date;
  adjustedValue: number;
  displayValue: number;
}

interface AssetSeries {
  id: string;
  name: string;
  color?: string;
  data: AssetDataPoint[];
  unit?: 'currency' | 'percent';
}

interface SeriesToggleGroup {
  id: string;
  name: string;
  color?: string;
  seriesIds: string[];
}

// 기본 색상 팔레트 - 더 많은 시리즈가 있을 경우 사용
const DEFAULT_COLORS = [
  '#6366f1', // 인디고
  '#f59e0b', // 앰버
  '#10b981', // 에메랄드
  '#ef4444', // 레드
  '#8b5cf6', // 바이올렛
  '#3b82f6', // 블루
  '#ec4899', // 핑크
  '#14b8a6', // 틸
  '#f97316', // 오렌지
  '#84cc16', // 라임
  '#06b6d4', // 사이안
  '#d946ef', // 퓨시아
];

interface AssetHistoryChartProps {
  series: AssetSeries[];
  title?: string;
  description?: string;
  reverseYAxis?: boolean;
  chartType?: 'area' | 'line';
  themeColor?: string;
  icon?: React.ElementType;
  showLogScaleToggle?: boolean;
  showInflationAdjustToggle?: boolean;
  fillBetween?: [string, string]; // [bottomKey, topKey]
  calendarCategory?: string;
  seriesToggleGroups?: SeriesToggleGroup[];
}

export function AssetChart({
  series = [],
  title = '자산 내역 차트',
  description = '',
  reverseYAxis = false,
  chartType = 'area',
  themeColor = 'var(--overview-theme)',
  icon: Icon,
  showLogScaleToggle = true,
  showInflationAdjustToggle = true,
  fillBetween,
  calendarCategory,
  seriesToggleGroups = [],
}: AssetHistoryChartProps) {
  const [useLogScale, setUseLogScale] = useState(false);
  const [adjustForInflation, setAdjustForInflation] = useState(false);
  const [timeRange, setTimeRange] = useState('all');
  const [activeSeries, setActiveSeries] = useState<string[]>([]);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  // 시리즈에 색상 할당
  const seriesWithColors = series.map((s, index) => ({
    ...s,
    color: s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  // 컴포넌트 마운트 시 모든 시리즈 활성화
  useEffect(() => {
    setActiveSeries(seriesWithColors.map((s) => s.id));
  }, [series]);

  // 인플레이션 조정 함수
  const adjustValueForInflation = (value: number, dateStr: string) => {
    if (!adjustForInflation) return value;

    let adjustedValue = value;
    const year = Number.parseInt(dateStr.substring(0, 4));
    const currentYear = new Date().getFullYear();

    // 현재 연도부터 해당 연도까지 인플레이션 적용
    for (let y = year; y < currentYear; y++) {
      const inflationRate = (inflationRates as Record<number, number>)[y];
      if (inflationRate) {
        adjustedValue = adjustedValue * (1 + inflationRate / 100);
      }
    }

    return adjustedValue;
  };

  // 데이터 처리 - 각 시리즈별로 처리
  const processedSeriesData = seriesWithColors.map((series) => {
    const processedData = series.data.map((item) => {
      const adjustedValue = adjustForInflation
        ? adjustValueForInflation(item.value, item.date)
        : item.value;

      return {
        date: item.date,
        parsedDate: parseISO(item.date),
        value: item.value,
        adjustedValue: adjustedValue,
        displayValue: adjustForInflation ? adjustedValue : item.value,
      };
    });

    return {
      ...series,
      processedData,
    };
  });

  const availableDateRange = useMemo(() => {
    const dates = processedSeriesData.flatMap((series) =>
      series.processedData.map((item) => item.parsedDate),
    );

    if (dates.length === 0) {
      return {
        minDate: undefined,
        maxDate: undefined,
      };
    }

    return {
      minDate: new Date(Math.min(...dates.map((date) => date.getTime()))),
      maxDate: new Date(Math.max(...dates.map((date) => date.getTime()))),
    };
  }, [processedSeriesData]);

  useEffect(() => {
    if (!availableDateRange.minDate || !availableDateRange.maxDate) return;

    setCustomStartDate((current) => current ?? availableDateRange.minDate);
    setCustomEndDate((current) => current ?? availableDateRange.maxDate);
  }, [availableDateRange.minDate, availableDateRange.maxDate]);

  // 시간 범위에 따른 데이터 필터링
  const getFilteredData = (data: ProcessedAssetDataPoint[]) => {
    if (timeRange === 'all') return data;
    if (data.length === 0) return [];

    if (timeRange === 'custom') {
      const start = customStartDate ?? availableDateRange.minDate;
      const end = customEndDate ?? availableDateRange.maxDate;

      if (!start || !end) return data;

      const startTime = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
      ).getTime();
      const endTime = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
        23,
        59,
        59,
        999,
      ).getTime();

      return data.filter((item) => {
        const itemTime = item.parsedDate.getTime();
        return itemTime >= startTime && itemTime <= endTime;
      });
    }

    // 가장 최근 날짜 찾기
    const latestDate = new Date(
      Math.max(...data.map((item) => item.parsedDate.getTime()))
    );

    let cutoffDate;
    switch (timeRange) {
      case '1w':
        cutoffDate = subDays(latestDate, 7);
        break;
      case '1m':
        cutoffDate = subMonths(latestDate, 1);
        break;
      case '3m':
        cutoffDate = subMonths(latestDate, 3);
        break;
      case '6m':
        cutoffDate = subMonths(latestDate, 6);
        break;
      case 'ytd':
        cutoffDate = startOfYear(latestDate);
        break;
      case '1y':
        cutoffDate = subYears(latestDate, 1);
        break;
      case '3y':
        cutoffDate = subYears(latestDate, 3);
        break;
      case '5y':
        cutoffDate = subYears(latestDate, 5);
        break;
      case '10y':
        cutoffDate = subYears(latestDate, 10);
        break;
      default:
        return data;
    }

    return data.filter((item) => item.parsedDate >= cutoffDate);
  };

  // 각 시리즈별로 필터링된 데이터
  const filteredSeriesData = processedSeriesData.map((series) => ({
    ...series,
    filteredData: getFilteredData(series.processedData),
  }));

  // 활성화된 시리즈만 필터링
  const activeSeriesData = filteredSeriesData.filter((series) =>
    activeSeries.includes(series.id)
  );

  // 차트 데이터 준비 - 모든 시리즈의 데이터를 날짜별로 병합
  const prepareChartData = () => {
    if (activeSeriesData.length === 0) return [];

    // 모든 날짜 추출
    const allDates = new Set<string>();

    activeSeriesData.forEach((series) => {
      series.filteredData.forEach((item) => {
        allDates.add(item.date);
      });
    });

    // 날짜순으로 정렬
    const sortedDates = Array.from(allDates).sort();

    // 각 날짜별로 모든 시리즈의 값을 포함하는 객체 생성
    return sortedDates.map((date) => {
      const dataPoint: any = { date };

      // 각 시리즈의 값 추가
      activeSeriesData.forEach((series) => {
        const seriesDataPoint = series.filteredData.find(
          (item) => item.date === date
        );
        if (seriesDataPoint) {
          dataPoint[series.id] = seriesDataPoint.displayValue;
        }
      });

      // 두 라인 사이의 영역 채우기 데이터 추가
      if (
        fillBetween &&
        dataPoint[fillBetween[0]] !== undefined &&
        dataPoint[fillBetween[1]] !== undefined
      ) {
        // [min, max] 형태로 배열 저장. (정렬하지 않아도 recharts가 아래부터 위로 채움)
        dataPoint['fillArea'] = [
          dataPoint[fillBetween[0]],
          dataPoint[fillBetween[1]],
        ];
      }

      return dataPoint;
    });
  };

  const chartData = prepareChartData();
  const usesPercentUnit = seriesWithColors.some(
    (series) => series.unit === 'percent',
  );

  // 차트 도메인 계산
  const calculateYDomain = () => {
    if (chartData.length === 0) return [0, 100];

    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = Number.NEGATIVE_INFINITY;

    chartData.forEach((dataPoint) => {
      // 각 시리즈의 값 확인
      activeSeriesData.forEach((series) => {
        if (dataPoint[series.id] !== undefined) {
          minValue = Math.min(minValue, dataPoint[series.id]);
          maxValue = Math.max(maxValue, dataPoint[series.id]);
        }
      });
    });

    // 무한대 값 처리
    if (minValue === Number.POSITIVE_INFINITY) minValue = 0;
    if (maxValue === Number.NEGATIVE_INFINITY) maxValue = 100;

    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 100;

    // 로그 스케일을 위한 도메인 조정 (0이나 음수 방지)
    if (useLogScale) {
      const minLogValue = safeMin <= 0 ? 0.1 : safeMin; // Ensure min is positive for log scale
      // Ensure max value is greater than minLogValue for log scale
      const adjustedMaxValue =
        safeMax <= minLogValue ? minLogValue + 1 : safeMax * 1.1;
      return [minLogValue, adjustedMaxValue];
    }

    if (usesPercentUnit) {
      const padding = Math.max((safeMax - safeMin) * 0.1, 1);
      return [
        safeMin < 0 ? safeMin - padding : Math.min(0, safeMin - padding),
        safeMax > 0 ? safeMax + padding : Math.max(0, safeMax + padding),
      ];
    }

    return [safeMin < 0 ? safeMin * 1.1 : 0, safeMax * 1.1];
  };

  const yDomain = calculateYDomain();

  // X축 포맷터 - 시간 범위에 따라 다른 형식 사용
  const getXAxisTickFormatter = (): ((dateStr: string) => string) => {
    switch (timeRange) {
      case '1w':
        return (dateStr) => format(parseISO(dateStr), 'M/d', { locale: ko });
      case '1m':
        return (dateStr) => format(parseISO(dateStr), 'M/d', { locale: ko });
      case '3m':
      case '6m':
        return (dateStr) =>
          format(parseISO(dateStr), 'M월 d일', { locale: ko });
      case 'ytd':
      case '1y':
        return (dateStr) => format(parseISO(dateStr), 'M월', { locale: ko });
      case 'custom':
        return (dateStr) => format(parseISO(dateStr), 'yy.M.d', { locale: ko });
      default:
        return (dateStr) => format(parseISO(dateStr), 'yyyy', { locale: ko });
    }
  };

  const formatPickerDate = (date?: Date) =>
    date ? format(date, 'yyyy.MM.dd', { locale: ko }) : '날짜 선택';
  const calendarButtonHoverColor = themeColor.includes('-theme)')
    ? themeColor.replace('-theme)', '-hover-bg)')
    : `color-mix(in oklch, ${themeColor} 12%, transparent)`;
  const calendarButtonStyle = {
    '--chart-calendar-theme': themeColor,
    '--chart-calendar-hover': calendarButtonHoverColor,
    borderColor: 'var(--chart-calendar-theme)',
    color: 'var(--chart-calendar-theme)',
  } as React.CSSProperties;

  const handleCustomStartDateSelect = (date: Date) => {
    setCustomStartDate(date);
    if (customEndDate && date > customEndDate) {
      setCustomEndDate(date);
    }
    setTimeRange('custom');
    setStartPickerOpen(false);
  };

  const handleCustomEndDateSelect = (date: Date) => {
    setCustomEndDate(date);
    if (customStartDate && date < customStartDate) {
      setCustomStartDate(date);
    }
    setTimeRange('custom');
    setEndPickerOpen(false);
  };

  // 시리즈 토글 핸들러
  const toggleSeries = (seriesId: string) => {
    setActiveSeries((prev) => {
      if (prev.includes(seriesId)) {
        return prev.filter((id) => id !== seriesId);
      } else {
        return [...prev, seriesId];
      }
    });
  };

  const toggleSeriesGroup = (seriesIds: string[]) => {
    setActiveSeries((prev) => {
      const isGroupActive = seriesIds.every((id) => prev.includes(id));

      if (isGroupActive) {
        return prev.filter((id) => !seriesIds.includes(id));
      }

      return Array.from(new Set([...prev, ...seriesIds]));
    });
  };

  const groupedSeriesIds = new Set(
    seriesToggleGroups.flatMap((group) => group.seriesIds),
  );
  const toggleButtonSeries: SeriesInfo[] = [
    ...seriesWithColors
      .filter((series) => !groupedSeriesIds.has(series.id))
      .map((series) => ({
        id: series.id,
        name: series.name,
        color: series.color,
      })),
    ...seriesToggleGroups.map((group) => {
      const firstSeries = seriesWithColors.find((series) =>
        group.seriesIds.includes(series.id),
      );

      return {
        id: group.id,
        name: group.name,
        color: group.color ?? firstSeries?.color ?? DEFAULT_COLORS[0],
      };
    }),
  ];
  const activeToggleSeries = [
    ...activeSeries.filter((id) => !groupedSeriesIds.has(id)),
    ...seriesToggleGroups
      .filter((group) => group.seriesIds.every((id) => activeSeries.includes(id)))
      .map((group) => group.id),
  ];
  const handleToggleButtonClick = (id: string) => {
    const group = seriesToggleGroups.find((group) => group.id === id);

    if (group) {
      toggleSeriesGroup(group.seriesIds);
      return;
    }

    toggleSeries(id);
  };

  // 시간 범위에 따른 틱 개수 결정
  const getTickCountByTimeRange = () => {
    switch (timeRange) {
      case '1w':
        return 7; // 매일
      case '1m':
        return 8; // 약 4일마다
      case '3m':
        return 6; // 약 2주마다
      case '6m':
        return 6; // 약 1개월마다
      case '1y':
      case 'ytd':
        return 6; // 약 2개월마다
      case '3y':
        return 6; // 약 6개월마다
      case '5y':
        return 5; // 약 1년마다
      case '10y':
        return 5; // 약 2년마다
      case 'all':
        return 8; // 적절한 간격
      default:
        return 6;
    }
  };

  // X축 틱 계산 - 중복 방지
  const calculateXAxisTicks = useMemo(() => {
    if (chartData.length === 0) return [];

    const tickCount = getTickCountByTimeRange();
    const step = Math.max(1, Math.floor(chartData.length / tickCount));

    // 시간 범위에 따라 적절한 간격으로 틱 선택
    const ticks: string[] = [];
    let lastFormattedTick = '';

    for (let i = 0; i < chartData.length; i += step) {
      const date = chartData[i].date;
      const formattedTick = getXAxisTickFormatter()(date);

      // 중복 방지: 이전 틱과 다른 경우에만 추가
      if (formattedTick !== lastFormattedTick) {
        ticks.push(date);
        lastFormattedTick = formattedTick;
      }
    }

    // 마지막 데이터 포인트가 포함되어 있지 않으면 추가
    const lastDate = chartData[chartData.length - 1].date;
    const lastFormattedDate = getXAxisTickFormatter()(lastDate);

    if (lastFormattedDate !== lastFormattedTick) {
      ticks.push(lastDate);
    }

    return ticks;
  }, [chartData, timeRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formattedLabel = label
        ? format(parseISO(label), 'yyyy년 M월 d일', { locale: ko })
        : '';

      return (
        <div
          className="glassmorphism-tooltip"
        >
          <p className="text-center font-bold text-base mb-2">
            {formattedLabel}
          </p>
          <hr className="border-border my-1" />
          <div className="space-y-1 mt-2">
            {payload.map((pld: any, index: number) => {
              if (pld.name === 'fillArea') return null;

              const series = seriesWithColors.find((s) => s.id === pld.name);
              const seriesName = series ? series.name : pld.name;
              const seriesColor = series ? series.color : '#8884d8';

              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center">
                    <div
                      className="w-2.5 h-2.5 rounded-full mr-2"
                      style={{ backgroundColor: seriesColor }}
                    />
                    <span>{seriesName}</span>
                  </div>
                  <span className="font-semibold ml-4">
                    {series?.unit === 'percent'
                      ? `${(pld.value as number).toFixed(2)}%`
                      : new Intl.NumberFormat('ko-KR', {
                        style: 'currency',
                        currency: 'KRW',
                        maximumFractionDigits: 0,
                      }).format(pld.value as number)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  // 시리즈가 없을 경우 안내 메시지 표시
  if (series.length === 0) {
    return (
      <Card className="w-full glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {Icon ? (
              <Icon style={{ color: themeColor }} className="h-5 w-5" />
            ) : (
              <TrendingUp style={{ color: themeColor }} className="h-5 w-5" />
            )}
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[18.75rem]">
          <p className="text-muted-foreground">
            데이터가 없습니다. 자산 데이터를 추가해주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full glass-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {Icon ? (
                <Icon style={{ color: themeColor }} className="h-5 w-5" />
              ) : (
                <TrendingUp style={{ color: themeColor }} className="h-5 w-5" />
              )}
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-4 pt-1">
            {(showLogScaleToggle === undefined || showLogScaleToggle) && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="log-scale"
                  checked={useLogScale}
                  onCheckedChange={setUseLogScale}
                  style={{ '--switch-bg': themeColor } as React.CSSProperties}
                />
                <Label htmlFor="log-scale" className="text-sm font-medium">
                  로그 스케일
                </Label>
              </div>
            )}
            {(showInflationAdjustToggle === undefined ||
              showInflationAdjustToggle) && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="inflation-adjust"
                    checked={adjustForInflation}
                    onCheckedChange={setAdjustForInflation}
                    style={{ '--switch-bg': themeColor } as React.CSSProperties}
                  />
                  <Label htmlFor="inflation-adjust" className="text-sm font-medium">
                    인플레이션 보정
                  </Label>
                </div>
              )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              defaultValue="all"
              value={timeRange}
              onValueChange={setTimeRange}
              className="w-full"
              style={
                { '--active-tab-color': themeColor } as React.CSSProperties
              }
            >
              <TabsList className="grid w-full grid-cols-10 bg-white/10 border border-white/15 rounded-lg shadow-sm backdrop-blur-xs">
                <TabsTrigger value="1m" className="rounded-md text-xs font-semibold">
                  1개월
                </TabsTrigger>
                <TabsTrigger value="3m" className="rounded-md text-xs font-semibold">
                  3개월
                </TabsTrigger>
                <TabsTrigger value="6m" className="rounded-md text-xs font-semibold">
                  6개월
                </TabsTrigger>
                <TabsTrigger value="ytd" className="rounded-md text-xs font-semibold">
                  YTD
                </TabsTrigger>
                <TabsTrigger value="1y" className="rounded-md text-xs font-semibold">
                  1년
                </TabsTrigger>
                <TabsTrigger value="3y" className="rounded-md text-xs font-semibold">
                  3년
                </TabsTrigger>
                <TabsTrigger value="5y" className="rounded-md text-xs font-semibold">
                  5년
                </TabsTrigger>
                <TabsTrigger value="10y" className="rounded-md text-xs font-semibold">
                  10년
                </TabsTrigger>
                <TabsTrigger value="all" className="rounded-md text-xs font-semibold">
                  전체
                </TabsTrigger>
                <TabsTrigger value="custom" className="rounded-md text-xs font-semibold">
                  직접 설정
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {timeRange === 'custom' && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Popover open={startPickerOpen} onOpenChange={setStartPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-w-[8.75rem] justify-start hover:bg-[var(--chart-calendar-hover)] hover:text-[var(--chart-calendar-theme)]"
                    style={calendarButtonStyle}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {formatPickerDate(customStartDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <CalendarPicker
                    selectedDate={customStartDate}
                    onDateSelect={handleCustomStartDateSelect}
                    minDate={availableDateRange.minDate}
                    maxDate={customEndDate ?? availableDateRange.maxDate}
                    category={calendarCategory}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-sm text-muted-foreground">-</span>
              <Popover open={endPickerOpen} onOpenChange={setEndPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-w-[8.75rem] justify-start hover:bg-[var(--chart-calendar-hover)] hover:text-[var(--chart-calendar-theme)]"
                    style={calendarButtonStyle}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {formatPickerDate(customEndDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <CalendarPicker
                    selectedDate={customEndDate}
                    onDateSelect={handleCustomEndDateSelect}
                    minDate={customStartDate ?? availableDateRange.minDate}
                    maxDate={availableDateRange.maxDate}
                    category={calendarCategory}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={getXAxisTickFormatter()}
                  type="category"
                  ticks={calculateXAxisTicks}
                  interval={0}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  axisLine={false}
                  fontSize={12}
                  scale={useLogScale ? 'log' : 'linear'}
                  domain={yDomain}
                  tickFormatter={(value) =>
                    usesPercentUnit
                      ? `${Number(value).toFixed(1)}%`
                      : new Intl.NumberFormat('ko-KR', {
                          notation: 'compact',
                          compactDisplay: 'short',
                          maximumFractionDigits: 1,
                        }).format(value)
                  }
                  reversed={reverseYAxis}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* 각 시리즈별 라인 */}
                {activeSeriesData.map((series) => (
                  <Area
                    key={series.id}
                    type="monotone"
                    dataKey={series.id}
                    name={series.id}
                    stroke={series.color}
                    fill={series.color}
                    fillOpacity={0.3}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                      stroke: series.color,
                      strokeWidth: 2,
                      fill: series.color,
                    }}
                  />
                ))}
              </AreaChart>
            ) : (
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={getXAxisTickFormatter()}
                  type="category"
                  ticks={calculateXAxisTicks}
                  interval={0}
                  axisLine={false}
                />
                <YAxis
                  scale={useLogScale ? 'log' : 'linear'}
                  domain={yDomain}
                  tickFormatter={(value) =>
                    usesPercentUnit
                      ? `${Number(value).toFixed(1)}%`
                      : new Intl.NumberFormat('ko-KR', {
                          notation: 'compact',
                          compactDisplay: 'short',
                          maximumFractionDigits: 1,
                        }).format(value)
                  }
                  reversed={reverseYAxis}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* 두 라인 사이의 영역 채우기 */}
                {fillBetween &&
                  activeSeries.includes(fillBetween[0]) &&
                  activeSeries.includes(fillBetween[1]) && (
                    <Area
                      type="monotone"
                      dataKey="fillArea"
                      name="fillArea"
                      fill={
                        activeSeriesData.find((s) => s.id === fillBetween[1])
                          ?.color || '#FF9800'
                      }
                      fillOpacity={0.15}
                      stroke="none"
                      activeDot={false}
                      isAnimationActive={false}
                    />
                  )}

                {/* 각 시리즈별 라인 */}
                {activeSeriesData.map((series) => (
                  <Line
                    key={series.id}
                    type="monotone"
                    dataKey={series.id}
                    name={series.id}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                      stroke: series.color,
                      strokeWidth: 2,
                      fill: series.color,
                    }}
                  />
                ))}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* 시리즈 선택 토글 */}
        <SeriesToggleButtons
          series={toggleButtonSeries}
          activeSeries={activeToggleSeries}
          onToggle={handleToggleButtonClick}
          className="mt-4"
        />
      </CardContent>
    </Card>
  );
}
