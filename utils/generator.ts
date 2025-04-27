import { transactionProps } from '@/types';
import { timestampToDate } from './format';

// 벤치마크 데이터 생성
export const createBenchmarkData = (transactions: transactionProps[]) => {
  // 예금, s&p500, nasdaq, kospi, btc?
  // 입출금 환율 생각하기

  const startDate = transactions[0].date;
  const endDate = timestampToDate(Math.floor(new Date().getTime() / 1000)); // 종료 날짜는 당일로 설정

  // 예금들 목록
  const deposits = [
    {
      startDate: '2025-02-25',
      maturityDate: '2026-02-25',
      principal: 1000000,
      currentValue: 1000000,
      interestRate: 1.5,
    },
  ];

  transactions.map((transaction) => {
    // 입금 시 예금 잔고에 추가
    if (transaction.type === 'deposit') {
      deposits.push({
        startDate: transaction.date,
        maturityDate: addOneYear(transaction.date),
        principal: transaction.quantity * transaction.price,
        currentValue: transaction.quantity * transaction.price,
        interestRate: getCurrentRate(transaction.date),
      });
    }
  });

  console.log(deposits);
};

// 1년 뒤 날짜 반환
const addOneYear = (date: string) => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + 1);
  return newDate.toISOString().split('T')[0];
};

// 과거 금리 중 입력된 날짜와 같거나 가장 가까운 과거 금리 반환
const getCurrentRate = (date: string) => {
  const interestRates = [
    { date: '2025-02-25', interestRate: 2.75 },
    { date: '2024-11-28', interestRate: 3.0 },
    { date: '2024-10-11', interestRate: 3.25 },
    { date: '2023-01-13', interestRate: 3.5 },
    { date: '2022-11-24', interestRate: 3.25 },
    { date: '2022-10-12', interestRate: 3.0 },
    { date: '2022-08-25', interestRate: 2.5 },
    { date: '2022-07-13', interestRate: 2.25 },
    { date: '2022-05-26', interestRate: 1.75 },
    { date: '2022-04-14', interestRate: 1.5 },
    { date: '2022-01-14', interestRate: 1.25 },
    { date: '2021-11-25', interestRate: 1.0 },
    { date: '2021-08-26', interestRate: 0.75 },
    { date: '2020-05-28', interestRate: 0.5 },
    { date: '2020-03-17', interestRate: 0.75 },
    { date: '2019-10-16', interestRate: 1.25 },
    { date: '2018-01-01', interestRate: 1.5 },
    { date: '2017-01-01', interestRate: 1.25 },
    { date: '2016-01-01', interestRate: 1.0 },
    { date: '2015-01-01', interestRate: 0.75 },
    { date: '2014-01-01', interestRate: 0.5 },
    { date: '2013-01-01', interestRate: 0.25 },
    { date: '2012-01-01', interestRate: 0.25 },
    { date: '2011-01-01', interestRate: 0.25 },
    { date: '2010-01-01', interestRate: 0.25 },
    { date: '2009-01-01', interestRate: 0.25 },
    { date: '2008-01-01', interestRate: 3.0 },
    { date: '2007-01-01', interestRate: 5.25 },
    { date: '2006-01-01', interestRate: 4.25 },
    { date: '2005-01-01', interestRate: 2.25 },
    { date: '2004-01-01', interestRate: 1.0 },
    { date: '2003-01-01', interestRate: 1.25 },
    { date: '2002-01-01', interestRate: 1.75 },
    { date: '2001-01-01', interestRate: 3.5 },
    { date: '2000-01-01', interestRate: 5.5 },
  ];
  const dateObj = new Date(date);

  // 과거(같거나 이전) 금리만 필터링
  const pastRates = interestRates.filter(
    (rate) => new Date(rate.date) <= dateObj
  );

  // 과거 금리가 없으면 가장 오래된 금리 반환
  if (pastRates.length === 0) {
    return interestRates[interestRates.length - 1].interestRate;
  }

  // 가장 최근(가장 가까운 과거) 금리 반환
  pastRates.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return pastRates[0].interestRate;
};
