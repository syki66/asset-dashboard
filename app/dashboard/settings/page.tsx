'use client';

import type React from 'react';

import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import {
  CalendarRange,
  DollarSign,
  AwardIcon as Won,
  ChevronDown,
  ChevronUp,
  Minimize,
  Maximize,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { convertToDashboardData, mergeAccountData } from '@/utils/converter';
import { Currency, DashboardProps } from '@/types';
import { useAccountStore } from '@/store/account';
import { useDashboardStore } from '@/store/dashboard';
import { useCurrencyStore } from '@/store/options';
import { useSelectedAccountsStore } from '@/store/selectedAccounts';

export default function Page() {
  const totalAccountData = useAccountStore((state) => state.totalAccountData);
  const setDashboardData = useDashboardStore((state) => state.setDashboardData);
  const { currency, setCurrency } = useCurrencyStore() as {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
  };

  const { selectedAccounts, setSelectedAccounts } = useSelectedAccountsStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAccountToggle = (accountName: string) => {
    setSelectedAccounts(
      selectedAccounts.includes(accountName)
        ? selectedAccounts.filter((name) => name !== accountName)
        : [...selectedAccounts, accountName],
    );
  };

  const handleSelectAllAccounts = () => {
    if (selectedAccounts.length === totalAccountData?.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(totalAccountData?.map((acc) => acc.name) || []);
    }
  };

  // totalAccountData와 선택된 체크박스에 따라 병합된 데이터를 메모이제이션
  const mergedAccountData = useMemo(() => {
    if (!totalAccountData) return [];

    const filteredData =
      selectedAccounts.length > 0
        ? totalAccountData.filter((data) =>
            selectedAccounts.includes(data.name),
          )
        : [];
    return mergeAccountData(filteredData);
  }, [totalAccountData, selectedAccounts]);

  // 계좌 데이터가 변경될 때마다 전역 상태관리로 데이터 전달
  useEffect(() => {
    const dashboardData = convertToDashboardData(mergedAccountData, currency);
    if (dashboardData.length > 0) {
      setDashboardData(dashboardData.at(-1) as DashboardProps);
    }
  }, [mergedAccountData, currency]);

  return (
    <div className='relative mb-8'>
      <Card className='relative z-10'>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <div>
            <CardTitle>대시보드 설정</CardTitle>
            <CardDescription>
              데이터 표시 방식과 계좌 설정을 관리합니다
            </CardDescription>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='w-9 p-0'
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
            <span className='sr-only'>{isExpanded ? '접기' : '펼치기'}</span>
          </Button>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            {/* 세금 설정과 통화 설정을 가로로 배치 */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>통화 설정</h3>
                <div className='flex items-center space-x-2'>
                  <Switch
                    id='currency-mode'
                    checked={currency === 'usd'}
                    onCheckedChange={(checked) =>
                      setCurrency(checked ? 'usd' : 'krw')
                    }
                  />
                  <Label htmlFor='currency-mode' className='flex items-center'>
                    {currency === 'usd' ? (
                      <>
                        <DollarSign className='h-4 w-4 mr-1' />
                        <span>달러 (USD) 표시</span>
                      </>
                    ) : (
                      <>
                        <Won className='h-4 w-4 mr-1' />
                        <span>원화 (KRW) 표시</span>
                      </>
                    )}
                  </Label>
                </div>
                <p className='text-sm text-muted-foreground'>
                  {currency === 'usd'
                    ? `모든 금액은 달러(USD)로 표시됩니다.`
                    : '모든 금액은 원화(KRW)로 표시됩니다.'}
                </p>
              </div>
            </div>

            <Separator />

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium'>계좌 선택</h3>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='select-all'
                    checked={
                      selectedAccounts.length === totalAccountData?.length
                    }
                    onCheckedChange={handleSelectAllAccounts}
                  />
                  <Label htmlFor='select-all' className='text-sm'>
                    전체 선택
                  </Label>
                </div>
              </div>
              <div className='space-y-2'>
                {totalAccountData?.map((account) => (
                  <div
                    key={account.name}
                    className='flex items-center justify-between border p-3 rounded-md'
                  >
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id={`account-${account.name}`}
                        checked={selectedAccounts.includes(account.name)}
                        onCheckedChange={() =>
                          handleAccountToggle(account.name)
                        }
                      />
                      <Label htmlFor={`account-${account.name}`}>
                        {account.name}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
              <p className='text-sm text-muted-foreground'>
                선택한 계좌의 데이터만 대시보드에 표시됩니다.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
