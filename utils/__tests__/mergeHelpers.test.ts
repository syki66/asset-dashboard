import {
  mergeDividends,
  mergeStocks,
  mergeStockTradeHistory,
} from '../mergeHelpers';
import { DividendProps, StockProps, StockTradeHistoryProps } from '@/types';

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
  });
});
