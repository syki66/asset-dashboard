import {
  AccountProps,
  StockProps,
  Currency,
  DividendProps,
  StockHistoryProps,
  TransactionProps,
  DashboardProps,
  ChartProps,
  StockBuySellHistoryProps,
} from '@/types';
import {
  dateToTimestamp,
  generateDateObjects,
  getLatestDate,
  timestampToDate,
} from './format';
import axios from 'axios';
import { toast } from 'sonner';
import {
  USD_KRW_SYMBOL,
  DEFAULT_FX_RATE,
  usBrokerFee,
  usSecFee,
  usCapitalGainsTax,
  krBrokerFee,
  krRegulatoryFee,
  krTransferTax,
  exchangeSpread,
  exchangeFee,
} from '@/constants/keywords';
import { getAverage } from './math';
import { differenceInCalendarDays } from 'date-fns';

// 대시보드 표시용 데이터로 가공하는 함수
export const convertToDashboardData = (
  accountData: AccountProps[],
  currency: Currency,
): DashboardProps[] => {
  // 자산 증감 내역 차트용 데이터
  const principalChartData: ChartProps[] = [];
  const currentValueChartData: ChartProps[] = [];
  const profitChartData: ChartProps[] = [];
  const netProfitChartData: ChartProps[] = [];
  const drawdownChartData: ChartProps[] = [];
  let dividendHistoryChartData: ChartProps[] = [];
  const yieldOnCostChartData: ChartProps[] = [];
  const dividendYieldChartData: ChartProps[] = [];
  const benchmarkChartData: ChartProps[] = [];
  const benchmarkProfitChartData: ChartProps[] = [];
  let stockBuyHistoryChartData: StockBuySellHistoryProps[] = [];
  let stockSellHistoryChartData: StockBuySellHistoryProps[] = [];

  // MDD 계산용 변수
  let maxDrawdown = 0; // 역대 MDD (금액)
  let peakValue = 0; // 평가자산 최고점
  let peakDate = ''; // mdd 시작 날짜
  let maxDrawdownStartDate = ''; // 역대 최대 낙폭 시작일
  let maxDrawdownEndDate = ''; // 역대 최대 낙폭 종료일
  let recoveryDuration = 0; // 역대 최대 낙폭 회복 기간 (일)
  let maxDailyDrawdown = 0; // 하루 MDD (금액)
  let maxDailyDrawdownDate = ''; // 하루 mdd 낙폭 날짜
  let prevValue = 0; // 전날 평가 자산

  // 병합된 데이터를 순회하면서 각 계좌의 대시보드 데이터를 생성
  const dashboardData = accountData.map((account: AccountProps) => {
    // USD 주식 총 금액 계산
    const usdStockValue = account.usd.stocks.reduce(
      (acc, stock) => acc + stock.price * stock.balance.length,
      0,
    );

    // KRW 주식 총 금액 계산
    const krwStockValue = account.krw.stocks.reduce(
      (acc, stock) => acc + stock.price * stock.balance.length,
      0,
    );

    // 주식 평가금액 총합
    const stockValue =
      currency === 'usd'
        ? usdStockValue + krwStockValue / account.fxRate
        : usdStockValue * account.fxRate + krwStockValue;

    // 달러, 원화 현금 잔고 계산
    const cashValue =
      currency === 'usd'
        ? account.usd.cash + account.krw.cash / account.fxRate
        : account.krw.cash + account.usd.cash * account.fxRate;

    // 세금 및 제비용 (원화로만 계산)
    const krTaxFee =
      krwStockValue * (krBrokerFee + krRegulatoryFee + krTransferTax); // 국내 주식 세금 및 제비용

    const usEstimatedProfit = account.usd.stocks.reduce(
      (acc, stock) =>
        acc +
        stock.balance
          .map((item) => {
            const profit =
              stock.price * account.fxRate - item.price * item.fxRate;
            const fee =
              (stock.price * account.fxRate + item.price * item.fxRate) *
              (usBrokerFee + usSecFee);
            return profit - fee;
          })
          .reduce((a, b) => a + b, 0),
      0,
    ); // 미국주식 양도소득세 계산을 위한 추정손익 (원화로 계산, 거래수수료 비용 제외 적용)

    const usFee = usdStockValue * (usBrokerFee + usSecFee) * account.fxRate; // 미국주식 매도 수수료
    const usFxFee =
      (usdStockValue + account.usd.cash) /
      (account.fxRate * exchangeSpread * exchangeFee); // 환전 수수료 (원화로 계산)
    const usTax =
      usEstimatedProfit * usCapitalGainsTax > 0
        ? usEstimatedProfit * usCapitalGainsTax
        : 0; // 미국주식 양도소득세 계산 (마이너스일 경우 0원 처리)

    const totalTaxFee = krTaxFee + usFee + usTax + usFxFee; // 총 세금 및 수수료 (원화)

    // 평가 금액
    const currentValue = stockValue + cashValue;

    // 순평가금액
    const netCurrentValue = currentValue - totalTaxFee;

    // 원금
    const principal =
      currency === 'usd'
        ? account.usd.principalAmount
        : account.krw.principalAmount;

    // 수익금
    const profit = currentValue - principal;

    // 순수익금
    const netProfit = profit - totalTaxFee;

    // 수익률
    const returnRate = Number(((profit / principal) * 100).toFixed(2));

    // 순수익률
    const netReturnRate = Number(
      (((profit - totalTaxFee) / principal) * 100).toFixed(2),
    );

    // CAGR
    const startDate = new Date(accountData[0].date);
    const endDate = new Date(accountData[accountData.length - 1].date);
    const years =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const cagr =
      years > 0
        ? Number(
            ((Math.pow(currentValue / principal, 1 / years) - 1) * 100).toFixed(
              2,
            ),
          )
        : 0;

    const netCagr =
      years > 0
        ? Number(
            (
              (Math.pow(netCurrentValue / principal, 1 / years) - 1) *
              100
            ).toFixed(2),
          )
        : 0;

    // 배당금 (최근 1년간)
    const oneYearAgo = new Date(account.date);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const dividendsKrw = account.krw.dividends
      .filter((dividend) => {
        const dividendDate = new Date(dividend.date);
        return dividendDate >= oneYearAgo;
      })
      .reduce(
        (acc, dividend) =>
          currency === 'usd'
            ? acc + dividend.price / dividend.fxRate
            : acc + dividend.price,
        0,
      );

    const dividendsUsd = account.usd.dividends
      .filter((dividend) => {
        const dividendDate = new Date(dividend.date);
        return dividendDate >= oneYearAgo;
      })
      .reduce(
        (acc, dividend) =>
          currency === 'usd'
            ? acc + dividend.price
            : acc + dividend.price * dividend.fxRate,
        0,
      );

    const annualDividends = dividendsUsd + dividendsKrw; // 위에서 이미 환전처리 되어있음

    // 배당금 (전체기간)
    const totalDividendsKrw = account.krw.dividends.reduce(
      (acc, dividend) =>
        currency === 'usd'
          ? acc + dividend.price / dividend.fxRate
          : acc + dividend.price,
      0,
    );
    const totalDividendsUsd = account.usd.dividends.reduce(
      (acc, dividend) =>
        currency === 'usd'
          ? acc + dividend.price
          : acc + dividend.price * dividend.fxRate,
      0,
    );
    const totalDividends = totalDividendsUsd + totalDividendsKrw;

    // 원금대비배당률
    const yieldOnCost = Number(
      ((annualDividends / principal) * 100).toFixed(2),
    );

    // 평가금대비배당률
    const dividendYield = Number(
      ((annualDividends / currentValue) * 100).toFixed(2),
    );

    // MDD 금액 기준으로 계산 (자산 총 수익금을 기반으로 하면 현금량 추적이 불가능 하여 오차가 많이 생겨, 단순히 주식 수익금 기반으로 현재 환율로 계산함. 따라서 실제 손해와 변동폭이 꽤 많이 차이날 수 있음)
    const stocksProfit =
      currency === 'usd'
        ? account.usd.stocksProfit + account.krw.stocksProfit / account.fxRate
        : account.usd.stocksProfit * account.fxRate + account.krw.stocksProfit;

    if (stocksProfit > peakValue) {
      peakValue = stocksProfit; // 최고점 갱신
      peakDate = account.date;
    }
    const drawdown = peakValue - stocksProfit;

    // 최고 낙폭을 갱신하면 업데이트
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownStartDate = peakDate;
      maxDrawdownEndDate = account.date;
      recoveryDuration = differenceInCalendarDays(
        new Date(maxDrawdownEndDate),
        new Date(maxDrawdownStartDate),
      );
    }

    // 하루 MDD 계산
    const dailyDrawdown = prevValue - stocksProfit;

    if (dailyDrawdown > maxDailyDrawdown) {
      maxDailyDrawdown = dailyDrawdown;
      maxDailyDrawdownDate = account.date;
    }

    // 하루 MDD 계산을 위한 비교를 위해 이전 값으로 대입
    prevValue = stocksProfit;

    // 벤치마크 순평가금
    const benchmarkValue =
      currency === 'usd'
        ? account.usd.benchmarkValue
        : account.krw.benchmarkValue;

    // 벤치마크 순수익금
    const benchmarkProfit = benchmarkValue - principal;

    // 벤치마크 순수익률
    const benchmarkReturnRate = Number(
      (((benchmarkValue - principal) / principal) * 100).toFixed(2),
    );

    // 벤치마크 순 CAGR
    const benchmarkCagr =
      years > 0
        ? Number(
            (
              (Math.pow(benchmarkValue / principal, 1 / years) - 1) *
              100
            ).toFixed(2),
          )
        : 0;

    // 벤치마크 순초과수익
    const benchmarkExcessReturn = profit - benchmarkProfit;

    // 벤치마크 순평가금
    const benchmarkNetValue =
      currency === 'usd'
        ? account.usd.benchmarkNetValue
        : account.krw.benchmarkNetValue;

    // 벤치마크 순수익금
    const benchmarkNetProfit = benchmarkNetValue - principal;

    // 벤치마크 순수익률
    const benchmarkNetReturnRate = Number(
      (((benchmarkNetValue - principal) / principal) * 100).toFixed(2),
    );

    // 벤치마크 순 CAGR
    const benchmarkNetCagr =
      years > 0
        ? Number(
            (
              (Math.pow(benchmarkNetValue / principal, 1 / years) - 1) *
              100
            ).toFixed(2),
          )
        : 0;

    // 벤치마크 순초과수익
    const benchmarkNetExcessReturn = netProfit - benchmarkNetProfit;

    //////////////////////////////////////////////////////
    // 자산 차트용 데이터 가공
    /////////////////////////////////////////////////////
    // 원금 차트
    principalChartData.push({
      date: account.date,
      value: principal,
    });

    // 평가금 차트
    currentValueChartData.push({
      date: account.date,
      value: currentValue,
    });

    // 수익금 차트
    profitChartData.push({
      date: account.date,
      value: profit,
    });

    // 세후 수익금 차트 데이터
    netProfitChartData.push({
      date: account.date,
      value: profit - totalTaxFee,
    });

    // MDD 차트
    drawdownChartData.push({
      date: account.date,
      value: drawdown,
    });

    // 배당금 기록 차트 데이터
    const krwDividends = account.usd.dividends.map((dividend) => {
      return {
        date: dividend.date,
        value:
          currency === 'usd'
            ? Math.round(dividend.price)
            : Math.round(dividend.price * dividend.fxRate),
      };
    });

    const usdDividends = account.krw.dividends.map((dividend) => {
      return {
        date: dividend.date,
        value:
          currency === 'usd'
            ? Math.round(dividend.price / dividend.fxRate)
            : Math.round(dividend.price),
      };
    });

    dividendHistoryChartData = [...krwDividends, ...usdDividends];
    dividendHistoryChartData.sort((a, b) => a.date.localeCompare(b.date)); // 날짜 순서 정렬

    // Yield on Cost 차트 데이터
    yieldOnCostChartData.push({
      date: account.date,
      value: yieldOnCost,
    });

    // 배당금 수익률 차트 데이터
    dividendYieldChartData.push({
      date: account.date,
      value: dividendYield,
    });

    // 벤치마크 차트 데이터
    benchmarkChartData.push({
      date: account.date,
      value: benchmarkNetValue,
    });

    // 벤치마크 수익률 차트 데이터
    benchmarkProfitChartData.push({
      date: account.date,
      value: benchmarkNetValue - principal,
    });

    // 주식 매수 기록 차트 데이터
    const krwStockBuyHistory = account.krw.stockTradeHistory
      .filter((trade) => trade.type === 'buy')
      .map((trade) => ({
        date: trade.date,
        quantityBySymbol: Object.fromEntries(
          Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
            symbol,
            prices.length,
          ]),
        ),
        priceBySymbol: Object.fromEntries(
          Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
            symbol,
            prices.reduce((a, b) => a + b, 0),
          ]),
        ),
      }));

    const usdStockBuyHistory = account.usd.stockTradeHistory
      .filter((trade) => trade.type === 'buy')
      .map((trade) => ({
        date: trade.date,
        quantityBySymbol: Object.fromEntries(
          Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
            symbol,
            prices.length,
          ]),
        ),
        priceBySymbol: Object.fromEntries(
          Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
            symbol,
            prices.reduce((a, b) => a + b, 0),
          ]),
        ),
      }));

    stockBuyHistoryChartData = [...krwStockBuyHistory, ...usdStockBuyHistory];
    stockBuyHistoryChartData.sort((a, b) => a.date.localeCompare(b.date)); // 날짜 순서 정렬

    // 주식 매도 기록 차트 데이터
    const krwStockSellHistory = account.krw.stockTradeHistory
      .filter((trade) => trade.type === 'sell')
      .map((trade) => ({
        date: trade.date,
        quantityBySymbol: Object.fromEntries(
          Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
            symbol,
            prices.length,
          ]),
        ),
        priceBySymbol: Object.fromEntries(
          Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
            symbol,
            prices.reduce((a, b) => a + b, 0),
          ]),
        ),
      }));

    const usdStockSellHistory = account.usd.stockTradeHistory
      .filter((trade) => trade.type === 'sell')
      .map((trade) => ({
        date: trade.date,
        quantityBySymbol: Object.fromEntries(
          Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
            symbol,
            prices.length,
          ]),
        ),
        priceBySymbol: Object.fromEntries(
          Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
            symbol,
            prices.reduce((a, b) => a + b, 0),
          ]),
        ),
      }));

    stockSellHistoryChartData = [
      ...krwStockSellHistory,
      ...usdStockSellHistory,
    ];
    stockSellHistoryChartData.sort((a, b) => a.date.localeCompare(b.date)); // 날짜 순서 정렬

    return {
      date: account.date,
      lastUpdated: account.lastUpdated,
      fxRate: Number(account.fxRate.toFixed(2)),
      performance: {
        currentValue,
        netCurrentValue,
        principal,
        profit,
        netProfit,
        returnRate,
        netReturnRate,
        cagr,
        netCagr,
      },
      dividends: {
        annualDividends,
        totalDividends,
        dividendYield,
        yieldOnCost,
      },
      cash: {
        total: cashValue,
        usdCash: account.usd.cash,
        krwCash: account.krw.cash,
      },
      costs: {
        totalCost: totalTaxFee,
        krTaxFee,
        usFee,
        usTax,
        usFxFee,
      },
      benchmark: {
        value: benchmarkValue,
        netValue: benchmarkNetValue,
        profit: benchmarkProfit,
        netProfit: benchmarkNetProfit,
        returnRate: benchmarkReturnRate,
        netReturnRate: benchmarkNetReturnRate,
        cagr: benchmarkCagr,
        netCagr: benchmarkNetCagr,
        excessReturn: benchmarkExcessReturn,
        netExcessReturn: benchmarkNetExcessReturn,
      },
      drawdown: {
        maxDrawdown: -maxDrawdown,
        maxDrawdownStartDate,
        maxDrawdownEndDate,
        recoveryDuration,
        maxDailyDrawdown: -maxDailyDrawdown,
        maxDailyDrawdownDate,
      },
      charts: {
        principal: principalChartData,
        currentValue: currentValueChartData,
        profit: profitChartData,
        netProfit: netProfitChartData,
        drawdown: drawdownChartData,
        dividendHistory: dividendHistoryChartData,
        yieldOnCost: yieldOnCostChartData,
        dividendYield: dividendYieldChartData,
        benchmark: benchmarkChartData,
        benchmarkProfit: benchmarkProfitChartData,
        stockBuyHistory: stockBuyHistoryChartData,
        stockSellHistory: stockSellHistoryChartData,
      },
    };
  });

  return dashboardData;
};

// 계좌의 원금(principalAmount)을 업데이트 합니다.
const updatePrincipal = (
  account: AccountProps,
  transaction: TransactionProps, // 1 (입금: deposit) 또는 -1 (출금: withdrawal)
  multiplier: number,
) => {
  const currency: Currency = transaction.currency as Currency;
  const amount = transaction.price * transaction.quantity;
  if (currency === 'usd') {
    // USD 통화인 경우, USD 계좌는 원래 금액, KRW는 환율을 곱한 금액 적용
    account.usd.principalAmount += multiplier * amount;
    account.krw.principalAmount += multiplier * (amount * account.fxRate);
  } else if (currency === 'krw') {
    // KRW 통화인 경우, KRW 계좌는 원래 금액, USD는 환율로 나눈 금액 적용
    account.krw.principalAmount += multiplier * amount;
    account.usd.principalAmount += multiplier * (amount / account.fxRate);
  }
};

// 주어진 주식(stock)의 가격을 data.date 기준으로 업데이트합니다.
const updateStockPrice = (
  stock: { code: string; price: number },
  date: string,
  stockData: {
    code: string;
    prices: { date: string; preSplitClose: number }[];
  }[],
) => {
  // 주식 코드에 해당하는 데이터 찾기
  const stockInfo = stockData.find((item) => item.code === stock.code);
  if (!stockInfo) return;

  // 해당 날짜의 가격이 있는지 확인
  const currentPrice = stockInfo.prices.find((price) => price.date === date);
  if (currentPrice) {
    stock.price = currentPrice.preSplitClose;
  } else {
    // 찾지 못하면, 과거 데이터 중 가장 최근 데이터를 가져옵니다.
    const pastPrices = stockInfo.prices
      .filter((price) => price.date < date)
      .sort((a, b) => b.date.localeCompare(a.date));
    stock.price = pastPrices[0]?.preSplitClose ?? stock.price;
  }
};

// 날짜별 계좌정보 데이터 데이터 생성 (계좌정보와 그래프 표시용)
export const createAccountData = async (
  transactions: TransactionProps[],
  startDate?: string,
  endDate?: string,
) => {
  // 계좌 병합 시 계좌들의 날짜값들이 안 맞으면 값이 틀어짐. 병합할때 부족분을 더미로 넣는다면 환율과 주가정보 등 최신정보 반영이 불가능함. 따라서 여기서 당일 날짜로 받고 endDate를 줄이고 싶다면 데이터를 잘라서 쓰는게 맞을듯
  const today = timestampToDate(Math.floor(new Date().getTime() / 1000));
  const lastUpdated = transactions[transactions.length - 1]?.date; // 최근 업데이트 날짜

  // 시작 날짜와 종료 날짜가 없으면 첫 거래의 날짜와 오늘 날짜로 설정
  if (!startDate) {
    startDate = transactions[0]?.date;
  }
  if (!endDate) {
    endDate = today;
  }

  // 시작 날짜 기준으로 transactions 자르기
  const filteredTransactions = transactions.filter(
    (transaction) => new Date(transaction.date) >= new Date(startDate),
  );

  // 주식 종목 코드 데이터 가져오기 (중복제거 및 빈값 제거)
  const stockCodes = [
    ...new Set(filteredTransactions.map((transaction) => transaction.ISIN)),
  ].filter((code) => code !== '');

  const { stockData } = await getStockInfo(startDate, today, stockCodes); // 주식 정보 및 히스토리 데이터 가져오기
  const fxRates = stockData.find(
    (stock) => stock.code === USD_KRW_SYMBOL,
  )?.prices;

  const accountData = filteredTransactions
    .reduce(
      (acc, transaction) => {
        const account = structuredClone(acc[acc.length - 1]); // 직전 데이터 복사

        const currency: Currency = transaction.currency as Currency; // 통화 타입 지정

        account.date = transaction.date; // 날짜 업데이트
        account.lastUpdated = lastUpdated; // 최근 업데이트 날짜 추가

        // 환율이 존재하면 가져오고 없다면 이전 환율 사용
        const currentFxRate = fxRates.find(
          (data: StockHistoryProps) => data.date === transaction.date,
        )?.close;

        if (currentFxRate) {
          account.fxRate = currentFxRate;
        }

        // 예수금 업데이트
        account.usd.cash = transaction.usdCash;
        account.krw.cash = transaction.krwCash;

        switch (transaction.type) {
          case 'deposit':
            updatePrincipal(account, transaction, 1);
            break;
          case 'withdrawal':
            updatePrincipal(account, transaction, -1);
            break;
          case 'buy':
            const stockInfo = stockData.find(
              (stock) => stock.code === transaction.ISIN,
            );
            const stockToBuy = account[currency].stocks.find(
              (stock) => stock.code === transaction.ISIN,
            );

            // 주식 매수 이력 추가
            account[currency].stockTradeHistory.push({
              date: transaction.date,
              type: 'buy',
              pricesBySymbol: {
                [stockInfo?.symbol]: Array(transaction.quantity).fill(
                  transaction.price,
                ),
              },
            });

            if (!stockToBuy) {
              // 종목이 없으면 초기값과 정보 추가
              account[currency].stocks.push({
                shortName: stockInfo?.shortName,
                longName: stockInfo?.longName,
                symbol: stockInfo?.symbol,
                code: transaction.ISIN,
                balance: Array(transaction.quantity).fill({
                  date: transaction.date,
                  price: transaction.price,
                  fxRate: account.fxRate,
                }),
                price: transaction.price, // 기본값으로 매수 가격 넣기
              });
            } else {
              // 종목이 있으면 추가적인 정보만 삽입
              for (let i = 0; i < transaction.quantity; i++) {
                stockToBuy.balance.push({
                  date: transaction.date,
                  price: transaction.price,
                  fxRate: account.fxRate,
                });
              }
            }
            break;
          case 'sell':
            const stockToSell = account[currency].stocks.find(
              (stock) => stock.code === transaction.ISIN,
            );

            // 주식 매도 이력 추가
            account[currency].stockTradeHistory.push({
              date: transaction.date,
              type: 'sell',
              pricesBySymbol: {
                [stockToSell?.symbol!]: Array(transaction.quantity).fill(
                  transaction.price,
                ),
              },
            });

            // 잔고가 있으면 첫번째 값 제거
            if (stockToSell) {
              for (let i = 0; i < transaction.quantity; i++) {
                stockToSell.balance.shift();
              }
            }
            // 잔고가 비어있으면 삭제
            if (stockToSell?.balance.length === 0) {
              account[currency].stocks = account[currency].stocks.filter(
                (stock) => stock.code !== transaction.ISIN,
              );
            }
            break;
          case 'dividend': // 매년 배당금 누적 계산 (세전)
            const foundDividend = account[currency].dividends.find(
              (dividend) => dividend.date === transaction.date,
            );
            if (!foundDividend) {
              account[currency].dividends.push({
                date: transaction.date,
                price: transaction.price,
                fxRate: account.fxRate,
              });
            } else {
              foundDividend.price += transaction.price;
            }
            break;
          default:
            break;
        }

        return [...acc, account];
      },
      [
        {
          date: '',
          lastUpdated: '',
          fxRate: DEFAULT_FX_RATE,
          krw: {
            principalAmount: 0,
            dividends: [],
            cash: 0,
            stocks: [],
            stocksProfit: 0,
            stockTradeHistory: [],
            benchmarkValue: 0,
            benchmarkNetValue: 0,
          },
          usd: {
            principalAmount: 0,
            dividends: [],
            cash: 0,
            stocks: [],
            stocksProfit: 0,
            stockTradeHistory: [],
            benchmarkValue: 0,
            benchmarkNetValue: 0,
          },
        },
      ] as AccountProps[],
    )
    .slice(1); // 첫번째 빈 데이터 제거

  // 데이터가 없으면 직전 데이터를 넣고, 같은 날짜가 여러번 반복되는 경우는 마지막 데이터만 넣고 환율은 해당 날짜 환율로 업데이트
  let prevData = accountData[0];
  let prevFxRate = DEFAULT_FX_RATE;
  const filledAccountData = generateDateObjects(startDate, endDate).map(
    (date) => {
      const found = accountData.filter((item) => item.date === date.date);
      if (found.length > 0) {
        prevData = found[found.length - 1];
        return found[found.length - 1];
      }
      // 가장 최근의 데이터 가져오기
      const dummyData = structuredClone(prevData);
      dummyData.date = date.date;

      // 환율 업데이트 (데이터 사이에 빈 날짜가 있을 경우 환율도 그대로 복사되는데, 이때 환율을 업데이트)
      const foundFxRate = fxRates.find(
        (data: StockHistoryProps) => data.date === date.date,
      )?.close;
      if (foundFxRate) {
        dummyData.fxRate = foundFxRate;
        prevFxRate = foundFxRate;
      } else {
        dummyData.fxRate = prevFxRate;
      }

      return dummyData;
    },
  );

  // 날짜별 주식 현재가 및 MDD를 위한 주식 수익값 업데이트
  const updatedAccountData = filledAccountData.map((data) => {
    // usd와 krw 두 통화를 한 번에 처리합니다.
    (['usd', 'krw'] as const).forEach((currency) => {
      data[currency].stocks.forEach((stock) => {
        updateStockPrice(stock, data.date, stockData);
      });
      data[currency].stocksProfit = data[currency].stocks.reduce(
        (acc, stock) =>
          acc +
          stock.price * stock.balance.length -
          getAverage(stock.balance.map((item) => item.price)) *
            stock.balance.length,
        0,
      );
    });
    return data;
  });

  return updatedAccountData;
};

// 주식 및 환율 히스토리 데이터 호출
export const getStockInfo = async (
  startDate: string,
  endDate: string,
  stockCodes: string[],
) => {
  stockCodes.push(USD_KRW_SYMBOL); // 환율 심볼 추가

  // 종목코드를 바탕으로 종목 정보와 히스토리 데이터 가져오기
  const stockData = await Promise.allSettled(
    stockCodes.map(async (code) => {
      try {
        const parsedCode = code.startsWith('A') ? code.split('A').at(-1) : code;
        const searchResponse = await axios.get(`/api/search/${parsedCode}`);
        const { symbol, shortName, longName } = searchResponse.data;

        const priceResponse = await axios.get(
          `/api/history/${symbol}?startDate=${dateToTimestamp(
            startDate,
          )}&endDate=${dateToTimestamp(endDate)}`,
        );

        return {
          code,
          symbol,
          shortName,
          longName,
          prices: priceResponse.data,
        };
      } catch (error: any) {
        const failedApi = error.config?.url?.includes('/api/search')
          ? 'Search API'
          : 'Price API';

        throw {
          code, // 종목 코드
          api: failedApi, // 실패한 API 종류
          status: error.response?.status || 'Network Error', // HTTP 상태 코드 (네트워크 오류일 경우 메시지)
          message: error.response?.data?.message || error.message, // API 응답 메시지 또는 기본 오류 메시지
        };
      }
    }),
  );

  stockData.forEach((result) => {
    if (result.status === 'rejected') {
      const { api, code, message, status } = result.reason;
      toast.error(
        `🚨 ${api} failed!\nStock Code: ${code}\nError: ${message} (Status: ${status})`,
      );
    }
  });

  return {
    stockData: stockData
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value),
  };
};

// 여러개의 계좌 데이터 병합
export const mergeAccountData = (
  accountDataArray: {
    name: string;
    accountData: AccountProps[];
    benchmarkData?: {
      date: string;
      benchmarkValueKrw: number;
      benchmarkValueUsd: number;
      benchmarkNetValueKrw: number;
      benchmarkNetValueUsd: number;
    }[];
  }[],
): AccountProps[] => {
  // Helper: merge two dividend arrays (같은 날짜의 dividend 데이터를 입력받아야 함)
  const mergeDividends = (arr1: DividendProps[], arr2: DividendProps[]) => {
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

  // Helper: merge stocks arrays by code (같은 날짜의 stock 데이터를 입력받아야 함)
  const mergeStocks = (arr1: StockProps[], arr2: StockProps[]) => {
    const stockMap = new Map<string, StockProps>();

    const addStocks = (stocks: StockProps[]) => {
      stocks.forEach((stock) => {
        if (stockMap.has(stock.code)) {
          const existing = stockMap.get(stock.code)!;
          // concatenate balances; use the price from the latest entry (arr2 overrides)
          existing.balance = existing.balance.concat(stock.balance); //
        } else {
          stockMap.set(stock.code, { ...stock });
        }
      });
    };

    addStocks(arr1);
    addStocks(arr2);

    return Array.from(stockMap.values());
  };

  // 계좌 데이터를 날짜별로 합치기 위해 Map을 사용
  const mergedMap = new Map<string, AccountProps>();

  const _accountDataArray = structuredClone(accountDataArray); // Deep copy

  // Iterate through all accounts and each accountData within
  _accountDataArray.forEach((account) => {
    account.accountData.forEach((data) => {
      const date = data.date;
      if (!mergedMap.has(date)) {
        mergedMap.set(date, { ...data });
      } else {
        // 이미 있는 날짜의 데이터가 있으면, 해당 데이터를 가져와서 새로운 데이터와 합침
        const merged = mergedMap.get(date)!;
        merged.lastUpdated = getLatestDate(
          merged.lastUpdated,
          data.lastUpdated,
        );

        (['usd', 'krw'] as const).forEach((currency) => {
          merged[currency].principalAmount += data[currency].principalAmount;
          merged[currency].cash += data[currency].cash;
          merged[currency].stocksProfit += data[currency].stocksProfit;
          merged[currency].dividends = mergeDividends(
            merged[currency].dividends,
            data[currency].dividends,
          );
          merged[currency].stocks = mergeStocks(
            merged[currency].stocks,
            data[currency].stocks,
          );
        });
      }
    });

    // Benchmark data 병합
    if (account.benchmarkData) {
      account.benchmarkData.forEach((benchmark) => {
        const date = benchmark.date;
        const merged = mergedMap.get(date)!; // merged는 반드시 존재해야 함

        // benchmarkValue, benchmarkNetValue 값이 없으면 0으로 초기화 하고 누적 합산
        merged['krw'].benchmarkValue =
          (merged['krw'].benchmarkValue ?? 0) + benchmark.benchmarkValueKrw;
        merged['usd'].benchmarkValue =
          (merged['usd'].benchmarkValue ?? 0) + benchmark.benchmarkValueUsd;
        merged['krw'].benchmarkNetValue =
          (merged['krw'].benchmarkNetValue ?? 0) +
          benchmark.benchmarkNetValueKrw;
        merged['usd'].benchmarkNetValue =
          (merged['usd'].benchmarkNetValue ?? 0) +
          benchmark.benchmarkNetValueUsd;
      });
    }
  });

  const mergedArray: AccountProps[] = Array.from(mergedMap.values()).sort(
    (a, b) => a.date.localeCompare(b.date),
  );

  return mergedArray;
};
