export const PRINCIPAL_INFO =
  '입금 총액에서 출금 총액을 뺀 금액입니다. 타통화의 입출금과 주식 입출고는 해당 시점 환율로 계산합니다.';

export const CURRENT_VALUE_INFO =
  '국내·해외 주식 평가액에 현금성 잔고(원화·달러 예수금, 외화 RP, MMW)를 더한 금액입니다. 선택 통화 기준으로 합산하며, 외화 자산은 해당 날짜의 환율로 환산합니다.';

export const NET_CURRENT_VALUE_INFO =
  '평가금액에서 추정 세금 및 제비용을 차감한 금액입니다.';

export const PROFIT_INFO =
  '평가금액에서 원금을 뺀 누적 손익입니다. 세후 보기에서는 추정 세금 및 제비용을 차감한 값을 사용합니다.';

export const RETURN_RATE_INFO =
  '누적수익금을 원금으로 나눈 비율입니다. 원금이 0에 가까운 경우 수익률 해석이 왜곡될 수 있습니다.';

export const MWR_INFO =
  '입출금 시점과 금액을 반영한 연환산 수익률로, 예금 상품의 금리와 비교할 수 있습니다.\n(0%는 실제 수익률이 0%이거나, 현금흐름 구조상 계산이 불가능해 0으로 표시된 값일 수 있습니다.)';

export const DIVIDEND_YIELD_INFO =
  '최근 1년 배당금을 현재 평가금액으로 나눈 비율입니다. 세후 보기에서는 배당세를 차감한 배당금을 사용합니다.';

export const DIVIDENDS_INFO =
  '타통화의 배당금은 지급 당시 환율로 환산합니다. 세후 보기에서는 배당세를 차감한 값을 사용합니다.';

export const KRW_CASH_INFO =
  '원화 예수금에 원화 RP, MMW 등 원화 현금성 잔고를 더한 금액입니다.';

export const USD_CASH_INFO =
  '달러 예수금에 외화 RP 잔고를 더한 금액입니다.';

export const MAX_DRAWDOWN_INFO =
  '주식 평가손익의 이전 고점 대비 가장 크게 하락한 금액입니다. 과거 시점의 낙폭 금액은 해당 과거 시점의 환율로 환산합니다.';

export const DRAWDOWN_PERIOD_INFO =
  '최대 낙폭 이후 전고점을 다시 회복하는 데 걸린 기간입니다.';

export const DRAWDOWN_DAYS_INFO =
  '최대 낙폭 이후 전고점을 다시 회복하는 데 걸린 일수입니다.';

export const DAILY_DRAWDOWN_INFO =
  '전일 주식 평가손익 대비 하루 동안 가장 크게 감소한 금액입니다. 과거 시점의 낙폭 금액은 해당 과거 시점의 환율로 환산합니다.';

export const BEST_SHARPE_RATIO_INFO =
  '최근 90개 거래일의 TWR 일별 수익률을 사용하고, 사용자가 입력한 최상 금리를 무위험 수익률로 가정해 계산합니다.';

export const WORST_SHARPE_RATIO_INFO =
  '최근 90개 거래일의 TWR 일별 수익률을 사용하고, 사용자가 입력한 최악 금리를 무위험 수익률로 가정해 계산합니다.';

export const VOLATILITY_INFO =
  '최근 90개 거래일의 TWR 일별 수익률을 기반으로 계산합니다.';

export const BEST_WORST_YEAR_INFO =
  '연도별 수익금이 가장 컸던 해와 가장 작았던 해입니다. 세후 보기에서는 추정 세금 및 제비용을 차감한 순수익금을 기준으로 합니다.';
