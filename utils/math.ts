export const getAverage = (arr: number[]): number => {
  const sum = arr.reduce((acc, curr) => acc + curr, 0);
  return sum / arr.length;
};
