import { getFxRate } from '../generator';
import { StockHistoryProps } from '@/types';

// constants 모듈 모의화
jest.mock('@/constants/keywords', () => ({
  DEFAULT_FX_RATE: 1400,
}));

describe('getFxRate', () => {
  const mockStockHistory: StockHistoryProps[] = [
    {
      date: '2025-04-17',
      preSplitClose: 1414.22998046875,
      close: 1414.22998046875,
      adjClose: 1414.22998046875,
    },
    {
      date: '2025-04-18',
      preSplitClose: 0,
      close: null,
      adjClose: null,
    },
    {
      date: '2025-04-21',
      preSplitClose: 0,
      close: null,
      adjClose: null,
    },
    {
      date: '2025-12-24',
      preSplitClose: 1478.6700439453125,
      close: 1478.6700439453125,
      adjClose: 1478.6700439453125,
    },
    {
      date: '2025-12-25',
      preSplitClose: 0,
      close: null,
      adjClose: null,
    },
    {
      date: '2026-01-13',
      preSplitClose: 1464.9300537109375,
      close: 1464.9300537109375,
      adjClose: 1464.9300537109375,
    },
  ];

  test('정확한 날짜가 있고, close 값이 존재할 때 해당 close 값을 반환', () => {
    const result = getFxRate(mockStockHistory, '2025-04-17');
    expect(result).toBe(1414.22998046875);
  });

  test('정확한 날짜가 있지만 close 값이 null일 때, 가장 가까운 close가 있는 과거 날짜의 close 값을 반환', () => {
    const result = getFxRate(mockStockHistory, '2025-04-18');
    expect(result).toBe(1414.22998046875);
  });

  test('정확한 날짜가 없을 때 가장 가까운 close 값이 있는 과거 날짜의 close 값을 반환', () => {
    const result = getFxRate(mockStockHistory, '2025-04-19');
    expect(result).toBe(1414.22998046875);
  });

  test('가장 처음 날짜보다 이전 날짜를 조회할 때 DEFAULT_FX_RATE 반환', () => {
    const result = getFxRate(mockStockHistory, '1999-12-01');
    expect(result).toBe(1400);
  });

  test('빈 배열일 때 DEFAULT_FX_RATE 반환', () => {
    const result = getFxRate([], '2025-01-10');
    expect(result).toBe(1400); // DEFAULT_FX_RATE 값 (constants에서 확인)
  });

  test('마지막 날짜보다 이후 날짜를 조회할 경우, close를 가진 마지막 날짜의 close 값을 반환', () => {
    const result = getFxRate(mockStockHistory, '2040-02-01');
    expect(result).toBe(1464.9300537109375);
  });

  test('여러 항목 중 가장 가까운 과거 항목 선택', () => {
    const entries: StockHistoryProps[] = [
      { date: '2024-01-01', close: 1000, preSplitClose: 1000, adjClose: 1000 },
      { date: '2024-01-10', close: 1100, preSplitClose: 1100, adjClose: 1100 },
      { date: '2024-01-20', close: 1200, preSplitClose: 1200, adjClose: 1200 },
    ];
    const result = getFxRate(entries, '2024-01-15');
    expect(result).toBe(1100);
  });
});
