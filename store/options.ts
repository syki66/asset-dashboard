import { create } from 'zustand';

// 대시보드 표시 날짜 상태 관리
interface DashboardDateState {
  dashboardDate: Date;
  setDashboardDate: (date: Date) => void;
}

export const useDashboardDateStore = create<DashboardDateState>((set) => ({
  dashboardDate: new Date(),
  setDashboardDate: (date) => set({ dashboardDate: date }),
}));

// 환율 상태 관리
interface CurrencyState {
  currency: 'usd' | 'krw';
  setCurrency: (currency: 'usd' | 'krw') => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: 'krw',
  setCurrency: (currency) => set({ currency }),
}));

// 세전/세후 상태 관리
interface TaxState {
  tax: 'pre' | 'post';
  setTax: (tax: 'pre' | 'post') => void;
}

export const useTaxStore = create<TaxState>((set) => ({
  tax: 'pre',
  setTax: (tax) => set({ tax }),
}));

// 상단 옵션은 전역 기본값, 페이지 버튼은 해당 차트 그룹의 선택만 변경합니다.
export type ChartLayout = 'expanded' | 'compact';
type ChartLayoutScope =
  | 'overview'
  | 'dividends'
  | 'portfolio'
  | 'performance-detail'
  | 'performance-return'
  | 'risk';

interface ChartLayoutState {
  chartLayout: ChartLayout;
  pageChartLayouts: Partial<Record<ChartLayoutScope, ChartLayout>>;
  isDesktopViewport: boolean;
  setChartLayout: (layout: ChartLayout) => void;
  setPageChartLayout: (scope: ChartLayoutScope, layout: ChartLayout) => void;
  setIsDesktopViewport: (isDesktopViewport: boolean) => void;
}

export const useChartLayoutStore = create<ChartLayoutState>((set) => ({
  chartLayout: 'compact',
  pageChartLayouts: {},
  isDesktopViewport: true,
  // 전역 옵션을 선택하면 기존 페이지별 선택에도 일괄 적용합니다.
  setChartLayout: (chartLayout) => set({ chartLayout, pageChartLayouts: {} }),
  setPageChartLayout: (scope, layout) =>
    set((state) => ({
      pageChartLayouts: { ...state.pageChartLayouts, [scope]: layout },
    })),
  setIsDesktopViewport: (isDesktopViewport) => set({ isDesktopViewport }),
}));

export function usePageChartLayout(scope: ChartLayoutScope) {
  const layout = useChartLayoutStore((state) =>
    state.isDesktopViewport
      ? (state.pageChartLayouts[scope] ?? state.chartLayout)
      : 'expanded',
  );
  const setPageChartLayout = useChartLayoutStore(
    (state) => state.setPageChartLayout,
  );

  return [
    layout,
    (nextLayout: ChartLayout) => setPageChartLayout(scope, nextLayout),
  ] as const;
}
