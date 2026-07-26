import { koreaCpiIndexes } from '@/constants/korea-cpi-indexes';

const latestCpiIndex = koreaCpiIndexes[0]?.index ?? 100;

export function getCpiIndexForDate(date: string) {
  const month = date.slice(0, 7);
  const matchingEntry = koreaCpiIndexes.find((entry) => entry.date <= month);
  const oldestEntry = koreaCpiIndexes.at(-1);

  return matchingEntry?.index ?? oldestEntry?.index ?? latestCpiIndex;
}

export function adjustValueForInflation(value: number, date: string) {
  const dateIndex = getCpiIndexForDate(date);

  return value * (latestCpiIndex / dateIndex);
}
