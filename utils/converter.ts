import { AccountProps, transactionProps } from '@/types';
import { dateToTimestamp } from './format';
import axios from 'axios';

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

// 날짜별 계좌정보 데이터 데이터 생성 (계좌정보와 그래프 표시용)
export const createAccountData = (transactions: transactionProps[]) => {
  const accountData = transactions
    .reduce(
      (acc, transaction) => {
        const account = structuredClone(acc[acc.length - 1]);

        account.date = transaction.date;

        switch (transaction.type) {
          case 'deposit':
            if (transaction.currency === 'KRW') {
              account.krw.deposit += transaction.price;
            } else if (transaction.currency === 'USD') {
              account.usd.deposit += transaction.price;
            }
            break;
          case 'withdrawal':
            if (transaction.currency === 'KRW') {
              account.krw.withdrawal += transaction.price;
            } else if (transaction.currency === 'USD') {
              account.usd.withdrawal += transaction.price;
            }
            break;
          case 'buy':
            if (!account.stocks[transaction.ISIN]) {
              account.stocks[transaction.ISIN] = [];
            }
            for (let i = 0; i < transaction.quantity; i++) {
              account.stocks[transaction.ISIN].push(transaction.price);
            }
            break;
          case 'sell':
            for (let i = 0; i < transaction.quantity; i++) {
              account.stocks[transaction.ISIN].shift();
            }
            break;
          case 'dividend': // 매년 배당금 누적 계산 (세전)
            const year = Number(transaction.date.split('-')[0]);
            if (transaction.currency === 'KRW') {
              const krwDividend = account.krw.dividend.find(
                (dividend) => dividend.year === year
              );
              if (!krwDividend) {
                account.krw.dividend.push({
                  year,
                  price: transaction.price,
                });
              } else {
                krwDividend.price += transaction.price;
              }
            }
            if (transaction.currency === 'USD') {
              const usdDividend = account.usd.dividend.find(
                (dividend) => dividend.year === year
              );
              if (!usdDividend) {
                account.usd.dividend.push({
                  year,
                  price: transaction.price,
                });
              } else {
                usdDividend.price += transaction.price;
              }
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
          krw: {
            deposit: 0,
            withdrawal: 0,
            dividend: [],
            cash: 0,
          },
          usd: {
            deposit: 0,
            withdrawal: 0,
            dividend: [],
            cash: 0,
          },
          stocks: {},
        },
      ] as AccountProps[]
    )
    .slice(1); // 첫번째 빈 데이터 제거
  return accountData;
};

export const getStockInfo = async (
  startDate: string,
  endDate: string,
  stockCodes: string[]
) => {
  stockCodes.sort(); // 한국 미국 종목의 순서가 섞여있어서 아래에서 순서를 정확하게 매핑하기 위해 정렬

  // 거래내역 상에 존재하는 모든 미국 종목을 티커로 가져오기
  const symbols = (
    await Promise.all(
      stockCodes
        .filter((code) => code.startsWith('US'))
        .map((code) => axios.get(`/api/search/${code}`))
    )
  ).map((response) => response.data.symbol);

  // 한국주식코드를 000000.KS 형태로 변환
  const stockCodeKr = stockCodes
    .filter((code) => code.startsWith('A'))
    .map((code) => code.slice(1) + '.KS');

  // api에서 받아올 수 있도록 티커 배열 생성
  const tickers = [...stockCodeKr, ...symbols];

  // 주식 데이터 가져오기
  const stocks = (
    await Promise.all(
      tickers.map((ticker) =>
        axios.get(
          `/api/history/${ticker}?startDate=${dateToTimestamp(
            startDate
          )}&endDate=${dateToTimestamp(endDate)}`
        )
      )
    )
  ).map((response) => response.data);

  // 한국 주식 종목명 가져오기
  const stockNameKr = (
    await Promise.all(
      stockCodeKr.map((code) => axios.get(`/api/search/${code}`))
    )
  ).map((response) => response.data.name);

  // 한국 종목 코드와 종목명 매핑
  const stockCodeToNameKr = Object.fromEntries(
    stockCodeKr.map((key, index) => [key, stockNameKr[index]])
  );

  // 주식 데이터 생성
  const stockData = stockCodes.map((code, index) => {
    const name = code.startsWith('A')
      ? stockCodeToNameKr[tickers[index]]
      : tickers[index];
    return { name, code, prices: stocks[index] };
  });

  // 환율 데이터 가져오기
  const fxRates = (
    await axios.get(
      `/api/history/KRW=X?startDate=${dateToTimestamp(
        startDate
      )}&endDate=${dateToTimestamp(endDate)}`
    )
  ).data;

  return { stockData, fxRates };
};
