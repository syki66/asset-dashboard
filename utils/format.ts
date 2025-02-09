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

// 시작날짜와 종료날짜 사이에 날짜를 담은 오브젝트 배열 생성
export const createDateArray = (dateStr1: string, dateStr2: string) => {
  // 입력된 날짜 문자열을 Date 객체로 변환
  const startDate = new Date(dateStr1);
  const endDate = new Date(dateStr2);

  // 시작 날짜와 종료 날짜를 비교하여 순서 정하기
  let start = startDate;
  let end = endDate;
  if (startDate > endDate) {
    start = endDate;
    end = startDate;
  }

  const datesArray = []; // 결과를 담을 배열 초기화
  let currentDate = new Date(start); // 시작 날짜부터 순회하기 위해 현재 날짜를 시작 날짜로 설정

  // 현재 날짜가 종료 날짜보다 작거나 같을 때까지 반복
  while (currentDate <= end) {
    // 날짜를 "YYYY-MM-DD" 형식의 문자열로 포맷
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 1을 더하고, 2자리로 만들기
    const day = String(currentDate.getDate()).padStart(2, '0'); // 일을 2자리로 만들기
    const formattedDate = `${year}-${month}-${day}`;

    // 포맷된 날짜 문자열을 { date: "YYYY-MM-DD" } 형식의 객체로 만들어 배열에 추가
    datesArray.push({ date: formattedDate });

    // 현재 날짜를 하루 증가
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return datesArray; // 생성된 날짜 배열 반환
};

// yyyy-mm-dd 형식의 문자열을 timestamp로 변환
export const dateToTimestamp = (dateString: string) => {
  const date = new Date(dateString);
  const timestamp = Math.floor(date.getTime() / 1000); // 밀리초를 초 단위로 변환 후 내림
  return timestamp;
};
