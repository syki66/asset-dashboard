import { StockHistoryProps } from '@/types';
import { timestampToDate } from '@/utils/format';

// 야후 금융 API로부터 데이터 변환
export function transformYahooHistoryData(data: any): StockHistoryProps[] {
  const { timestamp, indicators, events } = data.chart.result[0];

  return timestamp.map((timestamp: number, index: number) => ({
    date: timestampToDate(timestamp),
    close: indicators.quote[0].close[index], // 종가
    adjClose: indicators.adjclose[0].adjclose[index], // 조정종가
    dividends: events?.dividends?.[timestamp]?.amount, // 배당금
  }));
}
