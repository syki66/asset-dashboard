'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useInterestRateStore } from '@/store/account';

type RateInputValue = number | string;

type MonthRate = {
  year: number;
  month: number;
  bestRate: RateInputValue;
  worstRate: RateInputValue;
  bestActive: boolean;
  worstActive: boolean;
};

interface InterestRatePanelProps {
  startYear?: number;
  className?: string;
}

const activeMonthButtonClass =
  'border-white/15 bg-[color:color-mix(in_oklch,var(--setup-primary,var(--primary))_8%,transparent)] text-foreground shadow-sm hover:bg-[color:color-mix(in_oklch,var(--setup-primary,var(--primary))_12%,transparent)]';
const inactiveMonthButtonClass =
  'border-white/10 bg-white/[0.03] text-muted-foreground opacity-50 hover:border-white/25';
const activeRateInputClass =
  'border-white/15 bg-white/[0.08] text-foreground shadow-sm backdrop-blur-md focus-visible:ring-ring/35';
const inactiveRateInputClass =
  'border-white/10 bg-white/[0.03] text-muted-foreground opacity-50 placeholder:text-[0.5625rem] placeholder:text-muted-foreground/70';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function toRateNumber(value: RateInputValue) {
  if (typeof value === 'number') return value;
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function isValidRateInput(value: string) {
  if (value === '' || value === '.') return true;
  if (!/^\d{0,2}(\.\d{0,2})?$/.test(value)) return false;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 && numberValue < 100;
}

function getMonthRange(
  startYear = 2000,
  endYear = new Date().getFullYear(),
  endMonth = new Date().getMonth() + 1
) {
  const months: { year: number; month: number }[] = [];

  // 최신 월부터 과거 월 순서로 만들어 최근 금리 입력을 먼저 보여줍니다.
  for (let year = endYear; year >= startYear; year--) {
    const maxMonth = year === endYear ? endMonth : 12;
    const minMonth = year === startYear ? 1 : 1;

    for (let month = maxMonth; month >= minMonth; month--) {
      months.push({ year, month });
    }
  }

  return months;
}

function defaultRateForMonth(
  year: number,
  month: number,
  scenario: 'best' | 'worst'
): number {
  // store에 저장된 월별 최상/최하 금리를 읽어 입력값의 초기값으로 사용합니다.
  const { bestInterestRates, worstInterestRates } =
    useInterestRateStore.getState();
  const rates = scenario === 'best' ? bestInterestRates : worstInterestRates;
  const rate = rates.find(
    (r) =>
      new Date(r.date).getFullYear() === year &&
      new Date(r.date).getMonth() + 1 === month
  );
  return rate ? rate.interestRate : 0;
}

function makeDefaults(months: { year: number; month: number }[]): MonthRate[] {
  return months.map(({ year, month }) => {
    // 같은 월에 대해 최상/최하 시나리오를 한 카드에서 함께 입력합니다.
    const bestRate = defaultRateForMonth(year, month, 'best');
    const worstRate = defaultRateForMonth(year, month, 'worst');
    return {
      year,
      month,
      bestRate,
      worstRate,
      bestActive: bestRate !== 0,
      worstActive: worstRate !== 0,
    };
  });
}

function groupByYear(rates: MonthRate[]): Record<number, MonthRate[]> {
  const grouped: Record<number, MonthRate[]> = {};

  for (const rate of rates) {
    if (!grouped[rate.year]) {
      grouped[rate.year] = [];
    }
    grouped[rate.year].push(rate);
  }

  // 펼쳐진 연도 안에서는 1월부터 12월 순서로 읽히게 정렬합니다.
  for (const year in grouped) {
    grouped[Number(year)].sort((a, b) => a.month - b.month);
  }

  return grouped;
}

function getYearStats(yearData: MonthRate[]) {
  if (!yearData || yearData.length === 0) {
    return { bestAvg: 0, worstAvg: 0, activeCount: 0 };
  }

  const bestActiveData = yearData.filter((d) => d.bestActive);
  const worstActiveData = yearData.filter((d) => d.worstActive);
  if (bestActiveData.length === 0 && worstActiveData.length === 0) {
    return { bestAvg: 0, worstAvg: 0, activeCount: 0 };
  }

  // 연도 요약에는 최상/최하 평균만 보여 복잡도를 줄입니다.
  const bestAvg =
    bestActiveData.length === 0
      ? 0
      : bestActiveData.reduce(
          (sum, rate) => sum + toRateNumber(rate.bestRate),
          0
        ) /
        bestActiveData.length;
  const worstAvg =
    worstActiveData.length === 0
      ? 0
      : worstActiveData.reduce(
          (sum, rate) => sum + toRateNumber(rate.worstRate),
          0
        ) /
        worstActiveData.length;

  return {
    bestAvg: round2(bestAvg),
    worstAvg: round2(worstAvg),
    activeCount: yearData.filter((d) => d.bestActive || d.worstActive).length,
  };
}

export function InterestRatePanel({
  startYear = 2000,
  className = '',
}: InterestRatePanelProps) {
  const months = useMemo(() => getMonthRange(startYear), [startYear]);
  const [rates, setRates] = useState<MonthRate[]>(() => makeDefaults(months));
  const [loading, setLoading] = useState(true);

  const setBestInterestRates = useInterestRateStore(
    (state) => state.setBestInterestRates
  );
  const setWorstInterestRates = useInterestRateStore(
    (state) => state.setWorstInterestRates
  );

  const groupedRates = useMemo(() => groupByYear(rates), [rates]);
  const years = useMemo(
    () =>
      Object.keys(groupedRates)
        .map(Number)
        .sort((a, b) => b - a),
    [groupedRates]
  );

  useEffect(() => {
    // startYear가 바뀌면 월 목록이 다시 만들어지므로 store 기준 초기값을 다시 채웁니다.
    setRates(makeDefaults(months));
    setLoading(false);
  }, [months]);

  // 월별 최상/최하 금리가 변경될 때마다 벤치마크 계산용 store에 반영합니다.
  useEffect(() => {
    const bestRates = rates
      .filter(({ bestActive }) => bestActive)
      .map(({ year, month, bestRate }) => ({
        date: `${year}-${month.toString().padStart(2, '0')}-01`,
        interestRate: toRateNumber(bestRate),
      }));
    const worstRates = rates
      .filter(({ worstActive }) => worstActive)
      .map(({ year, month, worstRate }) => ({
        date: `${year}-${month.toString().padStart(2, '0')}-01`,
        interestRate: toRateNumber(worstRate),
      }));
    setBestInterestRates(bestRates);
    setWorstInterestRates(worstRates);
  }, [rates, setBestInterestRates, setWorstInterestRates]);

  function updateRate(
    year: number,
    month: number,
    scenario: 'best' | 'worst',
    value: string
  ) {
    // 쉼표 소수점 입력도 허용해서 3,5처럼 입력해도 3.5로 처리합니다.
    const next = value.replace(',', '.');
    if (!isValidRateInput(next)) {
      // 금리는 0 이상 100 미만, 소수부는 둘째 자리까지만 허용합니다.
      return;
    }
    setRates((prev) =>
      prev.map((r) =>
        r.year === year && r.month === month
          ? {
              ...r,
              [scenario === 'best' ? 'bestRate' : 'worstRate']: next,
              [scenario === 'best' ? 'bestActive' : 'worstActive']:
                next !== '',
            }
          : r
      )
    );
  }

  function formatOnBlur(
    year: number,
    month: number,
    scenario: 'best' | 'worst'
  ) {
    setRates((prev) =>
      prev.map((r) =>
        r.year === year && r.month === month
          ? (() => {
              const currentValue =
                scenario === 'best' ? r.bestRate : r.worstRate;
              const formattedValue =
                currentValue === '' || currentValue === '.'
                  ? ''
                  : round2(Number(currentValue));

              return {
                ...r,
                [scenario === 'best' ? 'bestRate' : 'worstRate']:
                  formattedValue,
                [scenario === 'best' ? 'bestActive' : 'worstActive']:
                  formattedValue !== '',
              };
            })()
          : r
      )
    );
  }

  function toggleActive(year: number, month: number) {
    setRates((prev) =>
      prev.map((r) =>
        r.year === year && r.month === month
          ? {
              ...r,
              bestActive: !(r.bestActive || r.worstActive),
              worstActive: !(r.bestActive || r.worstActive),
              bestRate:
                r.bestActive || r.worstActive || r.bestRate !== ''
                  ? r.bestRate
                  : 0,
              worstRate:
                r.bestActive || r.worstActive || r.worstRate !== ''
                  ? r.worstRate
                  : 0,
            }
          : r
      )
    );
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/[0.05]" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Content */}
      <div className="space-y-4">
        {years.map((year) => {
          const yearData = groupedRates[year] || [];
          const stats = getYearStats(yearData);
          const monthColumns = Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            return yearData.find((rate) => rate.month === month) ?? null;
          });

          return (
            <div
              key={year}
              className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <h4 className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-base font-semibold text-foreground">
                  {year}년
                </h4>
                <div className="h-px flex-1 bg-white/15"></div>
                {stats.activeCount > 0 && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>활성 {stats.activeCount}개월</span>
                    <span>최상 평균 {stats.bestAvg}%</span>
                    <span>최하 평균 {stats.worstAvg}%</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-md">
                <div className="grid grid-cols-[2.75rem_repeat(12,minmax(0,1fr))] gap-1.5 text-[0.6875rem]">
                  <div />
                  {monthColumns.map((rate, index) => {
                    const month = index + 1;
                    const isMonthActive =
                      Boolean(rate?.bestActive) || Boolean(rate?.worstActive);

                    return rate ? (
                      <button
                        key={month}
                        type="button"
                        title={`${month}월 ${
                          isMonthActive ? '활성' : '비활성'
                        }`}
                        onClick={() => toggleActive(year, month)}
                        className={`interactive-lift liquid-glass-surface h-7 cursor-pointer rounded border text-center font-medium transition-all ${
                          isMonthActive
                            ? activeMonthButtonClass
                            : inactiveMonthButtonClass
                        }`}
                      >
                        {month}월
                      </button>
                    ) : (
                      <div
                        key={month}
                        className="h-7 rounded border border-transparent"
                        aria-hidden="true"
                      />
                    );
                  })}

                  <div className="flex h-7 items-center justify-end pr-1 font-medium text-muted-foreground">
                    최상
                  </div>
                  {monthColumns.map((rate, index) => {
                    const month = index + 1;

                    return rate ? (
                      <Input
                        key={`${year}-${month}-best`}
                        inputMode="decimal"
                        type="text"
                        value={rate.bestActive ? String(rate.bestRate) : ''}
                        aria-label={`${year}년 ${month}월 최상 금리`}
                        onChange={(e) =>
                          updateRate(year, month, 'best', e.target.value)
                        }
                        onBlur={() => formatOnBlur(year, month, 'best')}
                        className={`h-7 px-1 text-center text-[0.625rem] cursor-text ${
                          rate.bestActive
                            ? activeRateInputClass
                            : inactiveRateInputClass
                        }`}
                        placeholder="이월"
                      />
                    ) : (
                      <div key={`${year}-${month}-best`} aria-hidden="true" />
                    );
                  })}

                  <div className="flex h-7 items-center justify-end pr-1 font-medium text-muted-foreground">
                    최하
                  </div>
                  {monthColumns.map((rate, index) => {
                    const month = index + 1;

                    return rate ? (
                      <Input
                        key={`${year}-${month}-worst`}
                        inputMode="decimal"
                        type="text"
                        value={rate.worstActive ? String(rate.worstRate) : ''}
                        aria-label={`${year}년 ${month}월 최하 금리`}
                        onChange={(e) =>
                          updateRate(year, month, 'worst', e.target.value)
                        }
                        onBlur={() => formatOnBlur(year, month, 'worst')}
                        className={`h-7 px-1 text-center text-[0.625rem] cursor-text ${
                          rate.worstActive
                            ? activeRateInputClass
                            : inactiveRateInputClass
                        }`}
                        placeholder="이월"
                      />
                    ) : (
                      <div key={`${year}-${month}-worst`} aria-hidden="true" />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
