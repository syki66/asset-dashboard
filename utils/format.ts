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
