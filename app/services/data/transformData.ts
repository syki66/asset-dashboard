import { StockHistoryProps } from '@/types';
import { timestampToDate } from '@/utils/format';

// 야후 금융 API로부터 데이터 변환
export function transformYahooHistoryData(data: any): StockHistoryProps[] {
  const { timestamp, indicators, events } = data.chart.result[0];

  const historyData = timestamp.map((timestamp: number, index: number) => {
    // 액면분할, 액면병합 데이터를 돌면서 당시 가격으로 복구
    let multiplier = 1;

    if (events?.splits) {
      for (const key in events.splits) {
        if (
          new Date(timestampToDate(timestamp)) <
          new Date(timestampToDate(events.splits[key].date))
        ) {
          multiplier *=
            events.splits[key].numerator / events.splits[key].denominator;
          break;
        }
      }
    }

    const close = indicators.quote[0].close[index]; // 종가

    return {
      date: timestampToDate(timestamp),
      preSplitClose: close * multiplier, // 액면병합, 액면분할 이전 종가
      close: close, // 종가
      adjClose: indicators.adjclose[0].adjclose[index], // 조정종가
      dividends: events?.dividends?.[timestamp]?.amount, // 배당금
    };
  });

  return historyData;
}
