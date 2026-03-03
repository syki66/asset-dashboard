import { TermsProps, StockHistoryProps, TransactionProps } from '@/types';
import { generateDateObjects, timestampToDate } from './format';
import { getStockInfo } from './converter';
import { DEFAULT_FX_RATE, KR_DIVIDEND_TAX_RATE } from '@/constants/keywords';
import { useInterestRateStore } from '@/store/account';

// 벤치마크 데이터 생성
export const createBenchmarkData = async (transactions: TransactionProps[]) => {
  const {
    stockData: [fxTable],
  } = await getStockInfo(
    transactions[0].date,
    timestampToDate(Math.floor(new Date().getTime() / 1000)),
    [],
  );

  const startDate = transactions[0].date;
  const endDate = timestampToDate(Math.floor(new Date().getTime() / 1000)); // 종료 날짜는 당일로 설정

  // 입출금 데이터 생성
  const cashFlowData: {
    date: string;
    depositKrw: number;
    withdrawalKrw: number;
    depositUsd: number;
    withdrawalUsd: number;
  }[] = generateDateObjects(startDate, endDate).map((dateObj) => ({
    ...dateObj,
    depositKrw: 0,
    withdrawalKrw: 0,
    depositUsd: 0,
    withdrawalUsd: 0,
  }));

  // 입출금 데이터 생성
  transactions.forEach((transaction) => {
    const foundData = cashFlowData.find(
      (account) => account.date === transaction.date,
    );

    if (foundData) {
      const isUsd = transaction.currency === 'usd';
      const fxRate = getFxRate(fxTable.prices, transaction.date);
      const amount = transaction.quantity * transaction.price;

      const krwAmount = isUsd ? amount * fxRate : amount;
      const usdAmount = isUsd ? amount : amount / fxRate;

      if (transaction.type === 'deposit') {
        foundData.depositKrw += krwAmount;
        foundData.depositUsd += usdAmount;
      } else if (transaction.type === 'withdrawal') {
        foundData.withdrawalKrw += krwAmount;
        foundData.withdrawalUsd += usdAmount;
      }
    }
  });

  let termsKrw: TermsProps[] = []; // 예금 상품 (KRW)
  let termsUsd: TermsProps[] = []; // 예금 상품 (USD)
  let result: {
    date: string;
    benchmarkNetValueKrw: number;
    benchmarkNetValueUsd: number;
    benchmarkValueKrw: number;
    benchmarkValueUsd: number;
  }[] = [];

  /* 입출금 데이터에 따라 예금 상품 생성 및 출금 처리, 평가자산 계산을 반복 (매일마다)
      - 입금이 발생하면 예금 상품 생성 (만기일은 1년 뒤로 설정)
      - 출금이 발생하면 가장 가까운 과거 예금 상품을 찾아서 해당 상품의 principal -> interest 순으로 차감 (withdrawal이 0이 될때까지 반복)
      - 평가자산 계산 시점에 이자 지급 및 만기일이 지난 상품은 재예치 (원금에 이자 합산해서 재예치)
  */
  cashFlowData.forEach((flow) => {
    // 오늘 날짜에 걸쳐있는 terms는 제외하고, 그외 terms는 오늘이 올때까지 다시 생성해서 계산 (maturityDate를 startDate에 대입 후)
    if (flow.depositKrw > 0) {
      termsKrw.push({
        startDate: flow.date,
        maturityDate: addOneYear(flow.date),
        principal: flow.depositKrw,
        interest: 0,
        interestRate: getCurrentRate(flow.date),
      });
    }

    if (flow.depositUsd > 0) {
      termsUsd.push({
        startDate: flow.date,
        maturityDate: addOneYear(flow.date),
        principal: flow.depositUsd,
        interest: 0,
        interestRate: getCurrentRate(flow.date),
      });
    }

    // 출금 프로세스 진행
    processWithdrawal(termsKrw, flow.withdrawalKrw);
    processWithdrawal(termsUsd, flow.withdrawalUsd);

    // 이자 지급, 만기일 지난 상품 재예치, 평가자산 측정값 반환
    const krwValues = processTermsValue(termsKrw, flow.date);
    const usdValues = processTermsValue(termsUsd, flow.date);

    result.push({
      date: flow.date,
      benchmarkValueKrw: krwValues.currentValue,
      benchmarkValueUsd: usdValues.currentValue,
      benchmarkNetValueKrw: krwValues.netCurrentValue,
      benchmarkNetValueUsd: usdValues.netCurrentValue,
    });
  });

  return result;
};

// 가장 가까운 날짜의 환율 찾기
export function getFxRate(
  entries: StockHistoryProps[],
  targetDate: string,
): number {
  // 정확한 날짜가 있고 close 값이 null이 아닐 때
  const exact = entries.find((e) => e.date === targetDate);
  if (exact && exact.close != null) {
    return exact.close;
  }

  // 가장 가까운 close 값이 있는 과거 날짜 찾기
  const earlier = entries.filter((e) => e.date < targetDate && e.close != null);
  if (earlier.length === 0) {
    return DEFAULT_FX_RATE;
  }

  let closest = earlier[0];
  for (let i = 1; i < earlier.length; i++) {
    if (earlier[i].date > closest.date) {
      closest = earlier[i];
    }
  }

  return closest.close;
}

// 1년 뒤 날짜 반환
const addOneYear = (date: string) => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + 1);
  return newDate.toISOString().split('T')[0];
};

// 과거 금리 중 입력된 날짜와 같거나 가장 가까운 과거 금리 반환
const getCurrentRate = (date: string) => {
  const rates = useInterestRateStore.getState().interestRates; // 전역 상태에서 금리 테이블 불러오기
  const dateObj = new Date(date);

  // 과거(같거나 이전) 금리만 필터링
  const pastRates = rates.filter((rate) => new Date(rate.date) <= dateObj);

  // 과거 금리가 없으면 가장 오래된 금리 반환
  if (pastRates.length === 0) {
    // rates 배열에서 가장 오래된 날짜의 금리를 찾음
    const oldestRate = rates.reduce((min, rate) => {
      return new Date(rate.date) < new Date(min.date) ? rate : min;
    }, rates[0]);
    return oldestRate.interestRate;
  }

  // 가장 최근(가장 가까운 과거) 금리 반환
  pastRates.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return pastRates[0].interestRate;
};

const processWithdrawal = (termsArray: TermsProps[], amount: number) => {
  let remainingWithdrawal = amount;

  // KRW 출금이 발생하면 가장 가까운 과거 예금 상품을 찾아서 해당 상품의 principal -> interest 순으로 차감 (withdrawal이 0이 될때까지 반복)
  while (remainingWithdrawal > 0) {
    // 예금 상품 역방향 정렬
    termsArray.sort(
      (a, b) =>
        new Date(b.maturityDate).getTime() - new Date(a.maturityDate).getTime(),
    );

    const findTerm = termsArray[0];
    if (!findTerm) break;

    // 출금액이 예금 상품의 원금+이자보다 크면 해당 상품 삭제
    if (findTerm.principal + findTerm.interest <= remainingWithdrawal) {
      remainingWithdrawal -= findTerm.principal + findTerm.interest; // 출금액 차감
      termsArray.shift(); // 예금 상품 삭제
    } else {
      // 출금액이 원금+이자보다 작을 경우
      if (findTerm.principal < remainingWithdrawal) {
        // 원금보다 크다면 원금 제거하고 이자만 남김
        remainingWithdrawal -= findTerm.principal; // 원금만큼 출금액 차감
        findTerm.principal = 0; // 원금 차감
        findTerm.interest -= remainingWithdrawal; // 이자까지 차감
      } else {
        // 원금보다 작다면 원금만큼 차감
        findTerm.principal -= remainingWithdrawal; // 원금 차감
      }
      remainingWithdrawal = 0; // 출금액 0으로 초기화
      break;
    }
  }
};

const processTermsValue = (termsArray: TermsProps[], flowDate: string) => {
  let currentValue = 0; // 현재 평가금액
  let netCurrentValue = 0; // 순평가금액

  // 이자 지급
  termsArray.forEach((term) => {
    currentValue += term.principal + term.interest; // 평가금액 계산
    netCurrentValue +=
      term.principal + term.interest * (1 - KR_DIVIDEND_TAX_RATE); // 순평가금액 계산

    term.interest += term.principal * (term.interestRate / 100 / 365); // 하루 이자 지급

    // 만기일이 지난 상품은 재예치
    if (term.maturityDate < flowDate) {
      term.startDate = flowDate;
      term.maturityDate = addOneYear(flowDate);
      term.principal = term.principal + term.interest; // 원금에 이자 합산해서 재예치
      term.interest = 0; // 이자 초기화
      term.interestRate = getCurrentRate(flowDate) * (1 - KR_DIVIDEND_TAX_RATE); // 출금 이자 계산 로직이 복잡해져서 그냥 세후 이자율로 계산
    }
  });

  return { currentValue, netCurrentValue };
};
