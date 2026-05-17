'use client';

import type React from 'react';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
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
import { useAccountStore } from '@/store/account';
import { useSelectedAccountsStore } from '@/store/selectedAccounts';

export default function Page() {
  const totalAccountData = useAccountStore((state) => state.totalAccountData);
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
