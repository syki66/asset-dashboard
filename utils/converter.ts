import { transactionTypeProps } from '@/types';
import { dateToTimestamp } from './format';
import axios from 'axios';

export const formatJsonForGraph = (
  json: transactionTypeProps[],
  startDate,
  endDate
) => {
  let _currency = 1;
  let evaluationAmount = 0; // 평가금액
  let principalAmount = 0; // 원금

  return json.map((item: transactionTypeProps) => {
    // 환율 계산
    if (item.currency === 'KRW') {
      _currency = 1; // 원달러 환율
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

export const createAccountData = async (
  transactions: transactionTypeProps[]
) => {
  // api 호출용 날짜 범위 추출
  const firstDate = transactions[0]?.date;
  const lastDate = transactions[transactions.length - 1]?.date;

  // 주식 종목 코드 데이터 가져오기 (중복제거 및 빈값 제거)
  const stockCodes = [
    ...new Set(transactions.map((transaction) => transaction.ISIN)),
  ].filter((code) => code !== '');

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
            firstDate
          )}&endDate=${dateToTimestamp(lastDate)}`
        )
      )
    )
  ).map((response) => response.data);

  // 주식 데이터와 티커 매핑
  const stockData = Object.fromEntries(
    tickers.map((key, index) => [key, stocks[index]])
  );

  // 한국 주식 종목명 가져오기
  const stockNameKr = (
    await Promise.all(
      stockCodeKr.map((code) => axios.get(`/api/search/${code}`))
    )
  ).map((response) => response.data.name);

  // 한국 종목 코드와 종목명 매핑
  const stockKrDict = Object.fromEntries(
    stockCodeKr.map((key, index) => [key, stockNameKr[index]])
  );

  // 환율 데이터 가져오기
  const currencyData = (
    await axios.get(
      `/api/history/KRW=X?startDate=${dateToTimestamp(
        firstDate
      )}&endDate=${dateToTimestamp(lastDate)}`
    )
  ).data;

  console.log(stockData);
  console.log(stockKrDict);
  console.log(currencyData);
};
