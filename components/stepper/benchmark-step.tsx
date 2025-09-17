import { InterestRatePanel } from './interest-rate-panel';
import CheckboxGroup from '../ui/checkbox-group';
import { useState } from 'react';

const stockIndicators = [
  { id: 'us-sp500', label: '미국 - S&P 500', disabled: true },
  { id: 'jp-nikkei225', label: '일본 - 니케이 225', disabled: true },
  { id: 'eu-eurostoxx50', label: '유럽 - Euro Stoxx 50', disabled: true },
  { id: 'hk-hsi', label: '홍콩 - 항셍지수 (HSI)', disabled: true },
  { id: 'kr-kospi', label: '대한민국 - KOSPI', disabled: true },
  { id: 'deposit', label: '예금' },
];

export const BenchmarkStep = () => {
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);

  return (
    <>
      <CheckboxGroup
        options={stockIndicators}
        onChange={(selected) => {
          setSelectedIndicators(selected);
        }}
        // defaultSelected={['deposit']}
      />
      {selectedIndicators.includes('deposit') && <InterestRatePanel />}
    </>
  );
};
