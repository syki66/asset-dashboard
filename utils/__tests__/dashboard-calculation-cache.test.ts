import {
  DashboardCalculationCache,
  getAccountSelectionCacheKey,
} from '../dashboard-calculation-cache';
import type {
  DashboardDataset,
  ReadonlyAccountProps,
  ReadonlyMergeAccountDataInput,
} from '@/types';
import { defaultFeeSettings } from '@/store/fee-settings';

const makeDataset = (currency: 'krw' | 'usd'): DashboardDataset => ({
  snapshots: [],
  charts: {} as DashboardDataset['charts'],
  accountData: [],
  currency,
});

describe('DashboardCalculationCache', () => {
  test('계좌 선택 순서와 중복을 무시해 같은 조합 키를 만든다', () => {
    expect(getAccountSelectionCacheKey(['b.csv', 'a.csv', 'a.csv'])).toBe(
      getAccountSelectionCacheKey(['a.csv', 'b.csv']),
    );
  });

  test('같은 계좌 조합과 계산 입력의 데이터셋을 재사용한다', () => {
    const cache = new DashboardCalculationCache();
    const accountSource: ReadonlyMergeAccountDataInput[] = [];
    const bestInterestRates = [{ date: '2024-01-01', interestRate: 0.03 }];
    const worstInterestRates = [{ date: '2024-01-01', interestRate: 0.02 }];
    const input = {
      selectionKey: getAccountSelectionCacheKey(['account.csv']),
      currency: 'krw' as const,
      feeSettings: defaultFeeSettings,
      bestInterestRates,
      worstInterestRates,
    };
    const dataset = makeDataset('krw');

    cache.setAccountSource(accountSource);
    cache.setDataset(input, dataset);

    expect(cache.getDataset(input)).toBe(dataset);
    expect(cache.getDataset({ ...input, currency: 'usd' })).toBeUndefined();
    expect(
      cache.getDataset({ ...input, feeSettings: { ...defaultFeeSettings } }),
    ).toBeUndefined();
  });

  test('계좌 원본이 교체되면 병합 및 데이터셋 캐시를 비운다', () => {
    const cache = new DashboardCalculationCache();
    const selectionKey = getAccountSelectionCacheKey(['account.csv']);
    const merged: readonly ReadonlyAccountProps[] = [];
    const input = {
      selectionKey,
      currency: 'krw' as const,
      feeSettings: defaultFeeSettings,
      bestInterestRates: [],
      worstInterestRates: [],
    };

    cache.setAccountSource([]);
    cache.setMerged(selectionKey, merged);
    cache.setDataset(input, makeDataset('krw'));
    cache.setAccountSource([]);

    expect(cache.getMerged(selectionKey)).toBeUndefined();
    expect(cache.getDataset(input)).toBeUndefined();
  });
});
