import type {
  Currency,
  DashboardDataset,
  ReadonlyAccountProps,
  ReadonlyMergeAccountDataInput,
} from '@/types';
import type { FeeSettings } from '@/store/fee-settings';

type InterestRate = { date: string; interestRate: number };

type DatasetCacheInput = {
  selectionKey: string;
  currency: Currency;
  feeSettings: FeeSettings;
  bestInterestRates: readonly InterestRate[];
  worstInterestRates: readonly InterestRate[];
};

const touch = <Value>(cache: Map<string, Value>, key: string, value: Value) => {
  cache.delete(key);
  cache.set(key, value);
};

const setBounded = <Value>(
  cache: Map<string, Value>,
  key: string,
  value: Value,
  limit: number,
) => {
  touch(cache, key, value);
  while (cache.size > limit) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
};

/** 선택 순서와 중복 여부에 관계없이 같은 계좌 조합은 같은 키를 사용합니다. */
export const getAccountSelectionCacheKey = (accounts: readonly string[]) =>
  JSON.stringify([...new Set(accounts)].sort());

/**
 * 대시보드 레이아웃이 살아 있는 동안 최근 계좌 병합과 전체 계산 결과를 재사용합니다.
 * 계좌 원본 배열이 교체되면 이전 결과가 섞이지 않도록 모든 캐시를 폐기합니다.
 */
export class DashboardCalculationCache {
  private accountSource: readonly ReadonlyMergeAccountDataInput[] | null = null;
  private readonly mergedBySelection = new Map<
    string,
    readonly ReadonlyAccountProps[]
  >();
  private readonly datasets = new Map<string, DashboardDataset>();
  private readonly objectIds = new WeakMap<object, number>();
  private nextObjectId = 1;

  constructor(
    private readonly mergedLimit = 4,
    private readonly datasetLimit = 8,
  ) {}

  setAccountSource(source: readonly ReadonlyMergeAccountDataInput[]) {
    if (this.accountSource === source) return;

    this.accountSource = source;
    this.mergedBySelection.clear();
    this.datasets.clear();
  }

  getMerged(selectionKey: string) {
    const merged = this.mergedBySelection.get(selectionKey);
    if (merged) touch(this.mergedBySelection, selectionKey, merged);
    return merged;
  }

  setMerged(
    selectionKey: string,
    merged: readonly ReadonlyAccountProps[],
  ) {
    setBounded(
      this.mergedBySelection,
      selectionKey,
      merged,
      this.mergedLimit,
    );
  }

  getDataset(input: DatasetCacheInput) {
    const key = this.getDatasetKey(input);
    const dataset = this.datasets.get(key);
    if (dataset) touch(this.datasets, key, dataset);
    return dataset;
  }

  setDataset(input: DatasetCacheInput, dataset: DashboardDataset) {
    setBounded(
      this.datasets,
      this.getDatasetKey(input),
      dataset,
      this.datasetLimit,
    );
  }

  private getObjectId(value: object) {
    const existingId = this.objectIds.get(value);
    if (existingId !== undefined) return existingId;

    const id = this.nextObjectId++;
    this.objectIds.set(value, id);
    return id;
  }

  private getDatasetKey(input: DatasetCacheInput) {
    return [
      input.selectionKey,
      input.currency,
      this.getObjectId(input.feeSettings),
      this.getObjectId(input.bestInterestRates),
      this.getObjectId(input.worstInterestRates),
    ].join('|');
  }
}
