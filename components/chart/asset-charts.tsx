'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  addDays,
  addMonths,
  addYears,
  subDays,
  subMonths,
  subYears,
  startOfYear,
} from 'date-fns';
import { scaleSymlog } from 'd3-scale';
import { ko } from 'date-fns/locale';
import { CalendarDays, TrendingUp } from 'lucide-react';

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
import { inflationRates } from '@/constants/keywords';
import { useCurrencyStore } from '@/store/options';
import { Button } from '../ui/button';
import { SeriesToggleButtons, SeriesInfo } from '../ui/series-toggle-buttons';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarPicker } from '../ui/calendar-picker';
import { formatCompactCurrency } from '@/utils/format';

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

type ChartDataPoint = {
  date: string;
  fillArea?: [number, number];
} & Record<string, string | number | [number, number] | undefined>;

type TooltipPayloadItem = {
  name: string;
  value: number;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
};

interface AssetSeries {
  id: string;
  name: string;
  color?: string;
  data: AssetDataPoint[];
  unit?: 'currency' | 'percent' | 'number';
  zIndex?: number;
}

interface SeriesToggleGroup {
  id: string;
  name: string;
  color?: string;
  seriesIds: string[];
  showActiveBackground?: boolean;
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
  displayAsNegative?: boolean;
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
  displayAsNegative = false,
}: AssetHistoryChartProps) {
  const [useLogScale, setUseLogScale] = useState(false);
  const [adjustForInflation, setAdjustForInflation] = useState(false);
  const [timeRange, setTimeRange] = useState('all');
  const [activeSeries, setActiveSeries] = useState<string[]>([]);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const currency = useCurrencyStore((state) => state.currency);

  // 시리즈에 색상 할당
  const seriesWithColors = useMemo(
    () =>
      series.map((s, index) => ({
        ...s,
        color: s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      })),
    [series],
  );

  // 컴포넌트 마운트 시 모든 시리즈 활성화
  useEffect(() => {
    setActiveSeries(seriesWithColors.map((s) => s.id));
  }, [seriesWithColors]);

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
      Math.max(...data.map((item) => item.parsedDate.getTime())),
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
    activeSeries.includes(series.id),
  );
  const renderedSeriesData = [...activeSeriesData].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0),
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
      const dataPoint: ChartDataPoint = { date };

      // 각 시리즈의 값 추가
      activeSeriesData.forEach((series) => {
        const seriesDataPoint = series.filteredData.find(
          (item) => item.date === date,
        );
        if (seriesDataPoint) {
          dataPoint[series.id] = seriesDataPoint.displayValue;
        }
      });

      // 두 라인 사이의 영역 채우기 데이터 추가
      if (fillBetween) {
        const bottomValue = dataPoint[fillBetween[0]];
        const topValue = dataPoint[fillBetween[1]];

        if (typeof bottomValue === 'number' && typeof topValue === 'number') {
          // [min, max] 형태로 배열 저장. (정렬하지 않아도 recharts가 아래부터 위로 채움)
          dataPoint['fillArea'] = [bottomValue, topValue];
        }
      }

      return dataPoint;
    });
  };

  const chartData = prepareChartData();
  const hasNonPositiveValue = chartData.some((dataPoint) =>
    activeSeriesData.some((series) => {
      const value = dataPoint[series.id];
      return typeof value === 'number' && value <= 0;
    }),
  );
  const usesSymLogScale = useLogScale && hasNonPositiveValue;
  const usesPercentUnit = seriesWithColors.some(
    (series) => series.unit === 'percent',
  );
  const usesNumberUnit = seriesWithColors.some(
    (series) => series.unit === 'number',
  );

  const formatChartValue = (
    value: number,
    unit: AssetSeries['unit'] = 'currency',
  ) => {
    const displayValue = displayAsNegative ? -Math.abs(value) : value;

    if (unit === 'percent') {
      return `${displayValue.toFixed(2)}%`;
    }

    if (unit === 'number') {
      return displayValue.toFixed(2);
    }

    if (currency === 'usd') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(displayValue);
    }

    return `${new Intl.NumberFormat('ko-KR', {
      maximumFractionDigits: 0,
    }).format(displayValue)}원`;
  };

  const formatYAxisTick = (value: number) => {
    const displayValue = displayAsNegative
      ? -Math.abs(Number(value))
      : Number(value);

    if (usesPercentUnit) {
      return `${displayValue.toFixed(1)}%`;
    }

    if (usesNumberUnit) {
      return displayValue.toFixed(2);
    }

    if (currency === 'usd') {
      return formatCompactCurrency(displayValue, currency);
    }

    return formatCompactCurrency(displayValue, currency);
  };

  // 차트 도메인 계산
  const calculateYDomain = () => {
    if (chartData.length === 0) return [0, 100];

    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = Number.NEGATIVE_INFINITY;

    chartData.forEach((dataPoint) => {
      // 각 시리즈의 값 확인
      activeSeriesData.forEach((series) => {
        const value = dataPoint[series.id];

        if (typeof value === 'number') {
          minValue = Math.min(minValue, value);
          maxValue = Math.max(maxValue, value);
        }
      });
    });

    // 무한대 값 처리
    if (minValue === Number.POSITIVE_INFINITY) minValue = 0;
    if (maxValue === Number.NEGATIVE_INFINITY) maxValue = 100;

    const safeMin = Number.isFinite(minValue) ? minValue : 0;
    const safeMax = Number.isFinite(maxValue) ? maxValue : 100;

    if (usesSymLogScale) {
      const padding = Math.max((safeMax - safeMin) * 0.1, 1);
      return [safeMin - padding, safeMax + padding];
    }

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
  const maxAbsYDomain = Math.max(Math.abs(yDomain[0]), Math.abs(yDomain[1]));
  const symLogConstant = Math.max(maxAbsYDomain / 20, 1);
  const yScale = usesSymLogScale
    ? scaleSymlog().constant(symLogConstant)
    : useLogScale
      ? 'log'
      : 'linear';
  const logScaleDescription = useLogScale
    ? usesSymLogScale
      ? '0 이하 값이 있어 대칭 로그 스케일을 사용합니다. 0 부근은 차트 범위의 5%를 완충 구간으로 둡니다.'
      : '큰 값과 작은 값의 차이를 로그로 압축합니다.'
    : '';

  // X축 포맷터 - 시간 범위에 따라 다른 형식 사용
  const getXAxisTickFormatter = useCallback((): ((
    dateStr: string,
  ) => string) => {
    switch (timeRange) {
      case '1w':
        return (dateStr) => format(parseISO(dateStr), 'M/d', { locale: ko });
      case '1m':
        return (dateStr) => format(parseISO(dateStr), 'M/d', { locale: ko });
      case '3m':
      case '6m':
        return (dateStr) => format(parseISO(dateStr), 'M/d', { locale: ko });
      case 'ytd':
      case '1y':
        return (dateStr) => format(parseISO(dateStr), 'M월', { locale: ko });
      case 'custom':
        return (dateStr) => format(parseISO(dateStr), 'yy.M.d', { locale: ko });
      default:
        return (dateStr) => format(parseISO(dateStr), 'yyyy', { locale: ko });
    }
  }, [timeRange]);

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
        showActiveBackground: group.showActiveBackground,
      };
    }),
  ];
  const activeToggleSeries = [
    ...activeSeries.filter((id) => !groupedSeriesIds.has(id)),
    ...seriesToggleGroups
      .filter((group) =>
        group.seriesIds.every((id) => activeSeries.includes(id)),
      )
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

  // X축 틱 계산 - 데이터 인덱스가 아니라 실제 달력 간격을 기준으로 잡는다.
  const calculateXAxisTicks = useMemo(() => {
    if (chartData.length === 0) return [];

    const firstDataDate = chartData[0].date;
    const lastDataDate = chartData[chartData.length - 1].date;
    const firstDate = parseISO(firstDataDate);
    const lastDate = parseISO(lastDataDate);
    const pushUniqueTick = (ticks: string[], date: string) => {
      if (!ticks.includes(date)) ticks.push(date);
    };
    const findFirstDataOnOrAfter = (targetDate: Date) => {
      const targetTime = targetDate.getTime();
      return chartData.find(
        (item) => parseISO(item.date).getTime() >= targetTime,
      )?.date;
    };
    const findExactDateTick = (targetDate: Date) => {
      const targetDateString = format(targetDate, 'yyyy-MM-dd');
      return chartData.some((item) => item.date === targetDateString)
        ? targetDateString
        : undefined;
    };
    const findPeriodStartTick = (
      targetDate: Date,
      interval: 'month' | 'year',
      strict = false,
    ) => {
      const nextDate = findFirstDataOnOrAfter(targetDate);
      if (!nextDate) return undefined;

      const parsedDate = parseISO(nextDate);
      const isSamePeriod =
        interval === 'year'
          ? parsedDate.getFullYear() === targetDate.getFullYear()
          : parsedDate.getFullYear() === targetDate.getFullYear() &&
            parsedDate.getMonth() === targetDate.getMonth();

      if (!isSamePeriod) return undefined;

      if (strict) {
        return parsedDate.getTime() === targetDate.getTime()
          ? nextDate
          : undefined;
      }

      // 연도 라벨은 해당 연도 1분기 데이터까지 대표 tick으로 인정한다.
      if (interval === 'year') {
        return parsedDate.getMonth() <= 2 ? nextDate : undefined;
      }

      // 월 라벨은 월 후반부터 시작한 잘린 구간을 피하고, 월 초반 데이터만 쓴다.
      return parsedDate.getDate() <= 25 ? nextDate : undefined;
    };
    const buildCalendarTicks = (
      interval: 'day' | 'month' | 'year',
      step: number,
      includeLast = true,
      strictPeriodStart = false,
      strictExactDate = false,
    ) => {
      const ticks: string[] = interval === 'day' ? [firstDataDate] : [];
      let cursor =
        interval === 'day'
          ? addDays(firstDate, step)
          : interval === 'month'
            ? new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
            : startOfYear(firstDate);

      while (cursor <= lastDate) {
        const nextDate = strictExactDate
          ? findExactDateTick(cursor)
          : interval === 'year'
            ? findPeriodStartTick(cursor, 'year', strictPeriodStart)
            : interval === 'month'
              ? findPeriodStartTick(cursor, 'month', strictPeriodStart)
              : findFirstDataOnOrAfter(cursor);

        if (nextDate) {
          const formattedTick = getXAxisTickFormatter()(nextDate);
          const hasSameLabel = ticks.some(
            (tick) => getXAxisTickFormatter()(tick) === formattedTick,
          );

          if (!hasSameLabel) {
            pushUniqueTick(ticks, nextDate);
          }
        }

        cursor =
          interval === 'day'
            ? addDays(cursor, step)
            : interval === 'month'
              ? addMonths(cursor, step)
              : addYears(cursor, step);
      }

      if (
        includeLast &&
        interval !== 'year' &&
        !strictPeriodStart &&
        !strictExactDate
      ) {
        const lastFormattedTick = getXAxisTickFormatter()(lastDataDate);
        const hasSameLastLabel = ticks.some(
          (tick) => getXAxisTickFormatter()(tick) === lastFormattedTick,
        );

        if (!hasSameLastLabel) {
          pushUniqueTick(ticks, lastDataDate);
        }
      }

      return ticks;
    };

    if (timeRange === 'all') {
      const firstYear = firstDate.getFullYear();
      const lastYear = lastDate.getFullYear();
      const maxTickYear = Math.min(lastYear, new Date().getFullYear());
      const yearCount = maxTickYear - firstYear + 1;
      const yearStep = Math.max(1, Math.ceil(yearCount / 8));

      // 전체 기간은 데이터 인덱스가 아니라 연도 기준으로 X축을 고정한다.
      const ticks: string[] = [];

      for (let year = firstYear; year <= maxTickYear; year += yearStep) {
        const tickDate = findPeriodStartTick(new Date(year, 0, 1), 'year');

        if (tickDate) {
          ticks.push(tickDate);
        }
      }

      return ticks;
    }

    switch (timeRange) {
      case '1w':
        return buildCalendarTicks('day', 1);
      case '1m':
        return buildCalendarTicks('day', 5, true, false, true);
      case '3m':
        return buildCalendarTicks('day', 15, true, false, true);
      case '6m':
        return buildCalendarTicks('month', 1, true, true);
      case 'ytd':
      case '1y':
        return buildCalendarTicks('month', 1, true, true);
      case '3y':
      case '5y':
      case '10y':
        return buildCalendarTicks('year', 1);
      case 'custom': {
        const rangeDays = Math.max(
          1,
          Math.ceil(
            (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );

        if (rangeDays <= 45) return buildCalendarTicks('day', 7);
        if (rangeDays <= 120) return buildCalendarTicks('day', 15);
        if (rangeDays <= 730) return buildCalendarTicks('month', 1);
        if (rangeDays <= 1825) return buildCalendarTicks('month', 6);
        return buildCalendarTicks('month', 12);
      }
      default:
        return buildCalendarTicks('month', 1);
    }
  }, [chartData, getXAxisTickFormatter, timeRange]);

  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      const formattedLabel = label
        ? format(parseISO(label), 'yyyy년 M월 d일', { locale: ko })
        : '';

      return (
        <div className='liquid-glass-surface glassmorphism-tooltip'>
          <p className='text-center font-bold text-base mb-2'>
            {formattedLabel}
          </p>
          <hr className='border-border my-1' />
          <div className='space-y-1 mt-2'>
            {payload.map((pld, index) => {
              if (pld.name === 'fillArea') return null;

              const series = seriesWithColors.find((s) => s.id === pld.name);
              const seriesName = series ? series.name : pld.name;
              const seriesColor = series ? series.color : '#8884d8';

              return (
                <div
                  key={index}
                  className='flex items-center justify-between text-sm'
                >
                  <div className='flex items-center'>
                    <div
                      className='w-2.5 h-2.5 rounded-full mr-2'
                      style={{ backgroundColor: seriesColor }}
                    />
                    <span>{seriesName}</span>
                  </div>
                  <span className='font-semibold ml-4'>
                    {formatChartValue(pld.value as number, series?.unit)}
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
      <Card className='chart-card w-full glass-card'>
        <CardHeader>
          <CardTitle className='text-lg flex items-center gap-2'>
            {Icon ? (
              <Icon style={{ color: themeColor }} className='h-5 w-5' />
            ) : (
              <TrendingUp style={{ color: themeColor }} className='h-5 w-5' />
            )}
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[18.75rem]'>
          <p className='text-muted-foreground'>
            데이터가 없습니다. 자산 데이터를 추가해주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='chart-card w-full h-full glass-card flex flex-col'>
      <CardHeader>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center justify-between gap-4'>
            <CardTitle className='text-lg flex items-center gap-2'>
              {Icon ? (
                <Icon style={{ color: themeColor }} className='h-5 w-5' />
              ) : (
                <TrendingUp style={{ color: themeColor }} className='h-5 w-5' />
              )}
              {title}
            </CardTitle>
            <div className='flex shrink-0 items-center gap-4'>
              {(showLogScaleToggle === undefined || showLogScaleToggle) && (
                <div className='flex items-center space-x-2'>
                  <Switch
                    id='log-scale'
                    checked={useLogScale}
                    onCheckedChange={setUseLogScale}
                    style={{ '--switch-bg': themeColor } as React.CSSProperties}
                  />
                  <Label htmlFor='log-scale' className='text-sm font-medium'>
                    {usesSymLogScale ? '대칭 로그 스케일' : '로그 스케일'}
                  </Label>
                </div>
              )}
              {(showInflationAdjustToggle === undefined ||
                showInflationAdjustToggle) && (
                <div className='flex items-center space-x-2'>
                  <Switch
                    id='inflation-adjust'
                    checked={adjustForInflation}
                    onCheckedChange={setAdjustForInflation}
                    style={{ '--switch-bg': themeColor } as React.CSSProperties}
                  />
                  <Label
                    htmlFor='inflation-adjust'
                    className='text-sm font-medium'
                  >
                    인플레이션 보정
                  </Label>
                </div>
              )}
            </div>
          </div>
          {(description || logScaleDescription) && (
            <CardDescription>
              {[description, logScaleDescription].filter(Boolean).join(' ')}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col'>
        <div className='mb-4 flex flex-col gap-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Tabs
              defaultValue='all'
              value={timeRange}
              onValueChange={setTimeRange}
              className='w-full'
              style={
                { '--active-tab-color': themeColor } as React.CSSProperties
              }
            >
              <TabsList className='grid w-full grid-cols-10 bg-white/10 border border-white/15 rounded-lg shadow-sm backdrop-blur-xs'>
                <TabsTrigger
                  value='1m'
                  className='interactive-lift rounded-md text-xs font-semibold'
                >
                  1개월
                </TabsTrigger>
                <TabsTrigger
                  value='3m'
                  className='interactive-lift rounded-md text-xs font-semibold'
                >
                  3개월
                </TabsTrigger>
                <TabsTrigger
                  value='6m'
                  className='interactive-lift rounded-md text-xs font-semibold'
                >
                  6개월
                </TabsTrigger>
                <TabsTrigger
                  value='ytd'
                  className='interactive-lift rounded-md text-xs font-semibold'
                >
                  YTD
                </TabsTrigger>
                <TabsTrigger
                  value='1y'
                  className='interactive-lift rounded-md text-xs font-semibold'
                >
                  1년
                </TabsTrigger>
                <TabsTrigger
                  value='3y'
                  className='interactive-lift rounded-md text-xs font-semibold'
                >
                  3년
                </TabsTrigger>
                <TabsTrigger
                  value='5y'
                  className='interactive-lift rounded-md text-xs font-semibold'
                >
                  5년
                </TabsTrigger>
                <TabsTrigger
                  value='10y'
                  className='interactive-lift rounded-md text-xs font-semibold'
                >
                  10년
                </TabsTrigger>
                <TabsTrigger
                  value='all'
                  className='interactive-lift rounded-md text-xs font-semibold'
                >
                  전체
                </TabsTrigger>
                <TabsTrigger
                  value='custom'
                  className='interactive-lift rounded-md text-xs font-semibold'
                >
                  직접 설정
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {timeRange === 'custom' && (
            <div className='flex flex-wrap items-center justify-end gap-2'>
              <Popover open={startPickerOpen} onOpenChange={setStartPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='min-w-[8.75rem] justify-start hover:bg-[var(--chart-calendar-hover)] hover:text-[var(--chart-calendar-theme)]'
                    style={calendarButtonStyle}
                  >
                    <CalendarDays className='h-4 w-4' />
                    {formatPickerDate(customStartDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align='start' className='w-auto p-0'>
                  <CalendarPicker
                    selectedDate={customStartDate}
                    onDateSelect={handleCustomStartDateSelect}
                    minDate={availableDateRange.minDate}
                    maxDate={customEndDate ?? availableDateRange.maxDate}
                    category={calendarCategory}
                  />
                </PopoverContent>
              </Popover>
              <span className='text-sm text-muted-foreground'>-</span>
              <Popover open={endPickerOpen} onOpenChange={setEndPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='min-w-[8.75rem] justify-start hover:bg-[var(--chart-calendar-hover)] hover:text-[var(--chart-calendar-theme)]'
                    style={calendarButtonStyle}
                  >
                    <CalendarDays className='h-4 w-4' />
                    {formatPickerDate(customEndDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align='start' className='w-auto p-0'>
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

        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='date'
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={getXAxisTickFormatter()}
                  type='category'
                  ticks={calculateXAxisTicks}
                  interval={0}
                />
                <YAxis
                  axisLine={false}
                  fontSize={12}
                  scale={yScale}
                  domain={yDomain}
                  tickFormatter={formatYAxisTick}
                  reversed={reverseYAxis}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* 각 시리즈별 라인 */}
                {renderedSeriesData.map((series) => (
                  <Area
                    key={series.id}
                    type='monotone'
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
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='date'
                  tickFormatter={getXAxisTickFormatter()}
                  type='category'
                  ticks={calculateXAxisTicks}
                  interval={0}
                  axisLine={false}
                />
                <YAxis
                  scale={yScale}
                  domain={yDomain}
                  tickFormatter={formatYAxisTick}
                  reversed={reverseYAxis}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* 두 라인 사이의 영역 채우기 */}
                {fillBetween &&
                  activeSeries.includes(fillBetween[0]) &&
                  activeSeries.includes(fillBetween[1]) && (
                    <Area
                      type='monotone'
                      dataKey='fillArea'
                      name='fillArea'
                      fill={
                        activeSeriesData.find((s) => s.id === fillBetween[1])
                          ?.color || '#FF9800'
                      }
                      fillOpacity={0.15}
                      stroke='none'
                      activeDot={false}
                      isAnimationActive={false}
                    />
                  )}

                {/* 각 시리즈별 라인 */}
                {renderedSeriesData.map((series) => (
                  <Line
                    key={series.id}
                    type='monotone'
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
          className='mt-4'
        />
      </CardContent>
    </Card>
  );
}
