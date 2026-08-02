import {
  mergeDividends,
  mergeStocks,
  mergeStockTradeHistory,
} from '../mergeHelpers';
import { DividendProps, StockProps, StockTradeHistoryProps } from '@/types';

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }

  return value;
};

describe('병합 헬퍼 함수', () => {
  describe('mergeDividends', () => {
    it('빈 배당금 배열 두 개를 병합해야 함', () => {
      const result = mergeDividends([], []);
      expect(result).toEqual([]);
    });

    it('arr2가 비어있을 때 arr1을 반환해야 함', () => {
      const arr1: DividendProps[] = [
        { date: '2024-01-01', price: 100, fxRate: 1200 },
        { date: '2024-02-01', price: 150, fxRate: 1210 },
      ];
      const result = mergeDividends(arr1, []);
      expect(result).toEqual(arr1);
    });

    it('arr1이 비어있을 때 arr2를 반환해야 함', () => {
      const arr2: DividendProps[] = [
        { date: '2024-01-01', price: 100, fxRate: 1200 },
      ];
      const result = mergeDividends([], arr2);
      expect(result).toEqual(arr2);
    });

    it('입력을 변경하지 않고 dividendSource 제거 동작을 유지한다', () => {
      const arr1: DividendProps[] = [
        {
          date: '2024-01-01',
          price: 100,
          fxRate: 1200,
          dividendSource: 'foreign',
        },
      ];
      const before = structuredClone(arr1);
      deepFreeze(arr1);

      const result = mergeDividends(arr1, []);

      expect(arr1).toEqual(before);
      expect(result[0]).not.toBe(arr1[0]);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        price: 100,
        fxRate: 1200,
      });
      expect(result[0]).not.toHaveProperty('dividendSource');
    });

    it('같은 날짜의 배당금을 합산해야 함', () => {
      const arr1: DividendProps[] = [
        { date: '2024-01-01', price: 100, fxRate: 1200 },
      ];
      const arr2: DividendProps[] = [
        { date: '2024-01-01', price: 50, fxRate: 1200 },
      ];
      const result = mergeDividends(arr1, arr2);
      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(150);
      expect(result[0].date).toBe('2024-01-01');
    });

    it('다른 날짜의 배당금을 병합해야 함', () => {
      const arr1: DividendProps[] = [
        { date: '2024-01-01', price: 100, fxRate: 1200 },
      ];
      const arr2: DividendProps[] = [
        { date: '2024-02-01', price: 50, fxRate: 1210 },
      ];
      const result = mergeDividends(arr1, arr2);
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { date: '2024-01-01', price: 100, fxRate: 1200 },
        { date: '2024-02-01', price: 50, fxRate: 1210 },
      ]);
    });

    // it('같은 날짜 병합 시 한쪽 환율이 없는 경우 있는 쪽의 환율을 사용해야 함', () => {
    //   const arr1: DividendProps[] = [
    //     { date: '2024-01-01', price: 100, fxRate: 1200 },
    //   ];
    //   const arr2: DividendProps[] = [
    //     { date: '2024-01-01', price: 50, fxRate: null },
    //   ];
    //   const result = mergeDividends(arr1, arr2);
    //   expect(result[0].fxRate).toBe(1200);
    // });

    it('여러 날짜의 배당금을 처리해야 함', () => {
      const arr1: DividendProps[] = [
        { date: '2024-01-01', price: 100, fxRate: 1200 },
        { date: '2024-03-01', price: 200, fxRate: 1220 },
      ];
      const arr2: DividendProps[] = [
        { date: '2024-02-01', price: 150, fxRate: 1210 },
        { date: '2024-03-01', price: 50, fxRate: 1220 },
      ];
      const result = mergeDividends(arr1, arr2);
      expect(result).toHaveLength(3);
      const march = result.find((d) => d.date === '2024-03-01');
      expect(march?.price).toBe(250);
    });

    it('같은 날짜·통화의 동일 환율과 날짜 등장 순서를 유지해야 함', () => {
      const arr1: DividendProps[] = [
        { date: '2024-03-01', price: 10, fxRate: 1250 },
        { date: '2024-03-01', price: 20, fxRate: 1250 },
        { date: '2024-01-01', price: 30, fxRate: 1200 },
      ];
      const arr2: DividendProps[] = [
        { date: '2024-03-01', price: 40, fxRate: 1250 },
        { date: '2024-02-01', price: 50, fxRate: 1210 },
      ];

      expect(mergeDividends(arr1, arr2)).toEqual([
        { date: '2024-03-01', price: 70, fxRate: 1250 },
        { date: '2024-01-01', price: 30, fxRate: 1200 },
        { date: '2024-02-01', price: 50, fxRate: 1210 },
      ]);
    });

    it('큰 입력도 날짜별로 정확히 병합해야 함', () => {
      const size = 5000;
      const arr1: DividendProps[] = Array.from({ length: size }, (_, index) => ({
        date: `date-${index}`,
        price: index,
        fxRate: 1200,
      }));
      const arr2: DividendProps[] = Array.from({ length: size }, (_, index) => ({
        date: `date-${index}`,
        price: index + 1,
        fxRate: 1300,
      }));

      const result = mergeDividends(arr1, arr2);

      expect(result).toHaveLength(size);
      expect(result[0]).toEqual({
        date: 'date-0',
        price: 1,
        fxRate: 1200,
      });
      expect(result[size - 1]).toEqual({
        date: `date-${size - 1}`,
        price: size * 2 - 1,
        fxRate: 1200,
      });
    });
  });

  describe('mergeStocks', () => {
    it('빈 주식 배열 두 개를 병합해야 함', () => {
      const result = mergeStocks([], []);
      expect(result).toEqual([]);
    });

    it('arr2가 비어있을 때 arr1을 반환해야 함', () => {
      const arr1: StockProps[] = [
        {
          shortName: 'Vanguard Total Stock Market ETF',
          longName: 'Vanguard Total Stock Market Index Fund ETF Shares',
          symbol: 'VTI',
          code: 'US9229087690',
          balance: [
            {
              date: '2025-10-29',
              price: 336.69,
              fxRate: 1425.969970703125,
            },
          ],
          price: 340.8699951171875,
        },
      ];
      const result = mergeStocks(arr1, []);
      expect(result).toEqual(arr1);
    });

    it('같은 종목 코드의 보유 내역을 합쳐야 함', () => {
      const balance1 = [
        {
          date: '2025-10-29',
          price: 336.69,
          fxRate: 1425.969970703125,
        },
      ];
      const balance2 = [
        {
          date: '2025-12-04',
          price: 334.9,
          fxRate: 1465.030029296875,
        },
      ];
      const arr1: StockProps[] = [
        {
          shortName: 'Vanguard Total Stock Market ETF',
          longName: 'Vanguard Total Stock Market Index Fund ETF Shares',
          symbol: 'VTI',
          code: 'US9229087690',
          price: 336.69,
          balance: balance1,
        },
      ];
      const arr2: StockProps[] = [
        {
          shortName: 'Vanguard Total Stock Market ETF',
          longName: 'Vanguard Total Stock Market Index Fund ETF Shares',
          symbol: 'VTI',
          code: 'US9229087690',
          price: 334.9,
          balance: balance2,
        },
      ];
      const result = mergeStocks(arr1, arr2);
      expect(result).toHaveLength(1);
      expect(result[0].balance).toHaveLength(2);
      expect(result[0].balance).toEqual([...balance1, ...balance2]);
    });

    it('다른 종목은 분리해야 함', () => {
      const arr1: StockProps[] = [
        {
          code: 'US46138G6492',
          longName: 'Invesco NASDAQ 100 ETF',
          price: 256.04998779296875,
          shortName: 'Invesco NASDAQ 100 ETF',
          symbol: 'QQQM',
          balance: [
            {
              date: '2025-12-04',
              price: 254.35,
              fxRate: 1465.030029296875,
            },
          ],
        },
      ];
      const arr2: StockProps[] = [
        {
          shortName: 'Vanguard Total Stock Market ETF',
          longName: 'Vanguard Total Stock Market Index Fund ETF Shares',
          symbol: 'VTI',
          code: 'US9229087690',
          price: 334.9,
          balance: [
            {
              date: '2025-12-04',
              price: 334.9,
              fxRate: 1465.030029296875,
            },
          ],
        },
      ];
      const result = mergeStocks(arr1, arr2);
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.code)).toContain('US46138G6492');
      expect(result.map((s) => s.code)).toContain('US9229087690');
      expect(result[0]).toBe(arr1[0]);
      expect(result[1]).toBe(arr2[0]);
    });

    it('입력을 변경하지 않고 충돌 wrapper만 복제해 balance leaf를 공유한다', () => {
      const arr1: StockProps[] = [
        {
          shortName: 'Apple',
          longName: 'Apple Inc.',
          symbol: 'AAPL',
          code: 'US0378331005',
          price: 150,
          balance: [{ date: '2024-01-01', price: 150, fxRate: 1200 }],
        },
      ];
      const arr2: StockProps[] = [
        {
          shortName: 'Apple',
          longName: 'Apple Inc.',
          symbol: 'AAPL',
          code: 'US0378331005',
          price: 155,
          balance: [{ date: '2024-02-01', price: 155, fxRate: 1210 }],
        },
      ];
      const arr1Before = structuredClone(arr1);
      const arr2Before = structuredClone(arr2);
      deepFreeze(arr1);
      deepFreeze(arr2);

      const result = mergeStocks(arr1, arr2);

      expect(arr1).toEqual(arr1Before);
      expect(arr2).toEqual(arr2Before);
      expect(result[0]).not.toBe(arr1[0]);
      expect(result[0]).not.toBe(arr2[0]);
      expect(result[0].balance).not.toBe(arr1[0].balance);
      expect(result[0].balance).not.toBe(arr2[0].balance);
      expect(result[0].balance[0]).toBe(arr1[0].balance[0]);
      expect(result[0].balance[1]).toBe(arr2[0].balance[0]);
    });
  });

  describe('mergeStockTradeHistory', () => {
    it('빈 거래 이력 배열 두 개를 병합해야 함', () => {
      const result = mergeStockTradeHistory([], []);
      expect(result).toEqual([]);
    });

    it('arr2가 비어있을 때 arr1을 반환해야 함', () => {
      const arr1: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1200,
          pricesBySymbol: { AAPL: [150] },
        },
      ];
      const result = mergeStockTradeHistory(arr1, []);
      expect(result).toEqual(arr1);
    });

    it('날짜와 타입이 없을 때 새로운 거래 이력을 추가해야 함', () => {
      const arr1: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1200,
          pricesBySymbol: { AAPL: [150] },
        },
      ];
      const arr2: StockTradeHistoryProps[] = [
        {
          date: '2024-02-01',
          type: 'buy',
          fxRate: 1210,
          pricesBySymbol: { GOOGL: [2800] },
        },
      ];
      const result = mergeStockTradeHistory(arr1, arr2);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(arr1[0]);
      expect(result[1]).toBe(arr2[0]);
    });

    it('같은 날짜와 타입의 가격을 병합해야 함', () => {
      const arr1: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1200,
          pricesBySymbol: { AAPL: [150] },
        },
      ];
      const arr2: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1200,
          pricesBySymbol: { AAPL: [151] },
        },
      ];
      const result = mergeStockTradeHistory(arr1, arr2);
      expect(result).toHaveLength(1);
      expect(result[0].pricesBySymbol.AAPL).toEqual([150, 151]);
    });

    it('같은 날짜와 타입의 다른 심볼을 병합해야 함', () => {
      const arr1: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1200,
          pricesBySymbol: { AAPL: [150] },
        },
      ];
      const arr2: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1200,
          pricesBySymbol: { GOOGL: [2800] },
        },
      ];
      const result = mergeStockTradeHistory(arr1, arr2);
      expect(result).toHaveLength(1);
      expect(result[0].pricesBySymbol).toEqual({
        AAPL: [150],
        GOOGL: [2800],
      });
    });

    it('같은 날짜라도 다른 타입은 분리해야 함', () => {
      const arr1: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1200,
          pricesBySymbol: { AAPL: [150] },
        },
      ];
      const arr2: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'sell',
          fxRate: 1200,
          pricesBySymbol: { AAPL: [155] },
        },
      ];
      const result = mergeStockTradeHistory(arr1, arr2);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.type)).toContain('buy');
      expect(result.map((t) => t.type)).toContain('sell');
    });

    it('여러 거래와 심볼을 처리해야 함', () => {
      const arr1: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1200,
          pricesBySymbol: { AAPL: [150, 151], GOOGL: [2800] },
        },
      ];
      const arr2: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1200,
          pricesBySymbol: { AAPL: [152], MSFT: [300] },
        },
      ];
      const result = mergeStockTradeHistory(arr1, arr2);
      expect(result).toHaveLength(1);
      expect(result[0].pricesBySymbol).toEqual({
        AAPL: [150, 151, 152],
        GOOGL: [2800],
        MSFT: [300],
      });
    });

    it('입력을 변경하지 않고 충돌한 거래와 가격 배열만 복제한다', () => {
      const arr1: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1200,
          pricesBySymbol: { AAPL: [150], GOOGL: [2800] },
          namesBySymbol: { AAPL: 'Apple', GOOGL: 'Google' },
        },
      ];
      const arr2: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1210,
          pricesBySymbol: { AAPL: [151], MSFT: [300] },
          namesBySymbol: { AAPL: 'Apple Inc.', MSFT: 'Microsoft' },
        },
      ];
      const arr1Before = structuredClone(arr1);
      const arr2Before = structuredClone(arr2);
      deepFreeze(arr1);
      deepFreeze(arr2);

      const result = mergeStockTradeHistory(arr1, arr2);

      expect(arr1).toEqual(arr1Before);
      expect(arr2).toEqual(arr2Before);
      expect(result[0]).not.toBe(arr1[0]);
      expect(result[0].pricesBySymbol).not.toBe(arr1[0].pricesBySymbol);
      expect(result[0].pricesBySymbol.AAPL).not.toBe(
        arr1[0].pricesBySymbol.AAPL,
      );
      expect(result[0].pricesBySymbol.AAPL).not.toBe(
        arr2[0].pricesBySymbol.AAPL,
      );
      expect(result[0].pricesBySymbol.GOOGL).toBe(
        arr1[0].pricesBySymbol.GOOGL,
      );
      expect(result[0].pricesBySymbol.MSFT).toBe(
        arr2[0].pricesBySymbol.MSFT,
      );
      expect(result[0].namesBySymbol).not.toBe(arr1[0].namesBySymbol);
      expect(result[0].namesBySymbol).not.toBe(arr2[0].namesBySymbol);
    });

    it('arr1 내부 중복 항목과 전체 결과 순서를 기존 방식대로 유지해야 함', () => {
      const arr1: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1200,
          pricesBySymbol: { AAPL: [150] },
        },
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1201,
          pricesBySymbol: { AAPL: [151] },
        },
      ];
      const arr2: StockTradeHistoryProps[] = [
        {
          date: '2024-01-01',
          type: 'buy',
          fxRate: 1210,
          pricesBySymbol: { AAPL: [152] },
        },
        {
          date: '2024-02-01',
          type: 'sell',
          fxRate: 1220,
          pricesBySymbol: { MSFT: [300] },
        },
      ];

      const result = mergeStockTradeHistory(arr1, arr2);

      expect(result).toHaveLength(3);
      expect(result[0].pricesBySymbol.AAPL).toEqual([150, 152]);
      expect(result[1].pricesBySymbol.AAPL).toEqual([151]);
      expect(result[2]).toEqual(arr2[1]);
    });
  });
});
