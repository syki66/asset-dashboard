import { DividendProps, StockProps, StockTradeHistoryProps } from '@/types';
import { DEFAULT_FX_RATE } from '@/constants/keywords';

/**
 * 두 개의 배당금 배열을 날짜별로 병합합니다.
 * 같은 날짜의 배당금은 합산됩니다.
 */
export const mergeDividends = (
  arr1: DividendProps[],
  arr2: DividendProps[],
): DividendProps[] => {
  const dividendMap = new Map<string, number>();

  // 두 개의 배열을 돌면서 날짜별로 배당금 합산
  arr1.forEach((d) => {
    dividendMap.set(d.date, (dividendMap.get(d.date) || 0) + d.price);
  });
  arr2.forEach((d) => {
    dividendMap.set(d.date, (dividendMap.get(d.date) || 0) + d.price);
  });

  // Map을 객체 배열로 변환
  return Array.from(dividendMap.entries()).map(([date, price]) => ({
    date,
    price,
    fxRate:
      arr1.find((d) => d.date === date)?.fxRate ||
      arr2.find((d) => d.date === date)?.fxRate ||
      DEFAULT_FX_RATE,
  }));
};

/**
 * 두 개의 주식 배열을 종목 코드별로 병합합니다.
 * 같은 종목은 보유 내역(balance)이 합쳐집니다.
 * (같은 날짜의 stock 데이터를 입력받아야 함)
 */
export const mergeStocks = (
  arr1: StockProps[],
  arr2: StockProps[],
): StockProps[] => {
  const stockMap = new Map<string, StockProps>();

  const addStocks = (stocks: StockProps[]) => {
    stocks.forEach((stock) => {
      if (stockMap.has(stock.code)) {
        const existing = stockMap.get(stock.code)!;
        // concatenate balances; use the price from the latest entry (arr2 overrides)
        existing.balance = existing.balance.concat(stock.balance);
      } else {
        stockMap.set(stock.code, { ...stock });
      }
    });
  };

  addStocks(arr1);
  addStocks(arr2);

  return Array.from(stockMap.values());
};

/**
 * 두 개의 주식 거래 이력 배열을 날짜와 타입(sell, buy)별로 병합합니다.
 * 같은 날짜와 타입의 거래는 종목별 가격 배열이 합쳐집니다.
 */
export const mergeStockTradeHistory = (
  arr1: StockTradeHistoryProps[],
  arr2: StockTradeHistoryProps[],
): StockTradeHistoryProps[] => {
  const tradeHistoryArr = [...arr1];

  arr2.forEach((trade) => {
    const existingTrade = tradeHistoryArr.find(
      (t) => t.date === trade.date && t.type === trade.type,
    );
    if (existingTrade) {
      // 같은 날짜와 타입의 거래내역이 있으면 pricesBySymbol 병합
      Object.entries(trade.pricesBySymbol).forEach(([symbol, prices]) => {
        if (!existingTrade.pricesBySymbol[symbol]) {
          existingTrade.pricesBySymbol[symbol] = [];
        }
        existingTrade.pricesBySymbol[symbol] =
          existingTrade.pricesBySymbol[symbol].concat(prices);
      });
      existingTrade.namesBySymbol = {
        ...existingTrade.namesBySymbol,
        ...trade.namesBySymbol,
      };
    } else {
      // 없으면 새로 추가
      tradeHistoryArr.push(structuredClone(trade));
    }
  });

  return tradeHistoryArr;
};
