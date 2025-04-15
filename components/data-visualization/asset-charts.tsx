'use client';

import { useState } from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

// 샘플 데이터 - 실제 데이터는 이 형식으로 제공될 것입니다
const sampleData = [
  {
    date: '2024-03-21',
    value: 244594339,
  },
  {
    date: '2024-03-22',
    value: 246554339,
  },
  // 실제 구현 시 더 많은 데이터가 여기에 들어갈 것입니다
];

// 더 많은 샘플 데이터 생성 (테스트용)
const generateSampleData = () => {
  const data = [];
  const endDate = new Date('2024-03-22');
  let currentValue = 246554339;

  // 최근 1년치 데이터 생성
  for (let i = 364; i >= 0; i--) {
    const currentDate = subDays(endDate, i);
    // 약간의 변동성 추가 (0.995 ~ 1.005 사이의 랜덤 변동)
    const randomFactor = 0.995 + Math.random() * 0.01;

    // 전날 데이터가 있으면 그 값에서 변동, 없으면 초기값에서 시작
    if (i < 364) {
      currentValue = Math.round(currentValue * randomFactor);
    } else {
      // 첫 데이터는 현재의 약 70%로 시작
      currentValue = Math.round(currentValue * 0.7);
    }

    data.push({
      date: format(currentDate, 'yyyy-MM-dd'),
      value: currentValue,
    });
  }

  // 이전 연도 데이터 생성 (월별 데이터로 간소화)
  let previousDate = subYears(endDate, 1);
  for (let year = 1; year <= 9; year++) {
    for (let month = 11; month >= 0; month--) {
      previousDate = new Date(endDate.getFullYear() - year, month, 15);

      // 시간이 지날수록 자산이 감소하도록 (과거로 갈수록)
      const yearFactor = 0.85 + (0.15 * (10 - year)) / 10; // 0.85 ~ 1.0
      currentValue = Math.round(currentValue * yearFactor);

      data.push({
        date: format(previousDate, 'yyyy-MM-dd'),
        value: currentValue,
      });
    }
  }

  // 날짜순으로 정렬
  return data.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
};

// 실제 데이터가 충분하지 않을 경우 샘플 데이터로 보충
const rawAssetData = generateSampleData();

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

export default function AssetChart() {
  const [useLogScale, setUseLogScale] = useState(false);
  const [adjustForInflation, setAdjustForInflation] = useState(false);
  const [timeRange, setTimeRange] = useState('all');

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

  // 데이터 처리
  const processedData = rawAssetData.map((item) => {
    const adjustedValue = adjustForInflation
      ? adjustValueForInflation(item.value, item.date)
      : item.value;

    return {
      date: item.date,
      parsedDate: parseISO(item.date), // 날짜 문자열을 Date 객체로 변환
      value: item.value,
      adjustedValue: adjustedValue,
      displayValue: adjustForInflation ? adjustedValue : item.value,
    };
  });

  // 시간 범위에 따른 데이터 필터링
  const filteredData = (() => {
    if (timeRange === 'all') return processedData;

    const now = new Date(); // 현재 날짜 사용
    const latestDataDate =
      processedData.length > 0
        ? processedData[processedData.length - 1].parsedDate
        : now;

    let cutoffDate;
    switch (timeRange) {
      case '1w':
        cutoffDate = subDays(latestDataDate, 7);
        break;
      case '1m':
        cutoffDate = subMonths(latestDataDate, 1);
        break;
      case '3m':
        cutoffDate = subMonths(latestDataDate, 3);
        break;
      case '6m':
        cutoffDate = subMonths(latestDataDate, 6);
        break;
      case '1y':
        cutoffDate = subYears(latestDataDate, 1);
        break;
      case 'ytd':
        cutoffDate = startOfYear(latestDataDate);
        break;
      case '2y':
        cutoffDate = subYears(latestDataDate, 2);
        break;
      case '3y':
        cutoffDate = subYears(latestDataDate, 3);
        break;
      case '5y':
        cutoffDate = subYears(latestDataDate, 5);
        break;
      case '10y':
        cutoffDate = subYears(latestDataDate, 10);
        break;
      default:
        return processedData;
    }

    return processedData.filter((item) => item.parsedDate >= cutoffDate);
  })();

  // 차트 도메인 계산
  const minValue = Math.min(...filteredData.map((d) => d.displayValue));
  const maxValue = Math.max(...filteredData.map((d) => d.displayValue));

  // 로그 스케일을 위한 도메인 조정 (0이나 음수 방지)
  const yDomain = useLogScale
    ? [Math.max(minValue, 1), maxValue * 1.1]
    : [0, maxValue * 1.1];

  // 수익률 및 수익금 계산
  const calculateReturns = () => {
    if (filteredData.length < 2) return { percentReturn: 0, absoluteReturn: 0 };

    const initialValue = filteredData[0].displayValue;
    const currentValue = filteredData[filteredData.length - 1].displayValue;

    const absoluteReturn = currentValue - initialValue;
    const percentReturn = (absoluteReturn / initialValue) * 100;

    return {
      percentReturn,
      absoluteReturn,
    };
  };

  const { percentReturn, absoluteReturn } = calculateReturns();
  const isPositiveReturn = percentReturn >= 0;

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

  // 툴팁 라벨 포맷터 - 시간 범위에 따라 다른 형식 사용
  const getTooltipLabelFormatter = () => {
    return (dateStr) =>
      format(parseISO(dateStr), 'yyyy년 M월 d일', { locale: ko });
  };

  // 데이터 포인트 간격 조정 - 시간 범위에 따라 다르게 표시
  const getDataPointInterval = () => {
    if (filteredData.length <= 30) return 1; // 데이터가 적으면 모든 포인트 표시

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
    return index % interval === 0 || index === filteredData.length - 1; // 마지막 포인트는 항상 표시
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          자산 내역 차트
        </CardTitle>
        <CardDescription>
          {adjustForInflation ? '인플레이션 조정 적용됨' : '실제 금액 기준'}
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

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">수익률:</span>
                <span
                  className={cn(
                    'flex items-center font-semibold',
                    isPositiveReturn ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {isPositiveReturn ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {percentReturn.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">수익금:</span>
                <span
                  className={cn(
                    'font-semibold',
                    isPositiveReturn ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {new Intl.NumberFormat('ko-KR', {
                    style: 'currency',
                    currency: 'KRW',
                    maximumFractionDigits: 0,
                  }).format(absoluteReturn)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
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
                formatter={(value) =>
                  new Intl.NumberFormat('ko-KR', {
                    style: 'currency',
                    currency: 'KRW',
                    maximumFractionDigits: 0,
                  }).format(Number(value))
                }
                labelFormatter={getTooltipLabelFormatter()}
              />
              <Line
                type="monotone"
                dataKey="displayValue"
                stroke="#6366f1"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, index } = props;
                  return shouldShowDot(index) ? (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="#6366f1"
                      stroke="#6366f1"
                    />
                  ) : null;
                }}
                activeDot={{
                  r: 6,
                  stroke: '#6366f1',
                  strokeWidth: 2,
                  fill: '#6366f1',
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <DollarSign className="mr-1 h-4 w-4" />
            <span>
              현재 자산:{' '}
              {new Intl.NumberFormat('ko-KR', {
                style: 'currency',
                currency: 'KRW',
                maximumFractionDigits: 0,
              }).format(
                filteredData[filteredData.length - 1]?.displayValue || 0
              )}
            </span>
          </div>
          <div className="flex items-center">
            <span>
              초기 자산:{' '}
              {new Intl.NumberFormat('ko-KR', {
                style: 'currency',
                currency: 'KRW',
                maximumFractionDigits: 0,
              }).format(filteredData[0]?.displayValue || 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
