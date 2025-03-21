export const USD_KRW_SYMBOL = 'KRW=X'; // 환율 심볼;
export const DEFAULT_FX_RATE = 1400; // 환율 값이 없을 때 기본값;

export const exchangeSpread = 1; // 환스프레드 1%
export const exchangeFee = 5; // 환전우대 95%

const krBrokerFee = 0; // 증권사 수수료 무료
const krRegulatoryFee = 0.0036396; // 유관기관수수료 (%)
const krTransferTax = 0.15; // 증권거래세 (%)

const usBrokerFee = 0.05; // 증권사 수수료 0.05%
const usCapitalGainsTax = 22; // 미국주식 양도소득세 (%)
const usSecFee = 0.00278; // 미국 SEC Fee (%)

export const krTotalFee =
  (krBrokerFee + krRegulatoryFee + krTransferTax) * 0.01;
export const usTotalFee = (usBrokerFee + usCapitalGainsTax + usSecFee) * 0.01;

export const usDividendTax = 15; // 미국 원천징수 배당소득세 15%
export const krDividendTax = 15.4; // 한국 배당소득세 15.4%
