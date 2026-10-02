import { useChartLayoutStore } from '../options';

describe('chart layout scopes', () => {
  beforeEach(() => {
    useChartLayoutStore.setState({
      chartLayout: 'compact',
      pageChartLayouts: {},
      isDesktopViewport: true,
    });
  });

  it('keeps page selections without changing the global option or other pages', () => {
    useChartLayoutStore.getState().setPageChartLayout('overview', 'expanded');
    useChartLayoutStore.getState().setPageChartLayout('dividends', 'compact');
    expect(useChartLayoutStore.getState()).toMatchObject({
      chartLayout: 'compact',
      pageChartLayouts: { overview: 'expanded', dividends: 'compact' },
    });
  });

  it('applies a global selection to all groups, even when reselecting the default', () => {
    const { setPageChartLayout, setChartLayout } = useChartLayoutStore.getState();
    setPageChartLayout('overview', 'expanded');
    setPageChartLayout('performance-detail', 'expanded');
    setPageChartLayout('performance-return', 'compact');
    setChartLayout('compact');
    expect(useChartLayoutStore.getState().pageChartLayouts).toEqual({});
    setChartLayout('expanded');
    expect(useChartLayoutStore.getState().chartLayout).toBe('expanded');
  });

  it('keeps desktop preferences when switching to mobile and back', () => {
    const { setPageChartLayout, setIsDesktopViewport } = useChartLayoutStore.getState();
    setPageChartLayout('risk', 'expanded');
    setIsDesktopViewport(false);
    expect(useChartLayoutStore.getState()).toMatchObject({
      chartLayout: 'compact',
      pageChartLayouts: { risk: 'expanded' },
      isDesktopViewport: false,
    });
    setIsDesktopViewport(true);
    expect(useChartLayoutStore.getState().pageChartLayouts.risk).toBe('expanded');
  });
});
