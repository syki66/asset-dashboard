'use client';

import { useState, useEffect } from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
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

// 차트 시리즈 타입 정의
interface AssetDataPoint {
  date: string;
  value: number;
}

interface AssetSeries {
  id: string;
  name: string;
  color?: string;
  data: AssetDataPoint[];
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

// 인플레이션 데이터 (연간 인플레이션율 %)
const inflationRates = {
  2014: 1.3,
  2015: 0.7,
  2016: 1.0,
  2017: 1.9,
  2018: 1.5,
  2019: 0.4,
  2020: 0.5,
  2021: 2.5,
  2022: 5.1,
  2023: 3.6,
  2024: 2.8, // 예상치
};

interface AssetHistoryChartProps {
  series: AssetSeries[];
  title?: string;
  description?: string;
}

export default function AssetChart({
  series = [],
  title = '자산 내역 차트',
  description = '',
}: AssetHistoryChartProps) {
  const [useLogScale, setUseLogScale] = useState(false);
  const [adjustForInflation, setAdjustForInflation] = useState(false);
  const [timeRange, setTimeRange] = useState('all');
  const [activeSeries, setActiveSeries] = useState<string[]>([]);
  const [showTotal, setShowTotal] = useState(true);

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
      if (inflationRates[y]) {
        adjustedValue = adjustedValue * (1 + inflationRates[y] / 100);
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

  // 시간 범위에 따른 데이터 필터링
  const getFilteredData = (data) => {
    if (timeRange === 'all') return data;
    if (data.length === 0) return [];

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
      case '1y':
        cutoffDate = subYears(latestDate, 1);
        break;
      case 'ytd':
        cutoffDate = startOfYear(latestDate);
        break;
      case '2y':
        cutoffDate = subYears(latestDate, 2);
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

  // 총합 데이터 계산
  const calculateTotalData = () => {
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

    // 각 날짜별로 모든 시리즈의 값을 합산
    return sortedDates.map((date) => {
      let totalValue = 0;

      activeSeriesData.forEach((series) => {
        const dataPoint = series.filteredData.find(
          (item) => item.date === date
        );
        if (dataPoint) {
          totalValue += dataPoint.displayValue;
        }
      });

      return {
        date,
        parsedDate: parseISO(date),
        displayValue: totalValue,
        totalValue,
      };
    });
  };

  const totalData = showTotal ? calculateTotalData() : [];

  // 차트 데이터 준비 - 모든 시리즈의 데이터를 날짜별로 병합
  const prepareChartData = () => {
    if (activeSeriesData.length === 0 && !showTotal) return [];

    // 모든 날짜 추출
    const allDates = new Set<string>();

    if (showTotal) {
      totalData.forEach((item) => allDates.add(item.date));
    }

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

      // 총합 값 추가
      if (showTotal) {
        const totalDataPoint = totalData.find((item) => item.date === date);
        if (totalDataPoint) {
          dataPoint.total = totalDataPoint.displayValue;
        }
      }

      return dataPoint;
    });
  };

  const chartData = prepareChartData();

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

      // 총합 값 확인
      if (showTotal && dataPoint.total !== undefined) {
        minValue = Math.min(minValue, dataPoint.total);
        maxValue = Math.max(maxValue, dataPoint.total);
      }
    });

    // 무한대 값 처리
    if (minValue === Number.POSITIVE_INFINITY) minValue = 0;
    if (maxValue === Number.NEGATIVE_INFINITY) maxValue = 100;

    // 로그 스케일을 위한 도메인 조정 (0이나 음수 방지)
    return useLogScale
      ? [Math.max(minValue, 1), maxValue * 1.1]
      : [0, maxValue * 1.1];
  };

  const yDomain = calculateYDomain();

  // 수익률 및 수익금 계산 - 각 시리즈별로 계산
  const calculateReturns = (data) => {
    if (!data || data.length < 2)
      return { percentReturn: 0, absoluteReturn: 0 };

    const initialValue = data[0].displayValue;
    const currentValue = data[data.length - 1].displayValue;

    const absoluteReturn = currentValue - initialValue;
    const percentReturn = (absoluteReturn / initialValue) * 100;

    return {
      percentReturn,
      absoluteReturn,
    };
  };

  // 총 수익률 계산
  const totalReturns =
    showTotal && totalData.length >= 2
      ? calculateReturns(totalData)
      : { percentReturn: 0, absoluteReturn: 0 };

  const isTotalPositiveReturn = totalReturns.percentReturn >= 0;

  // X축 포맷터 - 시간 범위에 따라 다른 형식 사용
  const getXAxisTickFormatter = () => {
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
      default:
        return (dateStr) => format(parseISO(dateStr), 'yyyy', { locale: ko });
    }
  };

  // 툴팁 라벨 포맷터
  const getTooltipLabelFormatter = () => {
    return (dateStr) =>
      format(parseISO(dateStr), 'yyyy년 M월 d일', { locale: ko });
  };

  // 데이터 포인트 간격 조정 - 시간 범위에 따라 다르게 표시
  const getDataPointInterval = () => {
    if (chartData.length <= 30) return 1; // 데이터가 적으면 모든 포인트 표시

    switch (timeRange) {
      case '1w':
        return 1; // 매일
      case '1m':
        return 2; // 2일마다
      case '3m':
        return 7; // 1주일마다
      case '6m':
        return 14; // 2주일마다
      case '1y':
      case 'ytd':
        return 30; // 1개월마다
      case '2y':
      case '3y':
        return 60; // 2개월마다
      case '5y':
        return 90; // 3개월마다
      case '10y':
      case 'all':
        return 180; // 6개월마다
      default:
        return 30;
    }
  };

  // 데이터 포인트 표시 여부 결정
  const shouldShowDot = (index) => {
    const interval = getDataPointInterval();
    return index % interval === 0 || index === chartData.length - 1; // 마지막 포인트는 항상 표시
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

  // 총합 토글 핸들러
  const toggleTotal = () => {
    setShowTotal((prev) => !prev);
  };

  // 시리즈가 없을 경우 안내 메시지 표시
  if (series.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">
            데이터가 없습니다. 자산 데이터를 추가해주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {description ||
            (adjustForInflation ? '인플레이션 조정 적용됨' : '실제 금액 기준')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              defaultValue="all"
              value={timeRange}
              onValueChange={setTimeRange}
              className="w-full"
            >
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="1w">1주일</TabsTrigger>
                <TabsTrigger value="1m">1개월</TabsTrigger>
                <TabsTrigger value="3m">3개월</TabsTrigger>
                <TabsTrigger value="6m">6개월</TabsTrigger>
                <TabsTrigger value="1y">1년</TabsTrigger>
                <TabsTrigger value="ytd">YTD</TabsTrigger>
                <TabsTrigger value="2y">2년</TabsTrigger>
                <TabsTrigger value="3y">3년</TabsTrigger>
                <TabsTrigger value="5y">5년</TabsTrigger>
                <TabsTrigger value="10y">10년</TabsTrigger>
                <TabsTrigger value="all">전체</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="log-scale"
                  checked={useLogScale}
                  onCheckedChange={setUseLogScale}
                />
                <Label htmlFor="log-scale">로그 스케일</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="inflation-adjust"
                  checked={adjustForInflation}
                  onCheckedChange={setAdjustForInflation}
                />
                <Label htmlFor="inflation-adjust">인플레이션 보정</Label>
              </div>
            </div>

            {showTotal && totalData.length >= 2 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">수익률:</span>
                  <span
                    className={cn(
                      'flex items-center font-semibold',
                      isTotalPositiveReturn ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {isTotalPositiveReturn ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {totalReturns.percentReturn.toFixed(2)}%
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">수익금:</span>
                  <span
                    className={cn(
                      'font-semibold',
                      isTotalPositiveReturn ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {new Intl.NumberFormat('ko-KR', {
                      style: 'currency',
                      currency: 'KRW',
                      maximumFractionDigits: 0,
                    }).format(totalReturns.absoluteReturn)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 시리즈 선택 체크박스 */}
          {seriesWithColors.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {seriesWithColors.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="total"
                    checked={showTotal}
                    onCheckedChange={toggleTotal}
                  />
                  <Label htmlFor="total" className="font-medium">
                    총합
                  </Label>
                </div>
              )}

              {seriesWithColors.map((series) => (
                <div key={series.id} className="flex items-center space-x-2">
                  <Switch
                    id={series.id}
                    checked={activeSeries.includes(series.id)}
                    onCheckedChange={() => toggleSeries(series.id)}
                  />
                  <Label
                    htmlFor={series.id}
                    className="font-medium"
                    style={{ color: series.color }}
                  >
                    {series.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={getXAxisTickFormatter()}
                type="category"
                domain={['dataMin', 'dataMax']}
                minTickGap={30} // 라벨 간 최소 간격 설정
              />
              <YAxis
                scale={useLogScale ? 'log' : 'linear'}
                domain={yDomain}
                tickFormatter={(value) =>
                  new Intl.NumberFormat('ko-KR', {
                    notation: 'compact',
                    compactDisplay: 'short',
                    maximumFractionDigits: 1,
                  }).format(value)
                }
              />
              <Tooltip
                formatter={(value, name) => {
                  // 시리즈 이름 한글화
                  const seriesName =
                    name === 'total'
                      ? '총합'
                      : seriesWithColors.find((s) => s.id === name)?.name ||
                        name;

                  return [
                    new Intl.NumberFormat('ko-KR', {
                      style: 'currency',
                      currency: 'KRW',
                      maximumFractionDigits: 0,
                    }).format(Number(value)),
                    seriesName,
                  ];
                }}
                labelFormatter={getTooltipLabelFormatter()}
              />
              <Legend
                formatter={(value) => {
                  // 시리즈 이름 한글화
                  return value === 'total'
                    ? '총합'
                    : seriesWithColors.find((s) => s.id === value)?.name ||
                        value;
                }}
              />

              {/* 각 시리즈별 라인 */}
              {activeSeriesData.map((series) => (
                <Line
                  key={series.id}
                  type="monotone"
                  dataKey={series.id}
                  name={series.id}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, index } = props;
                    return shouldShowDot(index) ? (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill={series.color}
                        stroke={series.color}
                      />
                    ) : null;
                  }}
                  activeDot={{
                    r: 6,
                    stroke: series.color,
                    strokeWidth: 2,
                    fill: series.color,
                  }}
                />
              ))}

              {/* 총합 라인 */}
              {showTotal && (
                <Line
                  type="monotone"
                  dataKey="total"
                  name="total"
                  stroke="#000000"
                  strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy, index } = props;
                    return shouldShowDot(index) ? (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#000000"
                        stroke="#000000"
                      />
                    ) : null;
                  }}
                  activeDot={{
                    r: 6,
                    stroke: '#000000',
                    strokeWidth: 2,
                    fill: '#000000',
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap justify-between text-sm text-muted-foreground gap-2">
          {showTotal && totalData.length > 0 && (
            <>
              <div className="flex items-center">
                <DollarSign className="mr-1 h-4 w-4" />
                <span>
                  현재 총자산:{' '}
                  {new Intl.NumberFormat('ko-KR', {
                    style: 'currency',
                    currency: 'KRW',
                    maximumFractionDigits: 0,
                  }).format(totalData[totalData.length - 1]?.displayValue || 0)}
                </span>
              </div>
              <div className="flex items-center">
                <span>
                  초기 총자산:{' '}
                  {new Intl.NumberFormat('ko-KR', {
                    style: 'currency',
                    currency: 'KRW',
                    maximumFractionDigits: 0,
                  }).format(totalData[0]?.displayValue || 0)}
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
