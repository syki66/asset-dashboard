import { transactionProps } from '@/types';
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

  const transactions = json.map((item) => {
    // 새로운 데이터 객체 생성
    const _itemData: transactionProps = {
      date: '',
      type: '',
      currency: '',
      ISIN: '',
      quantity: 0,
      price: 0,
      krwCash: 0,
      usdCash: 0,
    };

    // USD RP 계산은 이자를 포함한 금액이 출금되어서 실제 보다 적게 표시됨. 따라서 음수로 찍힐때마다 0으로 초기화해서 보정함.
    if (_usdRp < 0) {
      _usdRp = 0;
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

    if (item['종목번호'] === 'KRW') {
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
    if (item['구분'] === '외화RP_매수') {
      _usdRp += Number(item['수량']); // USD RP 잔고 업데이트
      _usdRp = Number(_usdRp.toFixed(2));
    }
    if (item['구분'] === '외화RP_매도') {
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

    if (item['종목번호'] === 'USD') {
      _usdDeposit = Number(item['최종금액']);
    }

    // 입금고 데이터 대입
    const isDeposit = [
      '은행이체입금',
      '계좌입금',
      '계좌대체입금',
      '(펌뱅킹)입금',
      '은행이체외화입금', // USD
    ].some((keyword) => item['구분'].endsWith(keyword));

    // 출금고 데이터 대입
    const isWithdrawal = [
      '은행이체출금',
      '계좌출금',
      '계좌대체출금',
      '(펌뱅킹)출금',
      '체크카드승인',
      '체크카드대체출금',
      '은행이체외화출금', // USD, 테스트 csv에 해당 데이터가 없어서 추정하는 키값임
    ].some((keyword) => item['구분'].endsWith(keyword));

    // 해외주식 매수, 매도 데이터 대입
    const isUsStockBuy = ['해외증권_해외주식매수'].some(
      (keyword) => item['구분'] === keyword
    );
    const isUsStockSell = ['해외증권_해외주식매도'].some(
      (keyword) => item['구분'] === keyword
    );

    // 국내주식 매수, 매도 데이터 대입
    const isKrStockBuy = ['장내_매수', '공모주입고'].some(
      (keyword) => item['구분'] === keyword
    );
    const isKrStockSell = ['장내_매도', '코스닥_매도'].some(
      (keyword) => item['구분'] === keyword
    );

    // 배당금 데이터 대입
    const isDividend = [
      '해외배당금',
      '배당금',
      '증금예금_증금예금상환',
      'RP_매도',
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
        _itemData.quantity = 1;
        _itemData.price =
          item['구분'] === '배당금' || item['구분'] === '해외배당금'
            ? Number(item['거래대금'])
            : Number(item['세전이자']);
        break;
      default:
        break;
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

    return _itemData;
  });

  return transactions.flat().filter((item) => item.type !== ''); // 평탄화 및 타입 없는 데이터 제거
};
