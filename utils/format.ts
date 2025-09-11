// timestamp를 YYYY-MM-DD 형식으로 변환
export const timestampToDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 신한증권 date 형식을 YYYY-MM-DD 형식으로 변환
export const formatShinhanDate = (date: string) => {
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6, 8);
  return `${year}-${month}-${day}`;
};

// yyyy-mm-dd 형식의 문자열을 timestamp로 변환
export const dateToTimestamp = (dateString: string) => {
  const date = new Date(dateString);
  const timestamp = Math.floor(date.getTime() / 1000); // 밀리초를 초 단위로 변환 후 내림
  return timestamp;
};

// 주어진 날짜 범위 내에 모든 날짜를 배열로 반환
export const generateDateObjects = (
  startDate: string,
  endDate: string
): { date: string }[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const result: { date: string }[] = [];

  while (start <= end) {
    const formattedDate = start.toISOString().split('T')[0];
    result.push({ date: formattedDate });
    start.setDate(start.getDate() + 1);
  }

  return result;
};

// YYYY-MM-dd 형식을 한국용 날짜로 변환
export const formatDateKr = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 월은 0부터 시작하므로 1을 더해줍니다.
  const day = date.getDate();

  return `${year}년 ${month}월 ${day}일`;
};

// 둘 중 최신 날짜 반환 (입력 형식: YYYY-MM-DD)
export const getLatestDate = (date1: string, date2: string): string => {
  const timestamp1 = dateToTimestamp(date1);
  const timestamp2 = dateToTimestamp(date2);
  return timestamp1 > timestamp2 ? date1 : date2;
};

// 금액을 통화 형식으로 변환
export function formatCurrency(
  amount: number,
  currency: 'usd' | 'krw'
): string {
  if (currency === 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } else {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
