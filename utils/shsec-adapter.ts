import { TransactionProps } from '@/types';
import { formatShinhanDate } from './format';

export const shsecCsvToJson = (csv: string) => {
  const lines = csv.trim().split('\r\n'); // 줄별로 나누기

  // 두 줄씩 묶어서 합치기
  const data = [];
  for (let i = 0; i < lines.length; i++) {
    if (i % 2 === 0) data.push((lines[i] + lines[i + 1]).split(','));
  }

  // 첫 줄 제거하면서 column으로 저장
  const columns: string[] = data.shift() || [];

  // json 형식으로 변환
  const json = data.map((line) => {
    return columns.reduce((obj: { [key: string]: any }, column, index) => {
      obj[column] = line[index];
      return obj;
    }, {});
  });

  // 역순으로 정렬
  json.reverse();

  return json;
};

export const createShsecTransactions = (json: any[]) => {
  let _krwDeposit: number = 0; // 원화 예수금
  let _krwIpoDeposit: number = 0; // 공모주 청약 증거금 (원화)
  let _usdDeposit: number = 0; // USD 예수금
  let _usdRp: number = 0; // USD RP 잔고
  let _usdRpTotalPreTax = 0; // USD RP 이자 추적 (여러번 걸쳐서 같은 상품을 매도하더라도 `외화RP_매도` or `외화RP_재투자환매`에 [이자 + 매수 원금] 데이터가 들어있으며, `외화RP매도입금`에 [매수 원금] 데이터가 들어있어서 정확도가 보장됨)

  const transactions = json.map((item) => {
    // 새로운 데이터 객체 생성
    const _itemData: TransactionProps = {
      date: '',
      type: '',
      currency: '',
      ISIN: '',
      quantity: 0,
      price: 0,
      krwCash: 0,
      usdCash: 0,
    };

    // USD RP 세전 이자 추적
    if (
      item['구분'] === '외화RP_재투자환매' ||
      item['구분'] === '외화RP_매도'
    ) {
      _usdRpTotalPreTax = Number(item['수량']);
    }

    // krw 예수금 값 업데이트
    if (
      item['구분'] === '증금예금_증금예금상환' ||
      item['구분'] === '증금예금_증금예금매수' ||
      item['구분'] === '은행이체입금' ||
      item['구분'] === '은행이체출금' ||
      item['구분'] === '외화RP_재투자매수' ||
      item['구분'] === '외화RP_재투자환매' ||
      item['구분'] === '외화RP_매수' ||
      item['구분'] === '외화RP_매도' ||
      item['구분'] === '외화RP원천징수'
    ) {
      _krwDeposit = Number(item['최종금액']);
    }

    if (
      item['종목번호'] === 'KRW' &&
      (item['구분'] === '환전입금' || item['구분'] === '환전출금')
    ) {
      _krwDeposit = Number(item['최종금액']);
    }

    // 공모주 청약 증거금 값 업데이트
    if (item['구분'] === '공모불입') {
      _krwIpoDeposit = Number(item['거래대금']); // 공모주 청약 증거금 업데이트
      _krwDeposit = Number(item['최종금액']); // 원화 잔고 업데이트
    }
    if (item['구분'] === '공모주환불금') {
      _krwIpoDeposit = Number(item['가격']) * Number(item['수량']); // 배정 주식 평가액 업데이트
      _krwDeposit = Number(item['최종금액']); // 원화 잔고 업데이트
    }
    if (item['구분'] === '공모주입고') {
      _krwIpoDeposit = 0; // 공모주 청약 증거금 초기화
      _krwDeposit = Number(item['최종금액']); // 원화 잔고 업데이트
    }

    // USD_RP 잔고 업데이트
    if (
      item['구분'] === '외화RP_매수' ||
      item['구분'] === '외화RP_재투자매수'
    ) {
      _usdRp += Number(item['수량']); // USD RP 잔고 업데이트
      _usdRp = Number(_usdRp.toFixed(2));
    }
    if (
      item['구분'] === '외화RP_매도' ||
      item['구분'] === '외화RP_재투자환매'
    ) {
      _usdRp -= Number(item['수량']); // USD RP 잔고 업데이트
      _usdRp = Number(_usdRp.toFixed(2));
    }

    // USD 예수금 값 업데이트
    if (
      item['구분'] === '외화RP매수출금' ||
      item['구분'] === '외화RP매도입금' ||
      item['구분'] === '해외증권_해외주식매수' ||
      item['구분'] === '해외증권_해외주식매도' ||
      item['구분'] === '외국납부세액'
    ) {
      _usdDeposit = Number(item['최종금액']);
    }

    if (
      item['종목번호'] === 'USD' &&
      (item['구분'] === '환전입금' ||
        item['구분'] === '환전출금' ||
        item['구분'] === '해외배당금' ||
        item['구분'] === '은행이체외화입금')
    ) {
      _usdDeposit = Number(item['최종금액']);
    }

    // 입금고 데이터 대입
    const isDeposit = [
      '은행이체입금',
      '계좌입금', // TOSS계좌입금
      '계좌대체입금',
      '(펌뱅킹)입금',
      '은행이체외화입금', // USD
    ].some((keyword) => item['구분'].endsWith(keyword));

    // 출금고 데이터 대입
    const isWithdrawal = [
      '은행이체출금',
      '계좌출금', // 헥토파이낸셜계좌출금
      '계좌대체출금',
      '(펌뱅킹)출금', // 카카오페이(펌뱅킹)출금
      '체크카드승인',
      '체크카드대체출금',
      '은행이체외화출금', // USD, 테스트 csv에 해당 데이터가 없어서 추정하는 키값임
    ].some((keyword) => item['구분'].endsWith(keyword));

    // 해외주식 매수, 매도 데이터 대입
    const isUsStockBuy = ['해외증권_해외주식매수'].some(
      (keyword) => item['구분'] === keyword,
    );
    const isUsStockSell = ['해외증권_해외주식매도'].some(
      (keyword) => item['구분'] === keyword,
    );

    // 국내주식 매수, 매도 데이터 대입
    const isKrStockBuy = ['장내_매수', '공모주입고'].some(
      (keyword) => item['구분'] === keyword,
    );
    const isKrStockSell = ['장내_매도', '코스닥_매도'].some(
      (keyword) => item['구분'] === keyword,
    );

    // 배당금 데이터 대입
    const isDividend = [
      '해외배당금',
      '배당금',
      '증금예금_증금예금상환',
      'RP_매도',
      'RP_재투자환매',
    ].some((keyword) => item['구분'] === keyword);

    // 공통 데이터
    _itemData.date = formatShinhanDate(item['일자']);
    _itemData.usdCash = _usdDeposit + _usdRp;
    _itemData.krwCash = _krwDeposit + _krwIpoDeposit;

    switch (true) {
      case isDeposit:
        _itemData.type = 'deposit';
        _itemData.currency = item['구분'].endsWith('은행이체외화입금')
          ? 'usd'
          : 'krw';
        _itemData.quantity = 1;
        _itemData.price = Number(item['거래대금']);
        break;
      case isWithdrawal:
        _itemData.type = 'withdrawal';
        _itemData.currency = item['구분'].endsWith('은행이체외화출금')
          ? 'usd'
          : 'krw';
        _itemData.quantity = 1;
        _itemData.price = Number(item['거래대금']);
        break;
      case isUsStockBuy || isKrStockBuy:
        _itemData.type = 'buy';
        _itemData.currency = isUsStockBuy ? 'usd' : 'krw';
        _itemData.ISIN = item['종목번호'];
        _itemData.quantity = parseInt(item['수량']); // 소수점 주식 무시
        _itemData.price = Number(item['가격']);
        break;
      case isUsStockSell || isKrStockSell:
        _itemData.type = 'sell';
        _itemData.currency = isUsStockSell ? 'usd' : 'krw';
        _itemData.ISIN = item['종목번호'];
        _itemData.quantity = parseInt(item['수량']); // 소수점 주식 무시
        _itemData.price = Number(item['가격']);
        break;
      case isDividend:
        _itemData.type = 'dividend';
        _itemData.currency = item['구분'] === '해외배당금' ? 'usd' : 'krw';
        _itemData.dividendSource =
          item['구분'] === '해외배당금' ? 'foreign' : 'domestic';
        _itemData.quantity = 1;
        _itemData.price =
          item['구분'] === '배당금' || item['구분'] === '해외배당금'
            ? Number(item['거래대금'])
            : item['구분'] === 'RP_재투자환매'
              ? Number(item['거래대금'] - item['수량'])
              : Number(item['세전이자']);
        break;
      default:
        break;
    }

    // 외화 RP 이자 데이터 대입
    if (item['구분'] === '외화RP매도입금') {
      _itemData.type = 'dividend';
      _itemData.currency = 'usd';
      _itemData.dividendSource = 'domestic';
      _itemData.quantity = 1;
      _itemData.price = Number(item['거래대금']) - _usdRpTotalPreTax; // (원금+이자) - (원금)
    }

    // 타사대체입고 데이터는 buy, deposit 두 곳에 추가
    if (item['구분'] === '타사대체입고' || item['구분'] === '계좌대체입고') {
      _itemData.type = 'deposit';
      _itemData.currency = item['구분'] === '타사대체입고' ? 'usd' : 'krw';
      _itemData.ISIN = item['종목번호'];
      _itemData.quantity = Number(item['수량']);
      _itemData.price = Number(item['가격']);
      return [_itemData, { ..._itemData, type: 'buy' }];
    }

    // 타사대체출고 데이터는 withdrawal, sell 두 곳에 추가
    if (item['구분'] === '타사대체출고' || item['구분'] === '계좌대체출고') {
      _itemData.type = 'withdrawal';
      _itemData.currency = item['구분'] === '타사대체출고' ? 'usd' : 'krw';
      _itemData.ISIN = item['종목번호'];
      _itemData.quantity = Number(item['수량']);
      _itemData.price = Number(item['가격']);
      return [_itemData, { ..._itemData, type: 'sell' }];
    }

    return _itemData;
  });

  return transactions.flat().filter((item) => item.type !== ''); // 평탄화 및 타입 없는 데이터 제거
};
