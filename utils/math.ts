export const getAverage = (arr: number[]): number => {
  if (arr.length === 0) return 0; // 빈 배열인 경우 기본값 반환
  const sum = arr.reduce((acc, curr) => acc + curr, 0);
  return sum / arr.length;
};
