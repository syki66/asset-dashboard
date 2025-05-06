import { parseISO, addYears, differenceInCalendarDays } from 'date-fns';
import { getStockInfo } from './converter';
import { USD_KRW_SYMBOL } from '@/constants/keywords';
import { timestampToDate } from './format';

export type TransactionProps = {
  date: string; // ISO 'YYYY-MM-DD'
  type: 'deposit' | 'withdrawal' | string;
  currency: 'KRW' | 'USD' | string;
  ISIN: string;
  quantity: number;
  price: number;
  krwCash: number;
  usdCash: number;
};

export interface RateEntry {
  date: string;
  interestRate: number; // 연이율 (%)
}

export interface FxEntry {
  date: string; // 환율 기준일
  fxRate: number; // USD→KRW 환율
}

export interface Evaluation {
  date: string;
  totalKRW: number; // 포트폴리오 총액 (KRW)
  totalUSD: number; // 포트폴리오 총액 (USD)
}

interface Term {
  startDate: Date;
  maturityDate: Date;
  principalKRW: number; // 내부 KRW 기준 원금
}

type Event = {
  date: Date;
  type: 'deposit' | 'withdrawal' | 'maturity' | string;
  tx?: TransactionProps;
  term?: Term;
};

function findRateForDate(rateTable: RateEntry[], target: Date): number {
  const eligibles = rateTable
    .filter((r) => parseISO(r.date) <= target)
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  if (!eligibles.length)
    throw new Error(`No rate for ${target.toISOString().slice(0, 10)}`);
  return eligibles[0].interestRate / 100;
}

function findFxRateForDate(fxTable: FxEntry[], target: Date): number {
  const eligibles = fxTable
    .filter((f) => parseISO(f.date) <= target)
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  if (!eligibles.length)
    throw new Error(`No fx rate for ${target.toISOString().slice(0, 10)}`);
  return eligibles[0].fxRate;
}

function insertEvent(events: Event[], e: Event) {
  const idx = events.findIndex((ev) => ev.date > e.date);
  if (idx === -1) events.push(e);
  else events.splice(idx, 0, e);
}

/**
 * 1년 만기 예금 계산: 입금→만기→재투자, 중도인출 처리
 * @param transactions 거래 목록
 * @param rateTable 금리 이력
 * @param simulationEnd optional simulation 종료일
 * @returns 각 이벤트 날짜별 KRW/USD 총액
 */
export async function calculateEvaluationsTermDeposit(
  transactions: TransactionProps[],
  rateTable: RateEntry[],
  simulationEnd?: Date // optional simulation 종료일
): Promise<Evaluation[]> {
  const { stockData } = await getStockInfo(
    transactions[0].date,
    timestampToDate(Math.floor(new Date().getTime() / 1000)),
    []
  );

  const fxTable = stockData[0].prices.map(
    (x: { date: string; close: number }) => ({
      date: x.date,
      fxRate: x.close,
    })
  );

  const terms: Term[] = [];
  const events: Event[] = [];
  const evaluations: Evaluation[] = [];

  // 종료일 미지정 시, 오늘을 종료일로 설정
  const simEnd = simulationEnd || new Date();

  // 1) 트랜잭션 이벤트 스케줄
  for (const tx of transactions) {
    const d = parseISO(tx.date);
    events.push({ date: d, type: tx.type, tx });
  }
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  // 2) 이벤트 처리 루프
  while (events.length) {
    const ev = events.shift()!;
    const today = ev.date;

    // console.log(terms);

    // 종료일 이후 이벤트는 무시
    if (today > simEnd) break;

    // -- 입금 --
    if (ev.type === 'deposit' && ev.tx) {
      const raw = ev.tx.quantity * ev.tx.price;
      const fx =
        ev.tx.currency === 'USD' ? findFxRateForDate(fxTable, today) : 1;
      const amountKRW = raw * fx;

      const term: Term = {
        startDate: today,
        maturityDate: addYears(today, 1),
        principalKRW: amountKRW,
      };
      terms.push(term);
      // 만기 이벤트가 종료일을 넘지 않을 때만 등록
      if (term.maturityDate <= simEnd) {
        insertEvent(events, {
          date: term.maturityDate,
          type: 'maturity',
          term,
        });
      }
    }

    // -- 만기 --
    if (ev.type === 'maturity' && ev.term) {
      const term = ev.term;
      const rate = findRateForDate(rateTable, term.startDate);
      // 원리금 지급액 계산 시, 이자에 대해 15.4% 차감
      const interest = term.principalKRW * rate;
      const netInterest = interest * (1 - 0.154);
      const payout = term.principalKRW + netInterest;
      term.startDate = today;
      term.maturityDate = addYears(today, 1);
      term.principalKRW = payout;
      // 재투자 시 만기 날짜가 종료일 이내인 경우에만 등록
      if (term.maturityDate <= simEnd) {
        insertEvent(events, {
          date: term.maturityDate,
          type: 'maturity',
          term,
        });
      }
    }

    // -- 출금 --
    if (ev.type === 'withdrawal' && ev.tx) {
      let remaining = ev.tx.quantity * ev.tx.price;
      if (ev.tx.currency === 'USD') {
        const fx = findFxRateForDate(fxTable, today);
        remaining *= fx;
      }
      // 만료 순으로 Term 정렬
      const sorted = terms.sort(
        (a, b) => a.maturityDate.getTime() - b.maturityDate.getTime()
      );
      for (const term of sorted) {
        if (remaining <= 0) break;
        const days = differenceInCalendarDays(today, term.startDate);
        const rate = findRateForDate(rateTable, term.startDate);
        // 원금에 대한 총 이자 (세전)
        const interestGross = (term.principalKRW * (rate * days)) / 365;
        // 출금 시 지급되는 이자: 15.4% 세금 차감 후
        const netInterest = interestGross * (1 - 0.154);
        const value = term.principalKRW + netInterest;
        const take = Math.min(remaining, value);
        remaining -= take;
        const leftoverValue = Math.max(0, value - take);
        // 남은 금액이 실제 원금에 해당하도록 역계산 (세후 이자 지급)
        const leftoverPrincipal =
          leftoverValue / (1 + ((rate * days) / 365) * (1 - 0.154));
        term.principalKRW = leftoverPrincipal;
        // 기존 startDate는 그대로 유지
      }
    }

    // -- 평가금 계산 및 기록 --
    const totalKRW = terms.reduce((sum, t) => {
      // 각 Term의 시작일로부터 오늘(today)까지의 날짜 차이
      const days = differenceInCalendarDays(today, t.startDate);
      // 해당 Term의 금리: deposit 당시의 금리 적용
      const rate = findRateForDate(rateTable, t.startDate);
      // 현재 금액: 원금 + (원금 * (금리 * days / 365))
      const accruedValue = t.principalKRW * (1 + (rate * days) / 365);
      return sum + accruedValue;
    }, 0);
    const fxNow = findFxRateForDate(fxTable, today);
    const totalUSD = totalKRW / fxNow;

    evaluations.push({
      date: today.toISOString().slice(0, 10),
      totalKRW,
      totalUSD,
    });
  }

  console.log(evaluations);

  return evaluations;
}
