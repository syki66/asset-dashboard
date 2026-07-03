import { Input } from '@/components/ui/input';
import {
  defaultFeeSettings,
  type FeeSettings,
  useFeeSettingsStore,
} from '@/store/fee-settings';
import { useEffect, useState } from 'react';

type FeeSettingItem = {
  key: keyof FeeSettings;
  label: string;
  description: string;
};

const feeSettingGroups: {
  title: string;
  description: string;
  items: FeeSettingItem[];
}[] = [
  {
    title: '환전',
    description: '달러 자산을 원화로 환산할 때 적용할 추정 환전 비용입니다.',
    items: [
      {
        key: 'exchangeSpreadRate',
        label: '환스프레드',
        description: '매수/매도 환율 차이로 보는 기본 스프레드',
      },
      {
        key: 'exchangeFeeRate',
        label: '환전우대',
        description: '환전 스프레드에서 할인받는 비율',
      },
    ],
  },
  {
    title: '국내 주식',
    description: '국내 주식 매도 시 차감할 수수료와 세금입니다.',
    items: [
      {
        key: 'krBrokerFeeRate',
        label: '증권사 수수료',
        description: '국내 주식 거래 수수료',
      },
      {
        key: 'krRegulatoryFeeRate',
        label: '유관기관수수료',
        description: '거래소/예탁원 등 유관기관 제비용',
      },
      {
        key: 'krTransferTaxRate',
        label: '증권거래세',
        description: '국내 주식 매도 시 적용',
      },
    ],
  },
  {
    title: '미국 주식',
    description: '미국 주식 매도와 양도차익에 적용할 비용입니다.',
    items: [
      {
        key: 'usBrokerFeeRate',
        label: '증권사 수수료',
        description: '미국 주식 거래 수수료',
      },
      {
        key: 'usSecFeeRate',
        label: 'SEC Fee',
        description: '미국 주식 매도 시 부과되는 제비용',
      },
      {
        key: 'usCapitalGainsTaxRate',
        label: '양도소득세',
        description: '양도차익이 양수일 때 적용',
      },
    ],
  },
  {
    title: '배당/이자',
    description: '배당금과 예금 이자의 세후 금액 계산에 사용합니다.',
    items: [
      {
        key: 'usDividendTaxRate',
        label: '미국 배당 원천징수',
        description: '미국 배당금 세후 계산',
      },
      {
        key: 'krDividendTaxRate',
        label: '국내 배당/이자 세금',
        description: '국내 배당 및 예금 이자 세후 계산',
      },
    ],
  },
];

const getMaxFractionDigits = (key: keyof FeeSettings) =>
  key === 'krRegulatoryFeeRate' ? 8 : 6;

const toPercent = (value: number, maxFractionDigits = 6) =>
  Number((value * 100).toFixed(maxFractionDigits)).toString();

const toRate = (value: string) => {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) return 0;
  return parsedValue / 100;
};

const getDisplayPercent = (key: keyof FeeSettings, value: number) => {
  if (key === 'exchangeFeeRate') {
    return toPercent(1 - value, getMaxFractionDigits(key));
  }

  return toPercent(value, getMaxFractionDigits(key));
};

const getSettingRate = (key: keyof FeeSettings, value: string) => {
  const rate = toRate(value);

  if (key === 'exchangeFeeRate') {
    return 1 - rate;
  }

  return rate;
};

export function FeeSettingsStep() {
  const { feeSettings, setFeeSetting } = useFeeSettingsStore();
  const [draftValues, setDraftValues] = useState<Record<keyof FeeSettings, string>>(
    () =>
      Object.fromEntries(
        Object.entries(feeSettings).map(([key, value]) => [
          key,
          getDisplayPercent(key as keyof FeeSettings, value),
        ]),
      ) as Record<keyof FeeSettings, string>,
  );

  useEffect(() => {
    setDraftValues(
      Object.fromEntries(
        Object.entries(feeSettings).map(([key, value]) => [
          key,
          getDisplayPercent(key as keyof FeeSettings, value),
        ]),
      ) as Record<keyof FeeSettings, string>,
    );
  }, [feeSettings]);

  const handleRateChange = (key: keyof FeeSettings, value: string) => {
    const maxFractionDigits = getMaxFractionDigits(key);
    const ratePattern = new RegExp(
      `^\\d{0,3}(\\.\\d{0,${maxFractionDigits}})?$`,
    );

    if (value !== '' && !ratePattern.test(value)) return;
    const numberValue = Number(value);
    if (value !== '' && (!Number.isFinite(numberValue) || numberValue > 100)) {
      return;
    }

    setDraftValues((prev) => ({ ...prev, [key]: value }));

    if (value !== '') {
      setFeeSetting(key, getSettingRate(key, value));
    }
  };

  const handleRateBlur = (key: keyof FeeSettings) => {
    setDraftValues((prev) => ({
      ...prev,
      [key]:
        prev[key] === ''
          ? getDisplayPercent(key, feeSettings[key])
          : prev[key],
    }));
  };

  return (
    <div>
      <div className='grid gap-4 lg:grid-cols-2'>
        {feeSettingGroups.map((group) => (
          <section
            key={group.title}
            className='rounded-2xl border border-white/15 bg-white/[0.035] p-4 shadow-sm backdrop-blur-md'
          >
            <div className='mb-4'>
              <h4 className='text-sm font-bold text-foreground'>
                {group.title}
              </h4>
              <p className='mt-1 text-xs text-muted-foreground'>
                {group.description}
              </p>
            </div>
            <div className='space-y-3'>
              {group.items.map((item) => (
                <label
                  key={item.key}
                  className='grid gap-2 rounded-xl border border-white/15 bg-white/[0.04] p-3 shadow-[0_4px_14px_rgba(15,23,42,0.04)] backdrop-blur-md transition-colors duration-200 hover:bg-white/[0.1]'
                >
                  <div className='flex items-center justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='text-sm font-semibold text-foreground'>
                        {item.label}
                      </div>
                      <div className='mt-0.5 text-xs text-muted-foreground'>
                        {item.description}
                      </div>
                    </div>
                    <div className='flex w-32 shrink-0 items-center gap-1'>
                      <Input
                        type='number'
                        min={0}
                        max={100}
                        step={
                          item.key === 'krRegulatoryFeeRate'
                            ? '0.00000001'
                            : '0.000001'
                        }
                        value={draftValues[item.key]}
                        onChange={(event) =>
                          handleRateChange(item.key, event.target.value)
                        }
                        onBlur={() => handleRateBlur(item.key)}
                        className='h-8 border-white/15 bg-white/[0.04] px-2 text-right text-xs'
                      />
                      <span className='text-xs font-semibold text-muted-foreground'>
                        %
                      </span>
                    </div>
                  </div>
                  <div className='text-[11px] text-muted-foreground/80'>
                    기본값 {getDisplayPercent(item.key, defaultFeeSettings[item.key])}%
                  </div>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
