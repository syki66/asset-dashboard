import {
  AccountProps,
  Currency,
  StockHistoryProps,
  TransactionProps,
  DashboardProps,
  ChartProps,
  StockProps,
  StockTradeHistoryChartProps,
  type PrincipalAdjustment,
  type DashboardCharts,
  type DashboardDataset,
  type DashboardSnapshot,
  type ReadonlyAccountProps,
  type ReadonlyMergeAccountDataInput,
} from '@/types';
import {
  dateToTimestamp,
  generateDateObjects,
  getLatestDate,
  timestampToDate,
} from './format';
import {
  mergeDividends,
  mergeStocks,
  mergeStockTradeHistory,
} from './mergeHelpers';
import {
  calculateXIRRBatch,
  compileCashFlows,
  type CashFlow,
} from './xirr';
import { annualizeTwr, calculateTwrFactor } from './twr';
import axios from 'axios';
import { toast } from 'sonner';
import { USD_KRW_SYMBOL, DEFAULT_FX_RATE } from '@/constants/keywords';
import { getAverage } from './math';
import { differenceInCalendarDays } from 'date-fns';
import {
  updateYearPerformance,
  type YearPerformanceState,
} from './year-performance';
import {
  calculateSharpeRatio,
  calculateVolatility,
  getAnnualRiskFreeRate,
  isWeekendDate,
  toRoundedRiskMetric,
} from './risk';
import { useInterestRateStore } from '@/store/account';
import { useFeeSettingsStore } from '@/store/fee-settings';

/**
 * 계좌 이력을 날짜별 요약(`snapshots`)과 한 벌의 전체 차트(`charts`)로 변환합니다.
 * 대시보드 페이지 이동 시 재계산하지 않도록 전체 기간 MWR도 여기서 미리 계산합니다.
 * 각 스냅샷에 차트 배열을 복제하지 않아 기간이 길어져도 메모리가 중복되지 않습니다.
 */
export const convertToDashboardData = (
  accountData: readonly ReadonlyAccountProps[],
  currency: Currency,
): DashboardDataset => {
  // 자산 증감 내역 차트용 데이터
  const principalChartData: ChartProps[] = [];
  const currentValueChartData: ChartProps[] = [];
  const netCurrentValueChartData: ChartProps[] = [];
  const profitChartData: ChartProps[] = [];
  const netProfitChartData: ChartProps[] = [];
  const returnRateChartData: ChartProps[] = [];
  const netReturnRateChartData: ChartProps[] = [];
  const benchmarkBestReturnRateChartData: ChartProps[] = [];
  const benchmarkBestNetReturnRateChartData: ChartProps[] = [];
  const benchmarkWorstReturnRateChartData: ChartProps[] = [];
  const benchmarkWorstNetReturnRateChartData: ChartProps[] = [];
  const mwrChartData: ChartProps[] = [];
  const netMwrChartData: ChartProps[] = [];
  const twrChartData: ChartProps[] = [];
  const netTwrChartData: ChartProps[] = [];
  const cagrChartData: ChartProps[] = [];
  const netCagrChartData: ChartProps[] = [];
  const averageAnnualReturnChartData: ChartProps[] = [];
  const netAverageAnnualReturnChartData: ChartProps[] = [];
  const drawdownChartData: ChartProps[] = [];
  const bestSharpeRatioChartData: ChartProps[] = [];
  const worstSharpeRatioChartData: ChartProps[] = [];
  const volatilityChartData: ChartProps[] = [];
  const yieldOnCostChartData: ChartProps[] = [];
  const yieldOnCostChartDataNet: ChartProps[] = [];
  const dividendYieldChartData: ChartProps[] = [];
  const dividendYieldChartDataNet: ChartProps[] = [];
  const benchmarkBestChartData: ChartProps[] = [];
  const benchmarkBestNetChartData: ChartProps[] = [];
  const benchmarkBestProfitChartData: ChartProps[] = [];
  const benchmarkBestNetProfitChartData: ChartProps[] = [];
  const benchmarkWorstChartData: ChartProps[] = [];
  const benchmarkWorstNetChartData: ChartProps[] = [];
  const benchmarkWorstProfitChartData: ChartProps[] = [];
  const benchmarkWorstNetProfitChartData: ChartProps[] = [];
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

  // MWR 계산용 현금흐름 배열 및 이전 원금
  const cashFlows: CashFlow[] = [];
  let prevPrincipal = 0;
  const yearPerformanceMap = new Map<string, YearPerformanceState>();

  // TWR 계산용 이전 평가금 및 누적 수익 배율
  let prevCurrentValueForTwr = 0;
  let prevNetCurrentValueForTwr = 0;
  let prevBenchmarkBestValueForTwr = 0;
  let prevBenchmarkBestNetValueForTwr = 0;
  let prevBenchmarkWorstValueForTwr = 0;
  let prevBenchmarkWorstNetValueForTwr = 0;
  let twrFactor = 1;
  let netTwrFactor = 1;
  let benchmarkBestTwrFactor = 1;
  let benchmarkBestNetTwrFactor = 1;
  let benchmarkWorstTwrFactor = 1;
  let benchmarkWorstNetTwrFactor = 1;
  const rollingRiskReturns: number[] = [];
  // 주말을 제외한 최근 90개 거래일 수익률로 샤프지수와 변동성을 계산합니다.
  const rollingRiskWindow = 90;
  const { bestInterestRates, worstInterestRates } =
    useInterestRateStore.getState();
  const { feeSettings } = useFeeSettingsStore.getState();
  const {
    exchangeSpreadRate,
    exchangeFeeRate,
    krBrokerFeeRate,
    krRegulatoryFeeRate,
    krTransferTaxRate,
    usBrokerFeeRate,
    usCapitalGainsTaxRate,
    usSecFeeRate,
    usDividendTaxRate,
    krDividendTaxRate,
  } = feeSettings;

  const getDividendTaxRate = (
    dividendSource: 'domestic' | 'foreign' | undefined,
  ) => (dividendSource === 'foreign' ? usDividendTaxRate : krDividendTaxRate);

  // 스냅샷에는 날짜별 숫자 지표만 저장하고, stocks와 charts는 조회 시 결합합니다.
  const snapshots: DashboardSnapshot[] = accountData.map(
    (account: ReadonlyAccountProps) => {
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

    const usEstimatedProfit = account.usd.stocks.reduce(
      (acc, stock) =>
        acc +
        stock.balance
          .map((item) => {
            const profit =
              stock.price * account.fxRate - item.price * item.fxRate;
            const fee =
              (stock.price * account.fxRate + item.price * item.fxRate) *
              (usBrokerFeeRate + usSecFeeRate);
            return profit - fee;
          })
          .reduce((a, b) => a + b, 0),
      0,
    ); // 미국주식 양도소득세 계산을 위한 추정손익 (원화로 계산, 거래수수료 비용 제외 적용)

    // 세금 및 제비용
    const krBrokerFee =
      currency === 'usd'
        ? (krwStockValue / account.fxRate) * krBrokerFeeRate
        : krwStockValue * krBrokerFeeRate; // 국내 주식 증권사 수수료
    const krRegulatoryFee =
      currency === 'usd'
        ? (krwStockValue / account.fxRate) * krRegulatoryFeeRate
        : krwStockValue * krRegulatoryFeeRate; // 국내 유관기관수수료
    const krTransferTax =
      currency === 'usd'
        ? (krwStockValue / account.fxRate) * krTransferTaxRate
        : krwStockValue * krTransferTaxRate; // 국내 주식 증권거래세

    const usBrokerFee =
      currency === 'usd'
        ? usdStockValue * usBrokerFeeRate
        : usdStockValue * account.fxRate * usBrokerFeeRate; // 미국 주식 증권사 수수료
    const usSecFee =
      currency === 'usd'
        ? usdStockValue * usSecFeeRate
        : usdStockValue * account.fxRate * usSecFeeRate; // 미국 SEC Fee
    const usFxFee =
      currency === 'usd'
        ? (usdStockValue + account.usd.cash) *
          exchangeFeeRate *
          exchangeSpreadRate
        : (usdStockValue + account.usd.cash) *
          account.fxRate *
          exchangeFeeRate *
          exchangeSpreadRate; // 미국 주식 환전 수수료
    const usTax =
      usEstimatedProfit * usCapitalGainsTaxRate > 0
        ? currency === 'usd'
          ? (usEstimatedProfit * usCapitalGainsTaxRate) / account.fxRate // usEstimatedProfit이 원화로 계산됨
          : usEstimatedProfit * usCapitalGainsTaxRate
        : 0; // 미국 주식 양도소득세 (마이너스일 경우 0원 처리)

    const totalTaxFee =
      usBrokerFee +
      usSecFee +
      usTax +
      usFxFee +
      krBrokerFee +
      krRegulatoryFee +
      krTransferTax;

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
    const calculateAverageAnnualReturn = (value: number) =>
      years > 0
        ? Number(((((value - principal) / principal) * 100) / years).toFixed(2))
        : 0;

    const cagr =
      years > 0
        ? Number(
            ((Math.pow(currentValue / principal, 1 / years) - 1) * 100).toFixed(
              2,
            ),
          )
        : 0;
    const averageAnnualReturn = calculateAverageAnnualReturn(currentValue);

    const netCagr =
      years > 0
        ? Number(
            (
              (Math.pow(netCurrentValue / principal, 1 / years) - 1) *
              100
            ).toFixed(2),
          )
        : 0;
    const netAverageAnnualReturn =
      calculateAverageAnnualReturn(netCurrentValue);

    const {
      bestYear,
      worstYear,
      netBestYear,
      netWorstYear,
      yearlyProfits,
      netYearlyProfits,
    } = updateYearPerformance({
      yearPerformanceMap,
      date: account.date,
      profit,
      netProfit,
    });

    // MWR 계산
    const netDeposit = principal - prevPrincipal;
    if (netDeposit !== 0) {
      cashFlows.push({ date: account.date, amount: -netDeposit });
    }
    prevPrincipal = principal;

    let mwr = 0;
    let netMwr = 0;
    let benchmarkBestMwr = 0;
    let benchmarkBestNetMwr = 0;
    let benchmarkWorstMwr = 0;
    let benchmarkWorstNetMwr = 0;

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

    const netDividendsKrw = account.krw.dividends
      .filter((dividend) => {
        const dividendDate = new Date(dividend.date);
        return dividendDate >= oneYearAgo;
      })
      .reduce((acc, dividend) => {
        const taxRate = getDividendTaxRate(dividend.dividendSource);
        const netPrice = dividend.price * (1 - taxRate);
        return currency === 'usd'
          ? acc + netPrice / dividend.fxRate
          : acc + netPrice;
      }, 0);

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

    const netDividendsUsd = account.usd.dividends
      .filter((dividend) => {
        const dividendDate = new Date(dividend.date);
        return dividendDate >= oneYearAgo;
      })
      .reduce((acc, dividend) => {
        const taxRate = getDividendTaxRate(dividend.dividendSource);
        const netPrice = dividend.price * (1 - taxRate);
        return currency === 'usd'
          ? acc + netPrice
          : acc + netPrice * dividend.fxRate;
      }, 0);

    const annualDividends = dividendsUsd + dividendsKrw; // 위에서 이미 환전처리 되어있음
    const netAnnualDividends = netDividendsUsd + netDividendsKrw; // 위에서 이미 환전처리 되어있음

    // 배당금 (전체기간)
    const totalDividendsKrw = account.krw.dividends.reduce(
      (acc, dividend) =>
        currency === 'usd'
          ? acc + dividend.price / dividend.fxRate
          : acc + dividend.price,
      0,
    );
    const netTotalDividendsKrw = account.krw.dividends.reduce(
      (acc, dividend) => {
        const taxRate = getDividendTaxRate(dividend.dividendSource);
        const netPrice = dividend.price * (1 - taxRate);
        return currency === 'usd'
          ? acc + netPrice / dividend.fxRate
          : acc + netPrice;
      },
      0,
    );
    const totalDividendsUsd = account.usd.dividends.reduce(
      (acc, dividend) =>
        currency === 'usd'
          ? acc + dividend.price
          : acc + dividend.price * dividend.fxRate,
      0,
    );
    const netTotalDividendsUsd = account.usd.dividends.reduce(
      (acc, dividend) => {
        const taxRate = getDividendTaxRate(dividend.dividendSource);
        const netPrice = dividend.price * (1 - taxRate);
        return currency === 'usd'
          ? acc + netPrice
          : acc + netPrice * dividend.fxRate;
      },
      0,
    );
    const totalDividends = totalDividendsUsd + totalDividendsKrw;
    const netTotalDividends = netTotalDividendsUsd + netTotalDividendsKrw;

    // 원금대비배당률
    const yieldOnCost = Number(
      ((annualDividends / principal) * 100).toFixed(2),
    );
    const netYieldOnCost = Number(
      ((netAnnualDividends / principal) * 100).toFixed(2),
    );

    // 평가금대비배당률
    const dividendYield = Number(
      ((annualDividends / currentValue) * 100).toFixed(2),
    );
    const netDividendYield = Number(
      ((netAnnualDividends / currentValue) * 100).toFixed(2),
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

    //////////////////////////////////////////////////////
    // 최상의 벤치마크 데이터 가공
    /////////////////////////////////////////////////////
    // 최상의 벤치마크 평가금
    const benchmarkBestValue =
      currency === 'usd'
        ? account.usd.benchmarkBestValue
        : account.krw.benchmarkBestValue;

    // 최상의 벤치마크 수익금
    const benchmarkBestProfit = benchmarkBestValue - principal;

    // 최상의 벤치마크 수익률
    const benchmarkBestReturnRate = Number(
      (((benchmarkBestValue - principal) / principal) * 100).toFixed(2),
    );

    // 최상의 벤치마크 CAGR
    const benchmarkBestCagr =
      years > 0
        ? Number(
            (
              (Math.pow(benchmarkBestValue / principal, 1 / years) - 1) *
              100
            ).toFixed(2),
          )
        : 0;
    const benchmarkBestAverageAnnualReturn =
      calculateAverageAnnualReturn(benchmarkBestValue);

    // 최상의 벤치마크 초과수익
    const benchmarkBestExcessReturn = -(profit - benchmarkBestProfit);

    // 최상의 벤치마크 순평가금
    const benchmarkBestNetValue =
      currency === 'usd'
        ? account.usd.benchmarkBestNetValue
        : account.krw.benchmarkBestNetValue;

    // 최상의 벤치마크 순수익금
    const benchmarkBestNetProfit = benchmarkBestNetValue - principal;

    // 최상의 벤치마크 순수익률
    const benchmarkBestNetReturnRate = Number(
      (((benchmarkBestNetValue - principal) / principal) * 100).toFixed(2),
    );

    // 최상의 벤치마크 순 CAGR
    const benchmarkBestNetCagr =
      years > 0
        ? Number(
            (
              (Math.pow(benchmarkBestNetValue / principal, 1 / years) - 1) *
              100
            ).toFixed(2),
          )
        : 0;
    const benchmarkBestNetAverageAnnualReturn =
      calculateAverageAnnualReturn(benchmarkBestNetValue);

    // 최상의 벤치마크 순초과수익
    const benchmarkBestNetExcessReturn = -(netProfit - benchmarkBestNetProfit);

    // 벤치마크 평가금 (최악의 케이스)
    const benchmarkWorstValue =
      currency === 'usd'
        ? account.usd.benchmarkWorstValue
        : account.krw.benchmarkWorstValue;

    // 벤치마크 수익금 (최악의 케이스)
    const benchmarkWorstProfit = benchmarkWorstValue - principal;

    // 벤치마크 수익률 (최악의 케이스)
    const benchmarkWorstReturnRate = Number(
      (((benchmarkWorstValue - principal) / principal) * 100).toFixed(2),
    );

    // 벤치마크 CAGR (최악의 케이스)
    const benchmarkWorstCagr =
      years > 0
        ? Number(
            (
              (Math.pow(benchmarkWorstValue / principal, 1 / years) - 1) *
              100
            ).toFixed(2),
          )
        : 0;
    const benchmarkWorstAverageAnnualReturn =
      calculateAverageAnnualReturn(benchmarkWorstValue);

    // 벤치마크 초과수익 (최악의 케이스)
    const benchmarkWorstExcessReturn = -(profit - benchmarkWorstProfit);

    // 벤치마크 (최악의 케이스) 순평가금
    const benchmarkWorstNetValue =
      currency === 'usd'
        ? account.usd.benchmarkWorstNetValue
        : account.krw.benchmarkWorstNetValue;

    // 벤치마크 (최악의 케이스) 순수익금
    const benchmarkWorstNetProfit = benchmarkWorstNetValue - principal;

    // 벤치마크 (최악의 케이스) 순수익률
    const benchmarkWorstNetReturnRate = Number(
      (((benchmarkWorstNetValue - principal) / principal) * 100).toFixed(2),
    );

    // 벤치마크 (최악의 케이스) 순 CAGR
    const benchmarkWorstNetCagr =
      years > 0
        ? Number(
            (
              (Math.pow(benchmarkWorstNetValue / principal, 1 / years) - 1) *
              100
            ).toFixed(2),
          )
        : 0;
    const benchmarkWorstNetAverageAnnualReturn = calculateAverageAnnualReturn(
      benchmarkWorstNetValue,
    );

    // 벤치마크 (최악의 케이스) 순초과수익
    const benchmarkWorstNetExcessReturn = -(
      netProfit - benchmarkWorstNetProfit
    );

    // 계좌 적용 시 모든 날짜의 MWR 6종을 선계산해 페이지 이동 재계산을 없앱니다.
    if (cashFlows.length > 0) {
      const compiledCashFlows = compileCashFlows(cashFlows, {
        assumeSorted: true,
      });
      const xirrResults = calculateXIRRBatch(
        compiledCashFlows,
        [
          { date: account.date, amount: currentValue },
          { date: account.date, amount: netCurrentValue },
          { date: account.date, amount: benchmarkBestValue },
          { date: account.date, amount: benchmarkBestNetValue },
          { date: account.date, amount: benchmarkWorstValue },
          { date: account.date, amount: benchmarkWorstNetValue },
        ],
      );

      [
        mwr,
        netMwr,
        benchmarkBestMwr,
        benchmarkBestNetMwr,
        benchmarkWorstMwr,
        benchmarkWorstNetMwr,
      ] = xirrResults;
    }

    // TWR 계산
    const dailyTwrFactor = calculateTwrFactor(
      currentValue,
      prevCurrentValueForTwr,
      netDeposit,
    );
    twrFactor *= dailyTwrFactor;
    netTwrFactor *= calculateTwrFactor(
      netCurrentValue,
      prevNetCurrentValueForTwr,
      netDeposit,
    );
    benchmarkBestTwrFactor *= calculateTwrFactor(
      benchmarkBestValue,
      prevBenchmarkBestValueForTwr,
      netDeposit,
    );
    benchmarkBestNetTwrFactor *= calculateTwrFactor(
      benchmarkBestNetValue,
      prevBenchmarkBestNetValueForTwr,
      netDeposit,
    );
    benchmarkWorstTwrFactor *= calculateTwrFactor(
      benchmarkWorstValue,
      prevBenchmarkWorstValueForTwr,
      netDeposit,
    );
    benchmarkWorstNetTwrFactor *= calculateTwrFactor(
      benchmarkWorstNetValue,
      prevBenchmarkWorstNetValueForTwr,
      netDeposit,
    );

    const twr = annualizeTwr(twrFactor, years);
    const netTwr = annualizeTwr(netTwrFactor, years);
    const benchmarkBestTwr = annualizeTwr(benchmarkBestTwrFactor, years);
    const benchmarkBestNetTwr = annualizeTwr(benchmarkBestNetTwrFactor, years);
    const benchmarkWorstTwr = annualizeTwr(benchmarkWorstTwrFactor, years);
    const benchmarkWorstNetTwr = annualizeTwr(
      benchmarkWorstNetTwrFactor,
      years,
    );
    // 주말 스냅샷은 금요일 가격 복사값이라 리스크 지표의 0% 수익률 왜곡을 막기 위해 제외합니다.
    if (!isWeekendDate(account.date)) {
      rollingRiskReturns.push(dailyTwrFactor - 1);
      if (rollingRiskReturns.length > rollingRiskWindow) {
        rollingRiskReturns.shift();
      }
    }
    const bestSharpeRatio = toRoundedRiskMetric(
      calculateSharpeRatio(
        rollingRiskReturns,
        getAnnualRiskFreeRate(bestInterestRates, account.date),
      ),
    );
    const worstSharpeRatio = toRoundedRiskMetric(
      calculateSharpeRatio(
        rollingRiskReturns,
        getAnnualRiskFreeRate(worstInterestRates, account.date),
      ),
    );
    const volatility = toRoundedRiskMetric(
      calculateVolatility(rollingRiskReturns) * 100,
    );

    prevCurrentValueForTwr = currentValue;
    prevNetCurrentValueForTwr = netCurrentValue;
    prevBenchmarkBestValueForTwr = benchmarkBestValue;
    prevBenchmarkBestNetValueForTwr = benchmarkBestNetValue;
    prevBenchmarkWorstValueForTwr = benchmarkWorstValue;
    prevBenchmarkWorstNetValueForTwr = benchmarkWorstNetValue;

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

    // 세후 평가금 차트
    netCurrentValueChartData.push({
      date: account.date,
      value: netCurrentValue,
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

    // 수익률 분석 차트
    returnRateChartData.push({
      date: account.date,
      value: returnRate,
    });
    netReturnRateChartData.push({
      date: account.date,
      value: netReturnRate,
    });
    benchmarkBestReturnRateChartData.push({
      date: account.date,
      value: benchmarkBestReturnRate,
    });
    benchmarkBestNetReturnRateChartData.push({
      date: account.date,
      value: benchmarkBestNetReturnRate,
    });
    benchmarkWorstReturnRateChartData.push({
      date: account.date,
      value: benchmarkWorstReturnRate,
    });
    benchmarkWorstNetReturnRateChartData.push({
      date: account.date,
      value: benchmarkWorstNetReturnRate,
    });
    mwrChartData.push({
      date: account.date,
      value: mwr,
    });
    netMwrChartData.push({
      date: account.date,
      value: netMwr,
    });
    twrChartData.push({
      date: account.date,
      value: twr,
    });
    netTwrChartData.push({
      date: account.date,
      value: netTwr,
    });
    cagrChartData.push({
      date: account.date,
      value: cagr,
    });
    netCagrChartData.push({
      date: account.date,
      value: netCagr,
    });
    averageAnnualReturnChartData.push({
      date: account.date,
      value: averageAnnualReturn,
    });
    netAverageAnnualReturnChartData.push({
      date: account.date,
      value: netAverageAnnualReturn,
    });

    // MDD 차트
    drawdownChartData.push({
      date: account.date,
      value: drawdown,
    });
    bestSharpeRatioChartData.push({
      date: account.date,
      value: bestSharpeRatio,
    });
    worstSharpeRatioChartData.push({
      date: account.date,
      value: worstSharpeRatio,
    });
    volatilityChartData.push({
      date: account.date,
      value: volatility,
    });

    // Yield on Cost 차트 데이터
    yieldOnCostChartData.push({
      date: account.date,
      value: yieldOnCost,
    });
    yieldOnCostChartDataNet.push({
      date: account.date,
      value: netYieldOnCost,
    });

    // 배당금 수익률 차트 데이터
    dividendYieldChartData.push({
      date: account.date,
      value: dividendYield,
    });
    dividendYieldChartDataNet.push({
      date: account.date,
      value: netDividendYield,
    });

    // 최상의 벤치마크 차트 데이터
    benchmarkBestChartData.push({
      date: account.date,
      value: benchmarkBestValue,
    });

    // 최상의 벤치마크 세후 차트 데이터
    benchmarkBestNetChartData.push({
      date: account.date,
      value: benchmarkBestNetValue,
    });

    // 최상의 벤치마크 수익금 차트 데이터
    benchmarkBestProfitChartData.push({
      date: account.date,
      value: benchmarkBestProfit,
    });

    // 최상의 벤치마크 세후 수익금 차트 데이터
    benchmarkBestNetProfitChartData.push({
      date: account.date,
      value: benchmarkBestNetProfit,
    });

    // 벤치마크 (최악의 케이스) 차트 데이터
    benchmarkWorstChartData.push({
      date: account.date,
      value: benchmarkWorstValue,
    });

    // 벤치마크 (최악의 케이스) 세후 차트 데이터
    benchmarkWorstNetChartData.push({
      date: account.date,
      value: benchmarkWorstNetValue,
    });

    // 벤치마크 (최악의 케이스) 수익금 차트 데이터
    benchmarkWorstProfitChartData.push({
      date: account.date,
      value: benchmarkWorstProfit,
    });

    // 벤치마크 (최악의 케이스) 세후 수익금 차트 데이터
    benchmarkWorstNetProfitChartData.push({
      date: account.date,
      value: benchmarkWorstNetProfit,
    });

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
        averageAnnualReturn,
        netAverageAnnualReturn,
        mwr,
        netMwr,
        twr,
        netTwr,
        bestYear,
        worstYear,
        netBestYear,
        netWorstYear,
        yearlyProfits,
        netYearlyProfits,
      },
      dividends: {
        annualDividends,
        netAnnualDividends,
        totalDividends,
        netTotalDividends,
        dividendYield,
        netDividendYield,
        yieldOnCost,
        netYieldOnCost,
      },
      cash: {
        total: cashValue,
        usdCash: account.usd.cash,
        krwCash: account.krw.cash,
      },
      costs: {
        totalCost: totalTaxFee,
        krBrokerFee,
        krRegulatoryFee,
        krTransferTax,
        usBrokerFee,
        usSecFee,
        usFxFee,
        usTax,
      },
      benchmarkBest: {
        value: benchmarkBestValue,
        netValue: benchmarkBestNetValue,
        profit: benchmarkBestProfit,
        netProfit: benchmarkBestNetProfit,
        returnRate: benchmarkBestReturnRate,
        netReturnRate: benchmarkBestNetReturnRate,
        cagr: benchmarkBestCagr,
        netCagr: benchmarkBestNetCagr,
        averageAnnualReturn: benchmarkBestAverageAnnualReturn,
        netAverageAnnualReturn: benchmarkBestNetAverageAnnualReturn,
        mwr: benchmarkBestMwr,
        netMwr: benchmarkBestNetMwr,
        twr: benchmarkBestTwr,
        netTwr: benchmarkBestNetTwr,
        excessReturn: benchmarkBestExcessReturn,
        netExcessReturn: benchmarkBestNetExcessReturn,
      },
      benchmarkWorst: {
        value: benchmarkWorstValue,
        netValue: benchmarkWorstNetValue,
        profit: benchmarkWorstProfit,
        netProfit: benchmarkWorstNetProfit,
        returnRate: benchmarkWorstReturnRate,
        netReturnRate: benchmarkWorstNetReturnRate,
        cagr: benchmarkWorstCagr,
        netCagr: benchmarkWorstNetCagr,
        averageAnnualReturn: benchmarkWorstAverageAnnualReturn,
        netAverageAnnualReturn: benchmarkWorstNetAverageAnnualReturn,
        mwr: benchmarkWorstMwr,
        netMwr: benchmarkWorstNetMwr,
        twr: benchmarkWorstTwr,
        netTwr: benchmarkWorstNetTwr,
        excessReturn: benchmarkWorstExcessReturn,
        netExcessReturn: benchmarkWorstNetExcessReturn,
      },
      drawdown: {
        maxDrawdown: -maxDrawdown,
        maxDrawdownStartDate,
        maxDrawdownEndDate,
        recoveryDuration,
        maxDailyDrawdown: -maxDailyDrawdown,
        maxDailyDrawdownDate,
        bestSharpeRatio,
        worstSharpeRatio,
        volatility,
      },
    };
    },
  );

  // 배당·거래는 날짜가 지날수록 누적되므로 마지막 계좌에 전체 이력이 들어 있습니다.
  // 매 스냅샷을 다시 순회하지 않고 여기서 한 번만 차트 형태로 변환합니다.
  const latestAccount = accountData.at(-1);
  const dividendHistoryChartData: ChartProps[] = latestAccount
    ? [
        ...latestAccount.usd.dividends.map((dividend) => ({
          date: dividend.date,
          value:
            currency === 'usd'
              ? dividend.price
              : dividend.price * dividend.fxRate,
        })),
        ...latestAccount.krw.dividends.map((dividend) => ({
          date: dividend.date,
          value:
            currency === 'usd'
              ? dividend.price / dividend.fxRate
              : dividend.price,
        })),
      ]
    : [];
  const dividendHistoryChartDataNet: ChartProps[] = latestAccount
    ? [
        ...latestAccount.usd.dividends.map((dividend) => {
          const netPrice =
            dividend.price *
            (1 - getDividendTaxRate(dividend.dividendSource));
          return {
            date: dividend.date,
            value:
              currency === 'usd' ? netPrice : netPrice * dividend.fxRate,
          };
        }),
        ...latestAccount.krw.dividends.map((dividend) => {
          const netPrice =
            dividend.price *
            (1 - getDividendTaxRate(dividend.dividendSource));
          return {
            date: dividend.date,
            value:
              currency === 'usd' ? netPrice / dividend.fxRate : netPrice,
          };
        }),
      ]
    : [];

  dividendHistoryChartData.sort((a, b) => a.date.localeCompare(b.date));
  dividendHistoryChartDataNet.sort((a, b) => a.date.localeCompare(b.date));

  // 최신 누적 거래 이력도 한 번만 통화 변환하고, 과거 조회에서는 날짜로 잘라 씁니다.
  const toStockTradeHistoryChart = (
    account: ReadonlyAccountProps,
  ): StockTradeHistoryChartProps[] => {
    const krwStockTradeHistory = account.krw.stockTradeHistory.map(
      (trade) => ({
        date: trade.date,
        type: trade.type,
        quantityBySymbol: Object.fromEntries(
          Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
            symbol,
            prices.length,
          ]),
        ),
        priceBySymbol: Object.fromEntries(
          Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
            symbol,
            prices.reduce(
              (sum, price) =>
                currency === 'usd' ? sum + price / trade.fxRate : sum + price,
              0,
            ),
          ]),
        ),
        namesBySymbol: Object.fromEntries(
          Object.keys(trade.pricesBySymbol).map((symbol) => [
            symbol,
            trade.namesBySymbol?.[symbol] ?? symbol,
          ]),
        ),
      }),
    );
    const usdStockTradeHistory = account.usd.stockTradeHistory.map(
      (trade) => ({
        date: trade.date,
        type: trade.type,
        quantityBySymbol: Object.fromEntries(
          Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
            symbol,
            prices.length,
          ]),
        ),
        priceBySymbol: Object.fromEntries(
          Object.entries(trade.pricesBySymbol).map(([symbol, prices]) => [
            symbol,
            prices.reduce(
              (sum, price) =>
                currency === 'usd' ? sum + price : sum + price * trade.fxRate,
              0,
            ),
          ]),
        ),
        namesBySymbol: Object.fromEntries(
          Object.keys(trade.pricesBySymbol).map((symbol) => [symbol, symbol]),
        ),
      }),
    );

    return [...krwStockTradeHistory, ...usdStockTradeHistory].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  };
  const stockTradeHistoryChartData = latestAccount
    ? toStockTradeHistoryChart(latestAccount)
    : [];

  // 원본 계좌 이력은 readonly 기초 데이터로 보관해 선택 날짜의 stocks만 나중에 구성합니다.
  return {
    snapshots,
    accountData,
    currency,
    charts: {
      principal: principalChartData,
      currentValue: currentValueChartData,
      netCurrentValue: netCurrentValueChartData,
      profit: profitChartData,
      netProfit: netProfitChartData,
      returnRate: returnRateChartData,
      netReturnRate: netReturnRateChartData,
      benchmarkBestReturnRate: benchmarkBestReturnRateChartData,
      benchmarkBestNetReturnRate: benchmarkBestNetReturnRateChartData,
      benchmarkWorstReturnRate: benchmarkWorstReturnRateChartData,
      benchmarkWorstNetReturnRate: benchmarkWorstNetReturnRateChartData,
      mwr: mwrChartData,
      netMwr: netMwrChartData,
      twr: twrChartData,
      netTwr: netTwrChartData,
      cagr: cagrChartData,
      netCagr: netCagrChartData,
      averageAnnualReturn: averageAnnualReturnChartData,
      netAverageAnnualReturn: netAverageAnnualReturnChartData,
      drawdown: drawdownChartData,
      bestSharpeRatio: bestSharpeRatioChartData,
      worstSharpeRatio: worstSharpeRatioChartData,
      volatility: volatilityChartData,
      dividendHistory: dividendHistoryChartData,
      dividendHistoryNet: dividendHistoryChartDataNet,
      yieldOnCost: yieldOnCostChartData,
      yieldOnCostNet: yieldOnCostChartDataNet,
      dividendYield: dividendYieldChartData,
      dividendYieldNet: dividendYieldChartDataNet,
      benchmarkBest: benchmarkBestChartData,
      benchmarkBestNet: benchmarkBestNetChartData,
      benchmarkBestProfit: benchmarkBestProfitChartData,
      benchmarkBestNetProfit: benchmarkBestNetProfitChartData,
      benchmarkWorst: benchmarkWorstChartData,
      benchmarkWorstNet: benchmarkWorstNetChartData,
      benchmarkWorstProfit: benchmarkWorstProfitChartData,
      benchmarkWorstNetProfit: benchmarkWorstNetProfitChartData,
      stockTradeHistory: stockTradeHistoryChartData,
    },
  };
};

/**
 * 날짜 오름차순으로 정렬된 배열에서 기준일과 같거나 이전인 마지막 항목의
 * 인덱스를 이진 검색합니다. 기준일 이전 항목이 하나도 없으면 -1을 반환합니다.
 * 날짜는 사전순 비교와 시간순이 같은 `YYYY-MM-DD` 형식을 전제로 합니다.
 */
const findLastIndexAtOrBefore = <T extends { date: string }>(
  items: T[],
  targetDate: string,
) => {
  let low = 0;
  let high = items.length - 1;
  let foundIndex = -1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (items[middle].date <= targetDate) {
      // 조건을 만족해도 더 오른쪽에 가까운 날짜가 있을 수 있으므로 계속 탐색합니다.
      foundIndex = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return foundIndex;
};

/**
 * 날짜 오름차순 시계열에서 기준일까지의 구간을 새 배열로 반환합니다.
 * 기준일과 같거나 이전인 데이터가 없으면 빈 배열을 반환합니다.
 */
const sliceSeriesAtDate = <T extends { date: string }>(
  items: T[],
  targetDate: string,
) => {
  const lastIndex = findLastIndexAtOrBefore(items, targetDate);
  return lastIndex < 0 ? [] : items.slice(0, lastIndex + 1);
};

/**
 * 조회 통화와 이미 같은 통화인 종목도 readonly 원본과 분리되도록 stock과
 * balance를 복제합니다. 이 함수에서는 가격의 통화 환산은 수행하지 않습니다.
 */
const cloneStocks = (
  stocks: ReadonlyAccountProps['krw']['stocks'],
): StockProps[] =>
  stocks.map((stock) => ({
    ...stock,
    balance: stock.balance.map((balance) => ({ ...balance })),
  }));

/**
 * 선택 날짜의 양 통화 보유 종목을 조회 통화로 합칩니다.
 * readonly 원본을 보호하도록 stock과 balance를 새 객체로 구체화합니다.
 * 매수 잔고 가격은 각 잔고의 fxRate로, 현재 종목 가격은 스냅샷의 fxRate로
 * 환산해 기존 날짜별 평가 로직을 유지합니다.
 */
const materializeStocks = (
  account: ReadonlyAccountProps,
  currency: Currency,
): StockProps[] => {
  if (currency === 'usd') {
    return [
      ...cloneStocks(account.usd.stocks),
      ...account.krw.stocks.map((stock) => ({
        ...stock,
        balance: stock.balance.map((balance) => ({
          ...balance,
          price: balance.price / balance.fxRate, // KRW → USD (각각의 fxRate 사용)
        })),
        price: stock.price / account.fxRate, // KRW → USD
      })),
    ];
  }

  return [
    ...cloneStocks(account.krw.stocks),
    ...account.usd.stocks.map((stock) => ({
      ...stock,
      balance: stock.balance.map((balance) => ({
        ...balance,
        price: balance.price * balance.fxRate, // USD → KRW (각각의 fxRate 사용)
      })),
      price: stock.price * account.fxRate, // USD → KRW
    })),
  ];
};

/**
 * 요청일 이하의 가장 가까운 스냅샷에 stocks와 차트를 결합합니다.
 * targetDate가 null이면 최신 스냅샷을, 최초 데이터보다 이르면 최초
 * 스냅샷을 사용합니다. 정확한 요청일 데이터가 없으면 직전 날짜를 사용합니다.
 * 최신일은 전체 차트 참조를 재사용하고, 과거일만 선택 날짜까지 잘라 반환합니다.
 * 전체 계좌 병합이나 MWR 계산은 여기서 다시 수행하지 않습니다.
 */
export const getDashboardDataByDate = (
  dataset: DashboardDataset,
  targetDate: string | null,
): DashboardProps | undefined => {
  if (dataset.snapshots.length === 0) return undefined;

  const isLatestDate = !targetDate;
  const snapshotIndex = isLatestDate
    ? dataset.snapshots.length - 1
    : Math.max(
        0,
        findLastIndexAtOrBefore(dataset.snapshots, targetDate as string),
      );
  const snapshot = dataset.snapshots[snapshotIndex];
  const stocks = materializeStocks(
    dataset.accountData[snapshotIndex],
    dataset.currency,
  );

  if (snapshotIndex === dataset.snapshots.length - 1) {
    return { ...snapshot, stocks, charts: dataset.charts };
  }

  const chartEntries = Object.entries(dataset.charts) as Array<
    [keyof DashboardCharts, Array<{ date: string }>]
  >;
  const charts = Object.fromEntries(
    chartEntries.map(([key, series]) => [
      key,
      sliceSeriesAtDate(series, snapshot.date),
    ]),
  ) as unknown as DashboardCharts;

  return { ...snapshot, stocks, charts };
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
  const isValidPrice = (price: { preSplitClose: number }) =>
    Number.isFinite(price.preSplitClose) && price.preSplitClose > 0;

  const currentPrice = stockInfo.prices.find(
    (price) => price.date === date && isValidPrice(price),
  );
  if (currentPrice) {
    stock.price = currentPrice.preSplitClose;
  } else {
    // 찾지 못하면, 과거 데이터 중 가장 최근 데이터를 가져옵니다.
    const pastPrices = stockInfo.prices
      .filter((price) => price.date < date && isValidPrice(price))
      .sort((a, b) => b.date.localeCompare(a.date));
    stock.price = pastPrices[0]?.preSplitClose ?? stock.price;
  }
};

// 보정액 하나를 첫 거래일 기준의 deposit/withdrawal 거래로 변환합니다.
const createPrincipalAdjustmentTransaction = (
  baseTransaction: TransactionProps,
  currency: Currency,
  amount: number,
): TransactionProps | null => {
  if (amount === 0) return null;

  return {
    date: baseTransaction.date,
    type: amount > 0 ? 'deposit' : 'withdrawal',
    currency,
    ISIN: '',
    quantity: 1,
    price: Math.abs(amount),
    krwCash: baseTransaction.krwCash,
    usdCash: baseTransaction.usdCash,
  };
};

// 원금 보정값을 첫 거래일의 가상 입출금 거래로 추가해 기존 원금 계산 로직을 그대로 사용합니다.
const addPrincipalAdjustmentTransactions = (
  transactions: TransactionProps[],
  principalAdjustment?: PrincipalAdjustment,
) => {
  const baseTransaction = transactions[0];
  if (!baseTransaction || !principalAdjustment) return transactions;

  const adjustmentTransactions = [
    createPrincipalAdjustmentTransaction(
      baseTransaction,
      'krw',
      principalAdjustment.krw || 0,
    ),
    createPrincipalAdjustmentTransaction(
      baseTransaction,
      'usd',
      principalAdjustment.usd || 0,
    ),
  ].filter((transaction): transaction is TransactionProps =>
    Boolean(transaction),
  );

  if (adjustmentTransactions.length === 0) return transactions;

  return [...adjustmentTransactions, ...transactions];
};

// 날짜별 계좌정보 데이터 데이터 생성 (계좌정보와 그래프 표시용)
export const createAccountData = async (
  transactions: TransactionProps[],
  startDate?: string,
  endDate?: string,
  principalAdjustment?: PrincipalAdjustment,
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
  const adjustedTransactions = addPrincipalAdjustmentTransactions(
    filteredTransactions,
    principalAdjustment,
  );

  // 주식 종목 코드 데이터 가져오기 (중복제거 및 빈값 제거)
  const stockCodes = [
    ...new Set(adjustedTransactions.map((transaction) => transaction.ISIN)),
  ].filter((code) => code !== '');

  const { stockData } = await getStockInfo(startDate, today, stockCodes); // 주식 정보 및 히스토리 데이터 가져오기
  const fxRates =
    stockData.find(
      (stock) => stock.code === USD_KRW_SYMBOL,
    )?.prices ?? [];

  const accountData = adjustedTransactions
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
              fxRate: account.fxRate,
              pricesBySymbol: {
                [stockInfo?.symbol]: Array(transaction.quantity).fill(
                  transaction.price,
                ),
              },
              namesBySymbol: {
                [stockInfo?.symbol]: stockInfo?.shortName ?? stockInfo?.symbol,
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
            const stockSymbol = stockToSell?.symbol ?? transaction.ISIN;

            // 주식 매도 이력 추가
            account[currency].stockTradeHistory.push({
              date: transaction.date,
              type: 'sell',
              fxRate: account.fxRate,
              pricesBySymbol: {
                [stockSymbol]: Array(transaction.quantity).fill(
                  transaction.price,
                ),
              },
              namesBySymbol: {
                [stockSymbol]:
                  stockToSell?.shortName ?? stockToSell?.symbol ?? '',
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
            benchmarkBestValue: 0,
            benchmarkBestNetValue: 0,
            benchmarkWorstValue: 0,
            benchmarkWorstNetValue: 0,
          },
          usd: {
            principalAmount: 0,
            dividends: [],
            cash: 0,
            stocks: [],
            stocksProfit: 0,
            stockTradeHistory: [],
            benchmarkBestValue: 0,
            benchmarkBestNetValue: 0,
            benchmarkWorstValue: 0,
            benchmarkWorstNetValue: 0,
          },
        },
      ] as AccountProps[],
    )
    .slice(1); // 첫번째 빈 데이터 제거

  // 데이터가 없으면 직전 데이터를 넣고, 같은 날짜가 여러번 반복되는 경우는 마지막 데이터만 넣고 환율은 해당 날짜 환율로 업데이트
  let prevData = accountData[0];
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

      // 환율 업데이트 (항상 당일 또는 가장 최근 환율 사용)
      const foundFxRate = fxRates.findLast(
        (data: StockHistoryProps) => data.date <= date.date,
      )?.close;

      if (foundFxRate) {
        dummyData.fxRate = foundFxRate;
      } else {
        dummyData.fxRate = DEFAULT_FX_RATE;
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
      } catch (error: unknown) {
        const axiosError = axios.isAxiosError(error) ? error : undefined;
        const failedApi = axiosError?.config?.url?.includes('/api/search')
          ? 'Search API'
          : 'Price API';

        throw {
          code, // 종목 코드
          api: failedApi, // 실패한 API 종류
          status: axiosError?.response?.status || 'Network Error', // HTTP 상태 코드 (네트워크 오류일 경우 메시지)
          message:
            axiosError?.response?.data?.message ||
            (error instanceof Error ? error.message : 'Unknown error'), // API 응답 메시지 또는 기본 오류 메시지
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

// 여러 계좌를 병합할 때 수정할 객체 껍데기와 공유 가능한 readonly 컬렉션을 구분합니다.
type ShallowMutable<T> = {
  -readonly [Key in keyof T]: T[Key];
};

type MergeAccountDetails = ShallowMutable<ReadonlyAccountProps['krw']>;
type MergeAccountAccumulator = Omit<
  ShallowMutable<ReadonlyAccountProps>,
  'krw' | 'usd'
> & {
  krw: MergeAccountDetails;
  usd: MergeAccountDetails;
};

const cloneAccountDetailsForMerge = (
  details: ReadonlyAccountProps['krw'],
): MergeAccountDetails => ({
  // 컬렉션은 readonly 계약 아래 공유하고, 값과 참조가 바뀌는 통화 객체만 복제합니다.
  ...details,
});

/**
 * 날짜가 같은 여러 계좌를 병합합니다.
 *
 * 입력과 반환값은 깊은 readonly 계약을 따릅니다. 첫 계좌의 중첩 컬렉션은
 * 구조적으로 공유하고, 실제 충돌이 발생한 컬렉션만 병합 함수가 새로 만듭니다.
 */
export const mergeAccountData = (
  accountDataArray: readonly ReadonlyMergeAccountDataInput[],
): readonly ReadonlyAccountProps[] => {
  // 계좌 데이터를 날짜별로 합치기 위해 Map을 사용
  const mergedMap = new Map<string, MergeAccountAccumulator>();

  // Iterate through all accounts and each accountData within
  accountDataArray.forEach((account) => {
    account.accountData.forEach((data) => {
      const date = data.date;
      if (!mergedMap.has(date)) {
        // 최초 계좌는 전체 복사하지 않고 병합 중 수정되는 최상위·통화 객체만 소유합니다.
        mergedMap.set(date, {
          ...data,
          krw: cloneAccountDetailsForMerge(data.krw),
          usd: cloneAccountDetailsForMerge(data.usd),
        });
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
          merged[currency].stockTradeHistory = mergeStockTradeHistory(
            merged[currency].stockTradeHistory,
            data[currency].stockTradeHistory,
          );
        });
      }
    });

    // Benchmark Best data 병합
    if (account.benchmarkBestData) {
      account.benchmarkBestData.forEach((benchmarkBest) => {
        const date = benchmarkBest.date;
        const merged = mergedMap.get(date)!; // merged는 반드시 존재해야 함

        // benchmarkBestValue, benchmarkBestNetValue 값이 없으면 0으로 초기화 하고 누적 합산
        merged['krw'].benchmarkBestValue =
          (merged['krw'].benchmarkBestValue ?? 0) + benchmarkBest.benchmarkValueKrw;
        merged['usd'].benchmarkBestValue =
          (merged['usd'].benchmarkBestValue ?? 0) + benchmarkBest.benchmarkValueUsd;
        merged['krw'].benchmarkBestNetValue =
          (merged['krw'].benchmarkBestNetValue ?? 0) +
          benchmarkBest.benchmarkNetValueKrw;
        merged['usd'].benchmarkBestNetValue =
          (merged['usd'].benchmarkBestNetValue ?? 0) +
          benchmarkBest.benchmarkNetValueUsd;
      });
    }

    // Benchmark Worst data 병합
    if (account.benchmarkWorstData) {
      account.benchmarkWorstData.forEach((benchmarkWorst) => {
        const date = benchmarkWorst.date;
        const merged = mergedMap.get(date)!; // merged는 반드시 존재해야 함

        // benchmarkWorstValue, benchmarkWorstNetValue 값이 없으면 0으로 초기화 하고 누적 합산
        merged['krw'].benchmarkWorstValue =
          (merged['krw'].benchmarkWorstValue ?? 0) +
          benchmarkWorst.benchmarkValueKrw;
        merged['usd'].benchmarkWorstValue =
          (merged['usd'].benchmarkWorstValue ?? 0) +
          benchmarkWorst.benchmarkValueUsd;
        merged['krw'].benchmarkWorstNetValue =
          (merged['krw'].benchmarkWorstNetValue ?? 0) +
          benchmarkWorst.benchmarkNetValueKrw;
        merged['usd'].benchmarkWorstNetValue =
          (merged['usd'].benchmarkWorstNetValue ?? 0) +
          benchmarkWorst.benchmarkNetValueUsd;
      });
    }
  });

  const mergedArray: readonly ReadonlyAccountProps[] = Array.from(
    mergedMap.values(),
  ).sort((a, b) => a.date.localeCompare(b.date));

  return mergedArray;
};
