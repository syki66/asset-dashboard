// timestamp를 YYYY-MM-DD 형식으로 변환
export function timestampToDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 신한증권 date 형식을 YYYY-MM-DD 형식으로 변환
export function formatShinhanDate(date: string): string {
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6, 8);
  return `${year}-${month}-${day}`;
}

// yyyy-mm-dd 형식의 문자열을 timestamp로 변환
export function dateToTimestamp(dateString: string): number {
  const date = new Date(dateString);
  const timestamp = Math.floor(date.getTime() / 1000); // 밀리초를 초 단위로 변환 후 내림
  return timestamp;
}

// 주어진 날짜 범위 내에 모든 날짜를 배열로 반환
export function generateDateObjects(
  startDate: string,
  endDate: string
): { date: string }[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const result: { date: string }[] = [];

  while (start <= end) {
    const formattedDate = start.toISOString().split('T')[0];
    result.push({ date: formattedDate });
    start.setDate(start.getDate() + 1);
  }

  return result;
}

// YYYY-MM-dd 형식을 한국용 날짜로 변환
export function formatDateKr(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 월은 0부터 시작하므로 1을 더해줍니다.
  const day = date.getDate();

  return `${year}년 ${month}월 ${day}일`;
}

// 상대 시간 계산 (예: 3일 전, 2주 전, 5개월 전, 7년 전)
export function timeAgo(dateString: string): string {
  const inputDate = new Date(dateString);
  const now = new Date();

  if (isNaN(inputDate.getTime())) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD.');
  }

  const diffMs = now.getTime() - inputDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    return '오늘';
  }

  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffDays < 30) {
    return `${diffWeeks}주 전`;
  }

  const diffMonths =
    (now.getFullYear() - inputDate.getFullYear()) * 12 +
    (now.getMonth() - inputDate.getMonth());

  if (diffMonths < 12) {
    return `${diffMonths}달 전`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}년 전`;
}

// 둘 중 최신 날짜 반환 (입력 형식: YYYY-MM-DD)
export function getLatestDate(date1: string, date2: string): string {
  const timestamp1 = dateToTimestamp(date1);
  const timestamp2 = dateToTimestamp(date2);
  return timestamp1 > timestamp2 ? date1 : date2;
}

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

// 수익률에 따라 text-red-600 또는 text-blue-600 클래스를 반환
export function getReturnRateColorClass(returnRate: number): string {
  return returnRate >= 0 ? 'text-red-600' : 'text-blue-600';
}
