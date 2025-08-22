import { TermsProps, StockHistoryProps, TransactionProps } from '@/types';
import { generateDateObjects, timestampToDate } from './format';
import { getStockInfo } from './converter';
import { DEFAULT_FX_RATE, krDividendTax } from '@/constants/keywords';
import { useInterestRateStore } from '@/store/account';

// 벤치마크 데이터 생성
export const createBenchmarkData = async (transactions: TransactionProps[]) => {
  const {
    stockData: [fxTable],
  } = await getStockInfo(
    transactions[0].date,
    timestampToDate(Math.floor(new Date().getTime() / 1000)),
    []
  );

  const startDate = transactions[0].date;
  const endDate = timestampToDate(Math.floor(new Date().getTime() / 1000)); // 종료 날짜는 당일로 설정

  // 입출금 데이터 생성
  const cashFlowData: { date: string; deposit: number; withdrawal: number }[] =
    generateDateObjects(startDate, endDate).map((dateObj) => ({
      ...dateObj,
      deposit: 0,
      withdrawal: 0,
    }));

  transactions.forEach((transaction) => {
    const foundData = cashFlowData.find((account) => {
      return account.date === transaction.date;
    });

    if (foundData) {
      if (transaction.type === 'deposit') {
        foundData.deposit += Math.round(
          transaction.currency === 'usd'
            ? transaction.quantity *
                transaction.price *
                getFxRate(fxTable.prices, transaction.date)
            : transaction.quantity * transaction.price
        );
      } else if (transaction.type === 'withdrawal') {
        foundData.withdrawal += Math.round(
          transaction.currency === 'usd'
            ? transaction.quantity *
                transaction.price *
                getFxRate(fxTable.prices, transaction.date)
            : transaction.quantity * transaction.price
        );
      }
    }
  });

  let terms: TermsProps[] = []; // 예금 상품
  let result: {
    date: string;
    benchmarkValueKrw: number;
    benchmarkValueUsd: number;
  }[] = [];

  cashFlowData.forEach((flow) => {
    // 오늘 날짜에 걸쳐있는 terms는 제외하고, 그외 terms는 오늘이 올때까지 다시 생성해서 계산 (maturityDate를 startDate에 대입 후)
    if (flow.deposit > 0) {
      terms.push({
        startDate: flow.date,
        maturityDate: addOneYear(flow.date),
        principal: flow.deposit,
        interest: 0,
        interestRate: getCurrentRate(flow.date),
      });
    }

    // 출금이 발생하면 가장 가까운 과거 예금 상품을 찾아서 해당 상품의 principal -> interest 순으로 차감 (withdrawal이 0이 될때까지 반복)
    while (flow.withdrawal > 0) {
      // 예금 상품 역방향 정렬
      terms.sort((a, b) => {
        return (
          new Date(b.maturityDate).getTime() -
          new Date(a.maturityDate).getTime()
        );
      });

      const findTerm = terms[0];
      if (findTerm) {
        // 출금액이 예금 상품의 원금+이자보다 크면 해당 상품 삭제
        if (findTerm.principal + findTerm.interest <= flow.withdrawal) {
          flow.withdrawal -= findTerm.principal + findTerm.interest; // 출금액 차감
          terms.shift(); // 예금 상품 삭제
        } else {
          // 출금액이 원금+이자보다 작을 경우
          if (findTerm.principal < flow.withdrawal) {
            // 원금보다 크다면 원금 제거하고 이자만 남김
            flow.withdrawal -= findTerm.principal; // 원금만큼 출금액 차감
            findTerm.principal = 0; // 원금 차감
            findTerm.interest -= flow.withdrawal; // 이자까지 차감
          } else {
            // 원금보다 작다면 원금만큼 차감
            findTerm.principal -= flow.withdrawal; // 원금 차감
          }
          flow.withdrawal = 0; // 출금액 0으로 초기화
          break;
        }
      } else {
        break;
      }
    }

    let currentValue = 0; // 현재 평가금액

    // 이자 지급
    terms.forEach((term) => {
      currentValue += term.principal + term.interest; // 평가금액 계산

      term.interest =
        term.interest + term.principal * (term.interestRate / 100 / 365); // 이자 계산

      // 만기일이 지난 상품은 재예치
      if (term.maturityDate < flow.date) {
        term.startDate = flow.date;
        term.maturityDate = addOneYear(flow.date);
        term.principal = term.principal + term.interest; // 원금에 이자 합산해서 재예치
        term.interest = 0; // 이자 초기화
        term.interestRate = getCurrentRate(flow.date) * (1 - krDividendTax); // 출금 이자 계산 로직이 복잡해져서 그냥 세후 이자율로 계산
      }
    });

    result.push({
      date: flow.date,
      benchmarkValueKrw: Math.round(currentValue),
      benchmarkValueUsd: Math.round(
        currentValue / getFxRate(fxTable.prices, flow.date)
      ),
    });
  });

  return result;
};

// 가장 가까운 날짜의 환율 찾기
export function getFxRate(
  entries: StockHistoryProps[],
  targetDate: string
): number {
  const exact = entries.find((e) => e.date === targetDate);
  if (exact) {
    return exact.close;
  }

  const earlier = entries.filter((e) => e.date < targetDate);
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
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return pastRates[0].interestRate;
};
