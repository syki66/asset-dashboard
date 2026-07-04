import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { PrincipalAdjustment } from '@/types';
import { Calculator, RotateCcw, WalletCards } from 'lucide-react';

interface PrincipalAdjustmentStepProps {
  uploadedFiles: File[];
  principalAdjustments: Record<string, PrincipalAdjustment>;
  getFileKey: (file: File) => string;
  setPrincipalAdjustment: (
    fileKey: string,
    currency: keyof PrincipalAdjustment,
    value: number,
  ) => void;
  resetPrincipalAdjustment: (fileKey: string) => void;
}

const parseAmount = (value: string) => {
  const normalizedValue = normalizeAmountInput(value);
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

// 입력 중인 값에서 숫자, 소수점, 맨 앞의 음수 기호만 남깁니다.
const normalizeAmountInput = (value: string) => {
  const sanitizedValue = value.replaceAll(',', '').replace(/[^\d.-]/g, '');
  const isNegative = sanitizedValue.startsWith('-');
  const unsignedValue = sanitizedValue.replaceAll('-', '');
  const hasDecimalPoint = unsignedValue.includes('.');
  const [integerPart = '', ...decimalParts] = unsignedValue.split('.');
  const decimalPart = decimalParts.join('');

  return `${isNegative ? '-' : ''}${integerPart}${
    hasDecimalPoint ? `.${decimalPart}` : ''
  }`;
};

// 저장된 숫자 값을 입력창 표시용 쉼표 문자열로 변환합니다.
const formatAmountInput = (value: number) => {
  if (value === 0) return '';

  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 10,
  }).format(value);
};

// '-'처럼 아직 숫자가 완성되지 않은 입력은 유지하면서 쉼표만 적용합니다.
const formatAmountInputText = (value: string) => {
  const normalizedValue = normalizeAmountInput(value);

  if (
    normalizedValue === '' ||
    normalizedValue === '-' ||
    normalizedValue === '.' ||
    normalizedValue === '-.'
  ) {
    return normalizedValue;
  }

  const isNegative = normalizedValue.startsWith('-');
  const unsignedValue = isNegative
    ? normalizedValue.slice(1)
    : normalizedValue;
  const hasDecimalPoint = unsignedValue.includes('.');
  const [integerPart = '', decimalPart = ''] = unsignedValue.split('.');
  const formattedInteger =
    integerPart === ''
      ? ''
      : new Intl.NumberFormat('ko-KR').format(Number(integerPart));

  return `${isNegative ? '-' : ''}${formattedInteger}${
    hasDecimalPoint ? `.${decimalPart}` : ''
  }`;
};

export function PrincipalAdjustmentStep({
  uploadedFiles,
  principalAdjustments,
  getFileKey,
  setPrincipalAdjustment,
  resetPrincipalAdjustment,
}: PrincipalAdjustmentStepProps) {
  // '-' 단독 입력 같은 중간 상태를 보존하기 위해 실제 숫자값과 별도의 입력 문자열을 관리합니다.
  const [draftAmounts, setDraftAmounts] = useState<Record<string, string>>({});
  const getDraftKey = (
    fileKey: string,
    currency: keyof PrincipalAdjustment,
  ) => `${fileKey}-${currency}`;
  const getAmountInputValue = (
    fileKey: string,
    currency: keyof PrincipalAdjustment,
    value: number,
  ) => draftAmounts[getDraftKey(fileKey, currency)] ?? formatAmountInput(value);
  const handleAmountChange = (
    fileKey: string,
    currency: keyof PrincipalAdjustment,
    value: string,
  ) => {
    const formattedValue = formatAmountInputText(value);

    setDraftAmounts((current) => ({
      ...current,
      [getDraftKey(fileKey, currency)]: formattedValue,
    }));
    setPrincipalAdjustment(fileKey, currency, parseAmount(formattedValue));
  };
  const clearDraftAmount = (
    fileKey: string,
    currency: keyof PrincipalAdjustment,
  ) => {
    setDraftAmounts((current) => {
      const next = { ...current };
      delete next[getDraftKey(fileKey, currency)];
      return next;
    });
  };
  const handleResetPrincipalAdjustment = (fileKey: string) => {
    setDraftAmounts((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([draftKey]) =>
          !draftKey.startsWith(`${fileKey}-`),
        ),
      ),
    );
    resetPrincipalAdjustment(fileKey);
  };

  if (uploadedFiles.length === 0) {
    return (
      <div className='rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-8 text-center shadow-sm backdrop-blur-md'>
        <WalletCards className='mx-auto h-8 w-8 text-muted-foreground' />
        <p className='mt-3 text-sm font-semibold text-foreground'>
          먼저 CSV 파일을 업로드해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='rounded-xl border border-[color:var(--setup-primary,var(--primary))]/20 bg-[color:var(--setup-primary,var(--primary))]/5 p-4 shadow-sm backdrop-blur-md'>
        <div className='flex items-start gap-3'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08]'>
            <Calculator className='h-4 w-4 text-[color:var(--setup-primary,var(--primary))]' />
          </div>
          <div>
            <h4 className='text-sm font-bold'>파일별 원금 보정</h4>
            <p className='mt-1 text-sm leading-6 text-muted-foreground'>
              CSV의 입출금 내역만으로 계산된 원금에 더하거나 뺄 금액을
              입력합니다. 다른 통화로는 첫 거래일 환율을 기준으로 고정 환산됩니다.
            </p>
          </div>
        </div>
      </div>

      <div className='space-y-3'>
        {uploadedFiles.map((file) => {
          const fileKey = getFileKey(file);
          const adjustment = principalAdjustments[fileKey] ?? {
            krw: 0,
            usd: 0,
          };

          return (
            <div
              key={fileKey}
              className='rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-sm backdrop-blur-md'
            >
              <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <WalletCards className='h-4 w-4 shrink-0 text-[color:var(--setup-primary,var(--primary))]' />
                    <h4 className='truncate text-sm font-bold'>{file.name}</h4>
                  </div>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    양수는 원금 증가, 음수는 원금 차감으로 적용됩니다.
                  </p>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => handleResetPrincipalAdjustment(fileKey)}
                  className='h-8 shrink-0 cursor-pointer rounded-lg text-xs'
                >
                  <RotateCcw className='h-3.5 w-3.5' />
                  초기화
                </Button>
              </div>

              <div className='mt-4 grid gap-3 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor={`${fileKey}-krw`} className='text-xs font-semibold'>
                    원화 보정액
                  </Label>
                  <div className='relative'>
                    <Input
                      id={`${fileKey}-krw`}
                      type='text'
                      inputMode='decimal'
                      value={getAmountInputValue(fileKey, 'krw', adjustment.krw)}
                      placeholder='0'
                      onChange={(event) =>
                        handleAmountChange(fileKey, 'krw', event.target.value)
                      }
                      onBlur={() => clearDraftAmount(fileKey, 'krw')}
                      className='rounded-xl border-white/15 bg-white/[0.08] pr-9 text-right shadow-sm focus-visible:ring-[color:var(--setup-primary,var(--primary))]/35'
                    />
                    <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground'>
                      원
                    </span>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor={`${fileKey}-usd`} className='text-xs font-semibold'>
                    달러 보정액
                  </Label>
                  <div className='relative'>
                    <Input
                      id={`${fileKey}-usd`}
                      type='text'
                      inputMode='decimal'
                      value={getAmountInputValue(fileKey, 'usd', adjustment.usd)}
                      placeholder='0'
                      onChange={(event) =>
                        handleAmountChange(fileKey, 'usd', event.target.value)
                      }
                      onBlur={() => clearDraftAmount(fileKey, 'usd')}
                      className='rounded-xl border-white/15 bg-white/[0.08] pr-12 text-right shadow-sm focus-visible:ring-[color:var(--setup-primary,var(--primary))]/35'
                    />
                    <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground'>
                      USD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
