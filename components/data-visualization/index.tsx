'use client';

import { useEffect, useState } from 'react';
import { MainChart } from './main-chart';
import { AccountProps } from '@/types';
import AccountInfo from './account-info';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { shsecCsvToJson, createShsecTransactions } from '@/utils/shsec-adapter';
import { createAccountData, getStockInfo } from '@/utils/converter';
import { ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';

const readFile = async (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('파일을 읽는 데 실패했습니다.'));
    reader.readAsText(file); // 파일을 텍스트로 읽음 (필요에 따라 readAsArrayBuffer 등 변경 가능)
  });
};

export default function DataVisualization() {
  const [file, setFile] = useState<File | null>(null);

  const { data: accountData, refetch } = useQuery({
    queryKey: ['accountData'],
    queryFn: async () => {
      if (!file) return Promise.reject('No file selected');

      const fileContent = await readFile(file); // 파일 내용 읽기
      const shsecJson = shsecCsvToJson(fileContent); // 신한증권 csv 데이터를 json으로 변환
          const transactions = createShsecTransactions(shsecJson); // 신한증권 json 데이터를 거래내역으로 변환
      const accountData = await createAccountData(transactions); // 거래내역을 날짜별 계좌정보로 변환

      return accountData;
    },
    enabled: !!file, // 파일이 없을 때 실행 방지
  });

  return (
    <>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="picture">import CSV File</Label>
        <Input
          id="picture"
          type="file"
          accept=".csv"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setFile(e.target.files[0]); // 파일 선택
              refetch(); // 파일 선택 시 query 재실행
            }
          }}
        />
      </div>
      {/* <MainChart
        chartData={chartData}
        chartConfig={{
          evaluationAmount: {
            label: '평가금액',
            color: 'hsl(var(--chart-1))',
          },
          principalAmount: {
            label: '원금',
            color: 'hsl(var(--chart-2))',
          },
        }}
      /> */}
      <AccountInfo accountData={accountData} />
    </>
  );
}
