import type { YearPerformanceProps } from '@/types';

export type YearPerformanceState = {
  startProfit: number;
  startNetProfit: number;
  currentYear: YearPerformanceProps;
  currentNetYear: YearPerformanceProps;
};

type UpdateYearPerformanceInput = {
  yearPerformanceMap: Map<string, YearPerformanceState>;
  date: string;
  profit: number;
  netProfit: number;
};

type YearPerformanceSummary = {
  bestYear: YearPerformanceProps;
  worstYear: YearPerformanceProps;
  netBestYear: YearPerformanceProps;
  netWorstYear: YearPerformanceProps;
  yearlyProfits: YearPerformanceProps[];
  netYearlyProfits: YearPerformanceProps[];
};

const emptyYearPerformance = (): YearPerformanceProps => ({
  year: '-',
  profit: 0,
});

const createYearPerformanceState = (
  profit: number,
  netProfit: number,
): YearPerformanceState => ({
  startProfit: profit,
  startNetProfit: netProfit,
  currentYear: emptyYearPerformance(),
  currentNetYear: emptyYearPerformance(),
});

const pickBestYear = (
  current: YearPerformanceProps,
  next: YearPerformanceProps,
): YearPerformanceProps =>
  current.year === '-' || next.profit > current.profit ? next : current;

const pickWorstYear = (
  current: YearPerformanceProps,
  next: YearPerformanceProps,
): YearPerformanceProps =>
  current.year === '-' || next.profit < current.profit ? next : current;

export const updateYearPerformance = ({
  yearPerformanceMap,
  date,
  profit,
  netProfit,
}: UpdateYearPerformanceInput): YearPerformanceSummary => {
  const year = date.slice(0, 4);
  let yearPerformance = yearPerformanceMap.get(year);

  if (!yearPerformance) {
    yearPerformance = createYearPerformanceState(profit, netProfit);
    yearPerformanceMap.set(year, yearPerformance);
  }

  yearPerformance.currentYear = {
    year,
    profit: profit - yearPerformance.startProfit,
  };
  yearPerformance.currentNetYear = {
    year,
    profit: netProfit - yearPerformance.startNetProfit,
  };

  const yearPerformances = Array.from(yearPerformanceMap.values());

  return {
    bestYear: yearPerformances.reduce(
      (best, current) => pickBestYear(best, current.currentYear),
      emptyYearPerformance(),
    ),
    worstYear: yearPerformances.reduce(
      (worst, current) => pickWorstYear(worst, current.currentYear),
      emptyYearPerformance(),
    ),
    netBestYear: yearPerformances.reduce(
      (best, current) => pickBestYear(best, current.currentNetYear),
      emptyYearPerformance(),
    ),
    netWorstYear: yearPerformances.reduce(
      (worst, current) => pickWorstYear(worst, current.currentNetYear),
      emptyYearPerformance(),
    ),
    yearlyProfits: Array.from(yearPerformanceMap.entries()).map(
      ([yearKey, current]) => ({
        year: yearKey,
        profit:
          current.currentYear.year === '-' ? 0 : current.currentYear.profit,
      }),
    ),
    netYearlyProfits: Array.from(yearPerformanceMap.entries()).map(
      ([yearKey, current]) => ({
        year: yearKey,
        profit:
          current.currentNetYear.year === '-'
            ? 0
            : current.currentNetYear.profit,
      }),
    ),
  };
};
