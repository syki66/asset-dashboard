import type {
  DividendProps,
  ReadonlyDividendProps,
  ReadonlyStockProps,
  ReadonlyStockTradeHistoryProps,
} from '@/types';
import { DEFAULT_FX_RATE } from '@/constants/keywords';

/**
 * 두 개의 배당금 배열을 날짜별로 병합합니다.
 * 같은 날짜의 배당금은 합산됩니다.
 * 같은 날짜·통화는 같은 환율이라는 계좌 스냅샷 전제에 따라 처음 등장한
 * 배당의 환율을 사용합니다. Map의 삽입 순서를 유지하며 입력은 변경하지 않습니다.
 */
export const mergeDividends = (
  arr1: readonly ReadonlyDividendProps[],
  arr2: readonly ReadonlyDividendProps[],
): DividendProps[] => {
  type DividendAccumulator = {
    price: number;
    fxRate: number;
  };

  const dividendMap = new Map<string, DividendAccumulator>();

  const addDividend = (dividend: ReadonlyDividendProps) => {
    const accumulated = dividendMap.get(dividend.date);

    if (accumulated) {
      accumulated.price += dividend.price;
      return;
    }

    dividendMap.set(dividend.date, {
      price: dividend.price,
      fxRate: dividend.fxRate || DEFAULT_FX_RATE,
    });
  };

  arr1.forEach(addDividend);
  arr2.forEach(addDividend);

  return Array.from(dividendMap.entries(), ([date, accumulated]) => ({
    date,
    price: accumulated.price,
    fxRate: accumulated.fxRate,
  }));
};

/**
 * 두 개의 주식 배열을 종목 코드별로 병합합니다.
 * 같은 종목은 보유 내역(balance)이 합쳐집니다.
 * (같은 날짜의 stock 데이터를 입력받아야 함)
 *
 * 충돌한 종목만 복사하는 copy-on-write 방식입니다. 충돌하지 않은 종목과
 * 변경 불가능한 balance 항목은 입력과 공유하므로 반환값도 readonly입니다.
 */
export const mergeStocks = (
  arr1: readonly ReadonlyStockProps[],
  arr2: readonly ReadonlyStockProps[],
): ReadonlyStockProps[] => {
  const stockMap = new Map<string, ReadonlyStockProps>();

  const addStocks = (stocks: readonly ReadonlyStockProps[]) => {
    stocks.forEach((stock) => {
      const existing = stockMap.get(stock.code);

      if (existing) {
        // 입력과 공유 중인 wrapper는 건드리지 않고 충돌 경로만 복사합니다.
        stockMap.set(stock.code, {
          ...existing,
          balance: [...existing.balance, ...stock.balance],
        });
      } else {
        stockMap.set(stock.code, stock);
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
 *
 * 충돌한 거래와 symbol 배열만 복사하고 나머지 데이터는 구조적으로
 * 공유합니다. 공유된 입력을 보호하기 위해 반환 타입의 readonly 경계를
 * 유지해야 합니다.
 */
export const mergeStockTradeHistory = (
  arr1: readonly ReadonlyStockTradeHistoryProps[],
  arr2: readonly ReadonlyStockTradeHistoryProps[],
): ReadonlyStockTradeHistoryProps[] => {
  const tradeHistoryArr = [...arr1];
  const tradeIndex = new Map<
    string,
    Map<ReadonlyStockTradeHistoryProps['type'], number>
  >();

  const indexFirstTrade = (
    trade: ReadonlyStockTradeHistoryProps,
    index: number,
  ) => {
    let tradesByType = tradeIndex.get(trade.date);

    if (!tradesByType) {
      tradesByType = new Map();
      tradeIndex.set(trade.date, tradesByType);
    }

    if (!tradesByType.has(trade.type)) {
      tradesByType.set(trade.type, index);
    }
  };

  tradeHistoryArr.forEach((trade, index) => indexFirstTrade(trade, index));

  arr2.forEach((trade) => {
    const existingIndex = tradeIndex.get(trade.date)?.get(trade.type);

    if (existingIndex !== undefined) {
      const existingTrade = tradeHistoryArr[existingIndex];
      const pricesBySymbol: Record<string, readonly number[]> = {
        ...existingTrade.pricesBySymbol,
      };

      // 동일 symbol의 배열만 새로 만들고 한쪽에만 있는 배열은 공유합니다.
      Object.entries(trade.pricesBySymbol).forEach(([symbol, prices]) => {
        const existingPrices = pricesBySymbol[symbol];
        pricesBySymbol[symbol] = existingPrices
          ? [...existingPrices, ...prices]
          : prices;
      });

      tradeHistoryArr[existingIndex] = {
        ...existingTrade,
        pricesBySymbol,
        namesBySymbol: {
          ...existingTrade.namesBySymbol,
          ...trade.namesBySymbol,
        },
      };
    } else {
      const newIndex = tradeHistoryArr.length;
      tradeHistoryArr.push(trade);
      indexFirstTrade(trade, newIndex);
    }
  });

  return tradeHistoryArr;
};
