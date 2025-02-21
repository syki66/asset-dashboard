import { AccountProps, Currency, StockProps, transactionProps } from '@/types';
import { dateToTimestamp, generateDateObjects } from './format';
import axios from 'axios';
import { toast } from 'sonner';

export const formatJsonForGraph = (json: transactionProps[]) => {
  let _currency = 1;
  let evaluationAmount = 0; // 평가금액
  let principalAmount = 0; // 원금

  return json.map((item: transactionProps) => {
    // 환율 계산
    if (item.currency === 'KRW') {
      _currency = 1; // 원화 기준 계산
    } else if (item.currency === 'USD') {
      _currency = 1350; // 달러원 환율
    }

    // 원금 계산
    if (item.type === 'deposit') {
      principalAmount += item.price * item.quantity * _currency;
    }
    if (item.type === 'withdraw') {
      principalAmount -= item.price * item.quantity * _currency;
    }

    // 평가금액 계산
    if (item.type === 'buy') {
      evaluationAmount += item.price * item.quantity * _currency;
    }
    if (item.type === 'sell') {
      evaluationAmount -= item.price * item.quantity * _currency;
    }

    // 예수금 계산
    const escrow = item.usdDeposit * 1350 + item.krwDeposit;

    return {
      date: item.date,
      principalAmount: Math.round(principalAmount),
      evaluationAmount: Math.round(evaluationAmount + escrow),
    };
  });
};

// 계좌의 원금(principalAmount)을 업데이트 합니다.
const updatePrincipal = (
  account: AccountProps,
  transaction: transactionProps, // 1 (입금: deposit) 또는 -1 (출금: withdrawal)
  multiplier: number
) => {
  const currency: Currency = transaction.currency as Currency;
  if (currency === 'usd') {
    // USD 통화인 경우, USD 계좌는 원래 금액, KRW는 환율을 곱한 금액 적용
    account.usd.principalAmount += multiplier * transaction.price;
    account.krw.principalAmount +=
      multiplier * (transaction.price * account.fxRate);
  } else if (currency === 'krw') {
    // KRW 통화인 경우, KRW 계좌는 원래 금액, USD는 환율로 나눈 금액 적용
    account.krw.principalAmount += multiplier * transaction.price;
    account.usd.principalAmount +=
      multiplier * (transaction.price / account.fxRate);
  }
};

// 주어진 주식(stock)의 가격을 data.date 기준으로 업데이트합니다.
const updateStockPrice = (
  stock: { code: string; price: number },
  date: string,
  stockData: { code: string; prices: { date: string; close: number }[] }[]
) => {
  // 주식 코드에 해당하는 데이터 찾기
  const stockInfo = stockData.find((item) => item.code === stock.code);
  if (!stockInfo) return;

  // 해당 날짜의 가격이 있는지 확인
  const currentPrice = stockInfo.prices.find((price) => price.date === date);
  if (currentPrice) {
    stock.price = currentPrice.close;
  } else {
    // 찾지 못하면, 과거 데이터 중 가장 최근 데이터를 가져옵니다.
    const pastPrices = stockInfo.prices
      .filter((price) => price.date < date)
      .sort((a, b) => b.date.localeCompare(a.date));
    stock.price = pastPrices[0]?.close ?? stock.price;
  }
};

// 날짜별 계좌정보 데이터 데이터 생성 (계좌정보와 그래프 표시용)
export const createAccountData = async (transactions: transactionProps[]) => {
  // api 호출용 날짜 범위 추출
  const startDate = transactions[0]?.date;
  const endDate = transactions[transactions.length - 1]?.date;

  // 주식 종목 코드 데이터 가져오기 (중복제거 및 빈값 제거)
  const stockCodes = [
    ...new Set(transactions.map((transaction) => transaction.ISIN)),
  ].filter((code) => code !== '');

  const { stockData } = await getStockInfo(startDate, endDate, stockCodes); // 주식 정보 및 히스토리 데이터 가져오기
  const fxRates = stockData.find((stock) => stock.code === 'KRW=X')?.prices;

  const accountData = transactions
    .reduce(
      (acc, transaction) => {
        const account = structuredClone(acc[acc.length - 1]); // 직전 데이터 복사

        const currency: Currency = transaction.currency as Currency; // 통화 타입 지정

        account.date = transaction.date; // 날짜 업데이트

        // 환율이 존재하면 가져오고 없다면 이전 환율 사용
        const currentFxRate = fxRates.find(
          (data: StockProps) => data.date === transaction.date
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
            const stockToBuy = account[currency].stocks.find(
              (stock) => stock.code === transaction.ISIN
            );

            if (!stockToBuy) {
              // 종목이 없으면 초기값과 정보 추가
              const stockInfo = stockData.find(
                (stock) => stock.code === transaction.ISIN
              );
              account[currency].stocks.push({
                shortName: stockInfo?.shortName,
                longName: stockInfo?.longName,
                symbol: stockInfo?.symbol,
                code: transaction.ISIN,
                balance: Array(transaction.quantity).fill(transaction.price),
                price: transaction.price, // 기본값으로 매수 가격 넣기
              });
            } else {
              // 종목이 있으면 추가적인 정보만 삽입
              for (let i = 0; i < transaction.quantity; i++) {
                stockToBuy.balance.push(transaction.price);
              }
            }
            break;
          case 'sell':
            const stockToSell = account[currency].stocks.find(
              (stock) => stock.code === transaction.ISIN
            );

            // 잔고가 있으면 마지막 값 제거
            if (stockToSell) {
              for (let i = 0; i < transaction.quantity; i++) {
                stockToSell.balance.shift();
              }
            }
            // 잔고가 비어있으면 삭제
            if (stockToSell?.balance.length === 0) {
              account[currency].stocks = account[currency].stocks.filter(
                (stock) => stock.code !== transaction.ISIN
              );
            }
            break;
          case 'dividend': // 매년 배당금 누적 계산 (세전)
            const foundDividend = account[currency].dividend.find(
              (dividend) => dividend.date === transaction.date
            );
            if (!foundDividend) {
              account[currency].dividend.push({
                date: transaction.date,
                price: transaction.price,
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
          fxRate: 1400,
          krw: {
            principalAmount: 0,
            dividend: [],
            cash: 0,
            stocks: [],
          },
          usd: {
            principalAmount: 0,
            dividend: [],
            cash: 0,
            stocks: [],
          },
        },
      ] as AccountProps[]
    )
    .slice(1); // 첫번째 빈 데이터 제거

  // 데이터가 없으면 직전 데이터를 넣고, 같은 날짜가 여러번 반복되는 경우는 마지막 데이터만 넣기
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
      return dummyData;
    }
  );

  // 날짜별 현재가 업데이트
  const updatedAccountData = filledAccountData.map((data) => {
    // usd와 krw 두 통화를 한 번에 처리합니다.
    (['usd', 'krw'] as const).forEach((currency) => {
      data[currency].stocks.forEach((stock) => {
        updateStockPrice(stock, data.date, stockData);
      });
    });
    return data;
  });

  return updatedAccountData;
};

// 주식 및 환율 히스토리 데이터 호출
export const getStockInfo = async (
  startDate: string,
  endDate: string,
  stockCodes: string[]
) => {
  stockCodes.push('KRW=X'); // 환율 심볼 추가

  // 종목코드를 바탕으로 종목 정보와 히스토리 데이터 가져오기
  const stockData = await Promise.allSettled(
    stockCodes.map(async (code) => {
      try {
        const searchResponse = await axios.get(
          `/api/search/${code.split('A').at(-1)}`
        );
        const { symbol, shortName, longName } = searchResponse.data;

        const priceResponse = await axios.get(
          `/api/history/${symbol}?startDate=${dateToTimestamp(
            startDate
          )}&endDate=${dateToTimestamp(endDate)}`
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
    })
  );

  stockData.forEach((result) => {
    if (result.status === 'rejected') {
      const { api, code, message, status } = result.reason;
      toast.error(
        `🚨 ${api} failed!\nStock Code: ${code}\nError: ${message} (Status: ${status})`
      );
    }
  });

  return {
    stockData: stockData
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value),
  };
};
